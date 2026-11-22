import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Field } from '../components/ui';
import { useAuth } from '../components/auth';

const TITLES = { login: 'Sign in', register: 'Create your account', forgot: 'Reset password' };

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', address: '', contact: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setF((form) => ({ ...form, [key]: value }));
  const go = (nextMode) => { setMode(nextMode); setErr(''); setMsg(''); };
  const email = f.email.trim();

  const ready =
    mode === 'login' ? email && f.password
    : mode === 'forgot' ? email
    : f.name.trim() && f.address.trim() && f.contact.trim() && email && f.password.length >= 6 && f.password === f.confirm;

  const submit = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    if (mode === 'login') {
      const error = await signIn(email, f.password);
      if (error) setErr(error);
    } else if (mode === 'forgot') {
      const error = await resetPassword(email);
      if (error) setErr(error); else setMsg('If that email is registered, a reset link was sent.');
    } else {
      const { error, needsConfirm } = await signUp({ ...f, name: f.name.trim(), address: f.address.trim(), contact: f.contact.trim(), email });
      if (error) setErr(error);
      else if (needsConfirm) {
        setMode('login');
        setMsg('Account created. Check your email and open the confirmation link, then sign in to upload your ID.');
      }
    }
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
        <Text className='mb-4 text-2xl font-bold text-white'>{TITLES[mode]}</Text>

        {mode === 'register' && (
          <>
            <Field label='Full name' value={f.name} onChangeText={set('name')} placeholder='Juan Dela Cruz' />
            <Field label='Address' value={f.address} onChangeText={set('address')} placeholder='Purok, Barangay' />
            <Field label='Contact number' value={f.contact} onChangeText={set('contact')} placeholder='09XXXXXXXXX' keyboardType='phone-pad' />
          </>
        )}
        <Field label='Email address' value={f.email} onChangeText={set('email')} placeholder='you@gmail.com' keyboardType='email-address' />
        {mode !== 'forgot' && <Field label='Password' value={f.password} onChangeText={set('password')} secure />}
        {mode === 'register' && (
          <>
            <Field label='Confirm password' value={f.confirm} onChangeText={set('confirm')} secure />
            <Text className='text-xs text-muted'>Use at least 6 characters. You will upload a valid ID after confirming your email.</Text>
          </>
        )}

        {err ? <Text className='mt-2 text-crimson'>{err}</Text> : null}
        {msg ? <Text className='mt-2 text-green-500'>{msg}</Text> : null}
        <Btn label={busy ? 'Please wait...' : mode === 'forgot' ? 'Send reset link' : TITLES[mode]} onPress={submit} disabled={busy || !ready} />

        <View className='mt-5 items-center gap-3'>
          {mode === 'login' && (
            <>
              <Pressable onPress={() => go('forgot')}><Text className='text-muted'>Forgot password?</Text></Pressable>
              <Pressable onPress={() => go('register')}><Text className='text-crimson'>New resident? Create an account</Text></Pressable>
            </>
          )}
          {mode !== 'login' && <Pressable onPress={() => go('login')}><Text className='text-crimson'>Back to sign in</Text></Pressable>}
        </View>
      </View>
    </ScrollView>
  );
}
