import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Field } from '../components/ui';
import { useAuth } from '../components/auth';

export default function Auth() {
  const { signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setF((form) => ({ ...form, [key]: value }));
  const go = (nextMode) => { setMode(nextMode); setErr(''); setMsg(''); };

  const submit = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    const email = f.email.trim();
    const error = mode === 'login'
      ? await signIn(email, f.password)
      : await resetPassword(email);
    if (error) setErr(error);
    else if (mode === 'forgot') setMsg('If that email is registered, a reset link was sent.');
    setBusy(false);
  };

  return (
    <ScrollView className='flex-1 bg-ink' contentContainerClassName='flex-grow justify-center p-6'>
      <View className='w-full max-w-md self-center'>
        <View className='mb-8 border-l-4 border-crimson pl-4'>
          <Text className='text-sm font-semibold tracking-widest text-muted'>BARANGAY SERVICES PORTAL</Text>
          <Text className='mt-2 text-3xl font-bold text-white'>Resident Services</Text>
          <Text className='mt-1 text-muted'>Access local services and manage your requests.</Text>
        </View>
        <Text className='mb-4 text-2xl font-bold text-white'>{mode === 'login' ? 'Sign in' : 'Reset password'}</Text>
        <Field label='Email address' value={f.email} onChangeText={set('email')} placeholder='you@example.com' keyboardType='email-address' />
        {mode === 'login' && <Field label='Password' value={f.password} onChangeText={set('password')} secure />}
        {err ? <Text className='mt-1 text-crimson'>{err}</Text> : null}
        {msg ? <Text className='mt-1 text-green-500'>{msg}</Text> : null}
        <Btn label={busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Send reset link'} onPress={submit} disabled={busy || !f.email.trim() || (mode === 'login' && !f.password)} />
        <View className='mt-5 items-center'>
          <Pressable onPress={() => go(mode === 'login' ? 'forgot' : 'login')}>
            <Text className='text-muted'>{mode === 'login' ? 'Forgot password?' : 'Back to sign in'}</Text>
          </Pressable>
          <Text className='mt-5 text-center text-xs text-muted'>Resident accounts are created by the barangay administrator.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
