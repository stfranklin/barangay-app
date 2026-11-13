import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Btn, Field, Page } from '../components/ui';
import { useAuth } from '../components/auth';
import { useApp, STATUSES, REJECTED, statusLabel } from '../components/store';
import { clinicBookingError } from '../components/bookingErrors';
import { supabase } from '../lib/supabase';

const Empty = ({ text }) => <Text className='mt-8 text-center text-muted'>{text}</Text>;

export function MyRequests({ onBack }) {
  const { requests, loadRequests } = useApp();
  const [err, setErr] = useState('');
  const refresh = async () => setErr((await loadRequests()) || '');
  return (
    <Page title='My Requests' onBack={onBack}>
      <Pressable onPress={refresh}><Text className='mb-3 text-sm font-semibold text-crimson'>Refresh</Text></Pressable>
      {err ? <Text className='mb-3 text-crimson'>{err}</Text> : null}
      {requests.length === 0 && <Empty text='No document requests yet.' />}
      {requests.map((r) => {
        const rejected = r.status === REJECTED;
        return (
          <View key={r.id} className='mb-3 rounded-2xl border-l-4 border-crimson bg-card p-4'>
            <Text className='font-bold text-white'>{r.doc}</Text>
            <Text className='text-sm text-muted'>{r.ref} | {r.date}</Text>
            <Text className={`mt-2 font-semibold ${rejected ? 'text-crimson' : r.status >= 3 ? 'text-green-500' : 'text-royal'}`}>{statusLabel(r.status)}</Text>
            {!rejected && (
              <View className='mt-2 flex-row gap-1'>
                {STATUSES.map((st, i) => (
                  <View key={st} className={`h-1 flex-1 rounded-full ${i <= r.status ? 'bg-crimson' : 'bg-line'}`} />
                ))}
              </View>
            )}
            {r.status === 3 && <Text className='mt-2 text-sm text-muted'>Ready for claiming at the Barangay Hall. Bring a valid ID and your reference number.</Text>}
          </View>
        );
      })}
    </Page>
  );
}

export function MyAppointments({ onBack, onSelect }) {
  const { bookings: localBookings } = useApp();
  const { session } = useAuth();
  const [clinicBookings, setClinicBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user?.id) {
      setClinicBookings([]);
      setLoading(false);
      return undefined;
    }
    let active = true;
    supabase.from('bookings')
      .select('id,date,time,nurse,service,start_time,end_time,status')
      .eq('kind', 'clinic')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        setClinicBookings(data || []);
        setError(queryError ? clinicBookingError(queryError, 'Could not load your appointments. Check your connection and try again.') : '');
        setLoading(false);
      })
      .catch((queryError) => {
        if (!active) return;
        setError(queryError?.message || 'Could not load your appointments.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [session?.user?.id]);

  const bookings = [...localBookings.filter((booking) => booking.kind !== 'clinic'), ...clinicBookings];
  return (
    <Page title='My Appointments' onBack={onBack}>
      {loading ? <Empty text='Loading appointments...' /> : null}
      {error ? <Text className='mt-4 text-crimson'>{error}</Text> : null}
      {!loading && !error && bookings.length === 0 && <Empty text='No bookings yet.' />}
      {bookings.map((b) => (
        <Pressable
          key={b.id}
          onPress={() => onSelect?.(b)}
          className={`mb-3 rounded-2xl border-l-4 bg-card p-4 ${b.kind === 'court' ? 'border-royal' : 'border-crimson'}`}
        >
          <Text className='font-bold text-white'>{b.service || b.title || 'Clinic appointment'}</Text>
          <Text className='text-muted'>{b.date} | {b.kind === 'court' ? `${b.startTime} - ${b.endTime}` : `at ${b.time}`}</Text>
          {b.kind === 'court' && <Text className='text-muted'>{b.hours} hour{b.hours === 1 ? '' : 's'} | PHP {b.fee}</Text>}
          {b.nurse && <Text className='text-muted'>{b.nurse}</Text>}
          {b.kind === 'clinic' && <Text className='mt-1 font-semibold text-royal'>{b.status || 'Pending'}</Text>}
          <Text className='mt-2 text-xs font-semibold text-muted'>View details</Text>
        </Pressable>
      ))}
    </Page>
  );
}

export function Notifications() {
  const { notes, markNotificationsRead } = useApp();
  useEffect(() => { markNotificationsRead(); }, [markNotificationsRead]);
  return (
    <Page title='Notifications'>
      {notes.length === 0 && <Empty text='No notifications yet.' />}
      {notes.map((n) => (
        <View key={n.id} className='mb-2 rounded-xl bg-card p-4'>
          <Text className='text-white'>{n.text}</Text>
        </View>
      ))}
    </Page>
  );
}

export function Profile({ go }) {
  const { profile, session, updateProfile, updatePassword, signOut } = useAuth();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const start = () => {
    setF({ full_name: profile?.full_name || '', address: profile?.address || '', contact: profile?.contact || '' });
    setErr('');
    setEdit(true);
  };
  const save = async () => {
    const e = await updateProfile(f);
    if (e) setErr(e); else setEdit(false);
  };
  const savePassword = async () => {
    setErr('');
    setPasswordMessage('');
    if (password.length < 8) return setErr('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setErr('Passwords do not match.');
    const e = await updatePassword(password);
    if (e) setErr(e);
    else {
      setPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    }
  };

  return (
    <Page title='Profile'>
      {edit ? (
        <>
          <Field label='Full name' value={f.full_name} onChangeText={set('full_name')} />
          <Field label='Address' value={f.address} onChangeText={set('address')} />
          <Field label='Contact number' value={f.contact} onChangeText={set('contact')} keyboardType='phone-pad' />
          {err ? <Text className='text-crimson'>{err}</Text> : null}
          <Btn label='Save changes' onPress={save} />
          <Btn outline label='Cancel' onPress={() => setEdit(false)} />
        </>
      ) : (
        <>
          <View className='mb-4 rounded-2xl bg-card p-4'>
            <Text className='text-lg font-bold text-white'>{profile?.full_name || 'Resident'}</Text>
            <Text className='text-muted'>{profile?.role === 'admin' ? 'Admin' : 'Resident'}</Text>
            <Text className='mt-2 text-muted'>{session?.user?.email}</Text>
            <Text className='text-muted'>{profile?.address}</Text>
            <Text className='text-muted'>{profile?.contact}</Text>
          </View>
          <View className='mb-4 rounded-2xl border border-line bg-card p-4'>
            <Text className='mb-3 font-semibold text-white'>Change password</Text>
            <Field label='New password' value={password} onChangeText={setPassword} secure />
            <Field label='Confirm new password' value={confirmPassword} onChangeText={setConfirmPassword} secure />
            {err ? <Text className='text-crimson'>{err}</Text> : null}
            {passwordMessage ? <Text className='text-green-500'>{passwordMessage}</Text> : null}
            <Btn label='Update password' onPress={savePassword} disabled={!password || !confirmPassword} />
          </View>
          {[['requests', 'My Requests'], ['appointments', 'My Appointments']].map(([id, label]) => (
            <Pressable key={id} onPress={() => go(id)} className='mb-2 flex-row justify-between rounded-xl bg-card p-4'>
              <Text className='text-white'>{label}</Text>
              <Text className='text-xs font-semibold text-muted'>Open</Text>
            </Pressable>
          ))}
          <Btn outline label='Edit profile' onPress={start} />
          <Btn label='Log out' onPress={signOut} />
        </>
      )}
    </Page>
  );
}
