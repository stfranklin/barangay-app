import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Btn, Field, Page } from '../components/ui';
import { useAuth } from '../components/auth';
import { clinicBookingError } from '../components/bookingErrors';
import { supabase } from '../lib/supabase';
import { REJECTED, rowToRequest, statusLabel } from '../components/store';

const DOC_NEXT = ['Start review', 'Approve', 'Mark ready for claiming', 'Mark completed'];

const EMPTY_FORM = { full_name: '', email: '', address: '', contact: '', password: '' };

export default function AdminDashboard() {
  const { profile, createResident } = useAuth();
  const [residents, setResidents] = useState([]);
  const [clinicAppointments, setClinicAppointments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [docRequests, setDocRequests] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState('');
  const [docBusy, setDocBusy] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const loadResidents = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, full_name, email, address, contact, created_at')
      .eq('role', 'resident')
      .order('created_at', { ascending: false });
    setResidents(data || []);
    setError(queryError?.message || '');
    setLoading(false);
  }, []);

  const loadClinicAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    const { data, error: queryError } = await supabase
      .from('bookings')
      .select('id,user_id,date,time,nurse,service,status')
      .eq('kind', 'clinic')
      .order('date', { ascending: true });
    if (queryError) {
      setAppointmentsError(clinicBookingError(queryError, 'Could not load clinic appointments. Check your connection and try again.'));
      setClinicAppointments([]);
      setAppointmentsLoading(false);
      return;
    }
    const userIds = [...new Set((data || []).map((booking) => booking.user_id))];
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id,full_name').in('id', userIds)
      : { data: [] };
    const names = new Map((profiles || []).map((resident) => [resident.id, resident.full_name]));
    setClinicAppointments((data || []).map((booking) => ({ ...booking, residentName: names.get(booking.user_id) || 'Resident' })));
    setAppointmentsError('');
    setAppointmentsLoading(false);
  }, []);

  const loadDocRequests = useCallback(async () => {
    setDocsLoading(true);
    const { data, error: queryError } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
    setDocsError(queryError?.message || '');
    setDocRequests((data || []).map(rowToRequest));
    setDocsLoading(false);
  }, []);

  useEffect(() => { loadResidents(); loadClinicAppointments(); loadDocRequests(); }, [loadResidents, loadClinicAppointments, loadDocRequests]);

  const setDocStatus = async (req, status) => {
    setDocBusy(req.id);
    setDocsError('');
    const { error: updateError } = await supabase.from('requests').update({ status }).eq('id', req.id);
    if (updateError) setDocsError(updateError.message); else await loadDocRequests();
    setDocBusy(null);
  };

  const updateAppointmentStatus = async (appointment, status) => {
    setStatusBusy(appointment.id);
    setAppointmentsError('');
    const { error: updateError } = await supabase.from('bookings')
      .update({ status })
      .eq('id', appointment.id)
      .eq('kind', 'clinic');
    if (updateError) setAppointmentsError(clinicBookingError(updateError, 'Could not update the appointment. Please try again.'));
    else await loadClinicAppointments();
    setStatusBusy(null);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await createResident({ ...form, email: form.email.trim() });
    if (result.error) setError(result.error);
    else {
      setForm(EMPTY_FORM);
      setMessage('Resident account created. Share the initial password privately and ask the resident to change it after signing in.');
      await loadResidents();
    }
    setBusy(false);
  };

  if (profile?.role !== 'admin') {
    return <Page title='Access restricted'><Text className='text-muted'>This page is available to administrators only.</Text></Page>;
  }

  return (
    <Page title='Admin dashboard'>
      <Text className='-mt-3 mb-5 text-muted'>Manage resident access and review service activity.</Text>
      <View className='mb-6 rounded-2xl border border-line bg-card p-5'>
        <Text className='text-xs font-semibold tracking-widest text-muted'>RESIDENT ACCOUNTS</Text>
        <Text className='mt-1 text-3xl font-bold text-white'>{loading ? '...' : residents.length}</Text>
        <Text className='mt-1 text-sm text-muted'>Accounts managed by the barangay</Text>
      </View>

      <View className='mb-6 rounded-2xl border border-line bg-card p-5'>
        <Text className='text-lg font-bold text-white'>Create resident account</Text>
        <Text className='mb-4 mt-1 text-sm text-muted'>Add the resident details and set an initial password.</Text>
        <Field label='Full name' value={form.full_name} onChangeText={set('full_name')} placeholder='Juan Dela Cruz' />
        <Field label='Email address' value={form.email} onChangeText={set('email')} placeholder='resident@example.com' keyboardType='email-address' />
        <Field label='Address' value={form.address} onChangeText={set('address')} placeholder='Purok, Barangay' />
        <Field label='Contact number' value={form.contact} onChangeText={set('contact')} placeholder='09XXXXXXXXX' keyboardType='phone-pad' />
        <Field label='Initial password (at least 8 characters)' value={form.password} onChangeText={set('password')} secure />
        {error ? <Text className='mt-2 text-crimson'>{error}</Text> : null}
        {message ? <Text className='mt-2 text-green-500'>{message}</Text> : null}
        <Btn label={busy ? 'Creating account...' : 'Create resident account'} onPress={submit} disabled={busy || !form.full_name.trim() || !form.email.trim() || !form.address.trim() || !form.contact.trim() || form.password.length < 8} />
      </View>

      <View className='mb-2 flex-row items-center justify-between'>
        <Text className='text-lg font-bold text-white'>Resident accounts</Text>
        <Pressable onPress={loadResidents} accessibilityRole='button'>
          <Text className='text-sm font-semibold text-crimson'>Refresh</Text>
        </Pressable>
      </View>
      {loading ? <Text className='py-4 text-muted'>Loading residents...</Text> : null}
      {!loading && residents.length === 0 ? <Text className='py-4 text-muted'>No resident accounts yet.</Text> : null}
      {residents.map((resident) => (
        <View key={resident.id} className='mb-2 rounded-xl border border-line bg-card p-4'>
          <Text className='font-semibold text-white'>{resident.full_name || 'Resident'}</Text>
          {resident.email ? <Text className='mt-1 text-sm text-muted'>{resident.email}</Text> : null}
          <Text className='mt-1 text-sm text-muted'>{resident.address || 'No address on file'}</Text>
          {resident.contact ? <Text className='text-sm text-muted'>{resident.contact}</Text> : null}
        </View>
      ))}

      <View className='mb-2 mt-8 flex-row items-center justify-between'>
        <Text className='text-lg font-bold text-white'>Document requests</Text>
        <Pressable onPress={loadDocRequests} accessibilityRole='button'>
          <Text className='text-sm font-semibold text-crimson'>Refresh</Text>
        </Pressable>
      </View>
      {docsLoading ? <Text className='py-3 text-muted'>Loading document requests...</Text> : null}
      {docsError ? <Text className='py-3 text-crimson'>{docsError}</Text> : null}
      {!docsLoading && !docsError && docRequests.length === 0 ? <Text className='py-3 text-muted'>No document requests.</Text> : null}
      {docRequests.map((r) => (
        <View key={r.id} className='mb-3 rounded-2xl border border-line bg-card p-4'>
          <Text className='font-semibold text-white'>{r.doc} | {r.ref}</Text>
          <Text className='mt-1 text-sm text-muted'>{r.name} | {r.contact}</Text>
          <Text className='text-sm text-muted'>{r.address}</Text>
          <Text className='text-sm text-muted'>Purpose: {r.purpose} | {r.date}</Text>
          <Text className={`mt-2 font-semibold ${r.status === REJECTED ? 'text-crimson' : r.status >= 3 ? 'text-green-500' : 'text-royal'}`}>{statusLabel(r.status)}</Text>
          {r.status < 4 && (
            <View className='flex-row gap-2'>
              <View className='flex-1'><Btn label={docBusy === r.id ? 'Updating...' : DOC_NEXT[r.status]} disabled={docBusy !== null} onPress={() => setDocStatus(r, r.status + 1)} /></View>
              {r.status <= 2 && <View className='flex-1'><Btn outline label='Reject' disabled={docBusy !== null} onPress={() => setDocStatus(r, REJECTED)} /></View>}
            </View>
          )}
        </View>
      ))}

      <View className='mb-2 mt-8 flex-row items-center justify-between'>
        <Text className='text-lg font-bold text-white'>Clinic appointment requests</Text>
        <Pressable onPress={loadClinicAppointments} accessibilityRole='button'>
          <Text className='text-sm font-semibold text-crimson'>Refresh</Text>
        </Pressable>
      </View>
      {appointmentsLoading ? <Text className='py-3 text-muted'>Loading clinic appointments...</Text> : null}
      {appointmentsError ? <Text className='py-3 text-crimson'>{appointmentsError}</Text> : null}
      {!appointmentsLoading && !appointmentsError && clinicAppointments.length === 0 ? <Text className='py-3 text-muted'>No clinic appointment requests.</Text> : null}
      {clinicAppointments.map((appointment) => (
        <View key={appointment.id} className='mb-3 rounded-2xl border border-line bg-card p-4'>
          <Text className='font-semibold text-white'>{appointment.service}</Text>
          <Text className='mt-1 text-sm text-muted'>{appointment.residentName}</Text>
          <Text className='text-sm text-muted'>{appointment.date} | {appointment.time}</Text>
          <Text className='text-sm text-muted'>{appointment.nurse}</Text>
          <Text className={`mt-2 font-semibold ${appointment.status === 'Confirmed' || appointment.status === 'Completed' ? 'text-green-500' : appointment.status === 'Declined' ? 'text-crimson' : 'text-royal'}`}>{appointment.status || 'Pending'}</Text>
          {appointment.status === 'Pending' && <View className='flex-row gap-2'>
            <View className='flex-1'><Btn label={statusBusy === appointment.id ? 'Updating...' : 'Confirm'} disabled={statusBusy !== null} onPress={() => updateAppointmentStatus(appointment, 'Confirmed')} /></View>
            <View className='flex-1'><Btn outline label='Decline' disabled={statusBusy !== null} onPress={() => updateAppointmentStatus(appointment, 'Declined')} /></View>
          </View>}
          {appointment.status === 'Confirmed' && <Btn outline label={statusBusy === appointment.id ? 'Updating...' : 'Mark completed'} disabled={statusBusy !== null} onPress={() => updateAppointmentStatus(appointment, 'Completed')} />}
        </View>
      ))}
    </Page>
  );
}
