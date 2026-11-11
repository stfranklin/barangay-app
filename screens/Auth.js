import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Field } from '../components/ui';
import { useAuth } from '../components/auth';

const TITLES = { login: 'Log in', register: 'Create account', forgot: 'Reset password' };

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', confirm: '', name: '', address: '', contact: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const go = (m) => { setMode(m); setErr(''); setMsg(''); };

  const run = async (fn) => { setBusy(true); setErr(''); setMsg(''); await fn(); setBusy(false); };
  const email = f.email.trim();

  const submit = () => run(async () => {
    if (mode === 'login') {
      const e = await signIn(email, f.password);
      if (e) setErr(e);
    } else if (mode === 'register') {
      if (!f.name || !f.address || !f.contact) return setErr('Please fill in all fields.');
      if (f.password.length < 6) return setErr('Password must be at least 6 characters.');
      if (f.password !== f.confirm) return setErr('Passwords do not match.');
      const { error, needsConfirm } = await signUp(email, f.password, { full_name: f.name, address: f.address, contact: f.contact });
      if (error) return setErr(error);
      if (needsConfirm) { setMode('login'); setMsg('Account created. Check your email to verify it, then log in.'); }
    } else {
      const e = await resetPassword(email);
      if (e) setErr(e); else setMsg('If that email is registered, a reset link was sent.');
    }
  });

  return (
    <ScrollView className='flex-1 bg-ink' contentContainerClassName='flex-grow justify-center p-6'>
      <View className='w-full max-w-md self-center'>
        <Text className='text-3xl font-bold text-white'>🏠 BARANGAY</Text>
        <Text className='mb-6 mt-1 text-muted'>Fast. Easy. Convenient.</Text>
        <Text className='mb-4 text-2xl font-bold text-white'>{TITLES[mode]}</Text>

        {mode === 'register' && (
          <>
            <Field label='Full name' value={f.name} onChangeText={set('name')} placeholder='Juan Dela Cruz' />
            <Field label='Address' value={f.address} onChangeText={set('address')} placeholder='Purok, Barangay' />
            <Field label='Contact number' value={f.contact} onChangeText={set('contact')} placeholder='09XXXXXXXXX' keyboardType='phone-pad' />
          </>
        )}
        <Field label='Email' value={f.email} onChangeText={set('email')} placeholder='you@example.com' keyboardType='email-address' />
        {mode !== 'forgot' && <Field label='Password' value={f.password} onChangeText={set('password')} secure />}
        {mode === 'register' && <Field label='Confirm password' value={f.confirm} onChangeText={set('confirm')} secure />}

        {err ? <Text className='mt-1 text-crimson'>{err}</Text> : null}
        {msg ? <Text className='mt-1 text-green-500'>{msg}</Text> : null}
        <Btn label={busy ? 'Please wait...' : mode === 'forgot' ? 'Send reset link' : TITLES[mode]} onPress={submit} disabled={busy} />

        <View className='mt-5 items-center gap-2'>
          {mode === 'login' && (
            <>
              <Pressable onPress={() => go('forgot')}><Text className='text-muted'>Forgot password?</Text></Pressable>
              <Pressable onPress={() => go('register')}><Text className='text-crimson'>Create account</Text></Pressable>
            </>
          )}
          {mode !== 'login' && (
            <Pressable onPress={() => go('login')}><Text className='text-crimson'>Back to log in</Text></Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
