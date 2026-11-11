import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Btn, Field, Page } from '../components/ui';
import { useAuth } from '../components/auth';
import { supabase } from '../lib/supabase';

const EMPTY_FORM = { full_name: '', email: '', address: '', contact: '', password: '' };

export default function AdminDashboard() {
  const { profile, createResident } = useAuth();
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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

  useEffect(() => { loadResidents(); }, [loadResidents]);

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
    </Page>
  );
}
