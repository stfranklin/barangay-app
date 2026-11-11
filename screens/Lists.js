import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Btn, Field, Page } from '../components/ui';
import { useAuth } from '../components/auth';
import { useApp, STATUSES } from '../components/store';

const Empty = ({ text }) => <Text className='mt-8 text-center text-muted'>{text}</Text>;

export function MyRequests({ onBack }) {
  const { requests, advance } = useApp();
  return (
    <Page title='My Requests' onBack={onBack}>
      {requests.length === 0 && <Empty text='No document requests yet.' />}
      {requests.map((r) => (
        <View key={r.ref} className='mb-3 rounded-2xl border-l-4 border-crimson bg-card p-4'>
          <Text className='font-bold text-white'>{r.doc}</Text>
          <Text className='text-sm text-muted'>{r.ref} · {r.date}</Text>
          <Text className='mt-2 font-semibold text-crimson'>{STATUSES[r.status]}</Text>
          <View className='mt-2 flex-row gap-1'>
            {STATUSES.map((s, i) => (
              <View key={s} className={`h-1 flex-1 rounded-full ${i <= r.status ? 'bg-crimson' : 'bg-line'}`} />
            ))}
          </View>
          {/* Demo only: staff would normally update this from the admin side. */}
          {r.status < STATUSES.length - 1 && (
            <Btn outline label='Demo: advance status' onPress={() => advance(r.ref)} />
          )}
        </View>
      ))}
    </Page>
  );
}

export function MyAppointments({ onBack }) {
  const { bookings } = useApp();
  return (
    <Page title='My Appointments' onBack={onBack}>
      {bookings.length === 0 && <Empty text='No bookings yet.' />}
      {bookings.map((b) => (
        <View
          key={b.id}
          className={`mb-3 rounded-2xl border-l-4 bg-card p-4 ${b.kind === 'court' ? 'border-royal' : 'border-crimson'}`}
        >
          <Text className='font-bold text-white'>{b.title}</Text>
          <Text className='text-muted'>{b.date} at {b.time}</Text>
          {b.nurse && <Text className='text-muted'>{b.nurse}</Text>}
        </View>
      ))}
    </Page>
  );
}

export function Notifications() {
  const { notes } = useApp();
  return (
    <Page title='Notifications'>
      {notes.map((n) => (
        <View key={n.id} className='mb-2 rounded-xl bg-card p-4'>
          <Text className='text-white'>{n.text}</Text>
        </View>
      ))}
    </Page>
  );
}

export function Profile({ go }) {
  const { profile, session, updateProfile, signOut } = useAuth();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
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
          {[['requests', 'My Requests'], ['appointments', 'My Appointments']].map(([id, label]) => (
            <Pressable key={id} onPress={() => go(id)} className='mb-2 flex-row justify-between rounded-xl bg-card p-4'>
              <Text className='text-white'>{label}</Text>
              <Text className='text-muted'>›</Text>
            </Pressable>
          ))}
          <Btn outline label='Edit profile' onPress={start} />
          <Btn label='Log out' onPress={signOut} />
        </>
      )}
    </Page>
  );
}
