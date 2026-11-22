import { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Field } from '../components/ui';
import { useAuth } from '../components/auth';

const TITLES = { login: 'Sign in', register: 'Create your account', forgot: 'Reset password' };

export default function Auth() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
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
    <ScrollView
      className='flex-1 bg-[#f1f5fb]'
      contentContainerClassName={`flex-grow ${wide ? 'flex-row' : ''}`}
      keyboardShouldPersistTaps='handled'
    >
      <ImageBackground
        source={require('../assets/barangay-hall.png')}
        resizeMode='cover'
        imageStyle={{ opacity: wide ? 0.58 : 0.72 }}
        className={`${wide ? 'w-[44%] min-h-full justify-center px-12' : 'h-[430px] items-center justify-center px-6 pt-8'} overflow-hidden bg-[#073d70]`}
      >
        <View className='absolute inset-0' style={{ backgroundColor: 'rgba(3, 48, 128, 0.76)' }} />
        {wide ? (
          <View className='relative'>
            <Image
              source={require('../assets/barangay-official-seal.png')}
              accessibilityLabel='Barangay Halang, Cavite seal'
              resizeMode='contain'
              className='mb-9 rounded-full'
              style={{ width: 160, height: 160 }}
            />
            <Text className='text-base font-bold tracking-[5px] text-blue-100'>WELCOME TO</Text>
            <Text className='mt-3 max-w-lg text-5xl font-bold leading-tight text-white'>Barangay Services</Text>
            <Text className='mt-1 text-3xl italic text-white'>Barangay Halang, Cavite</Text>
            <View className='mb-5 mt-8 h-1 w-16 bg-white' />
            <Text className='max-w-lg text-lg leading-6 text-white'>A secure place to access barangay services and manage your requests.</Text>
          </View>
        ) : (
          <View className='relative w-full items-center'>
            <Image
              source={require('../assets/barangay-official-seal.png')}
              accessibilityLabel='Barangay Halang, Cavite seal'
              resizeMode='contain'
              className='mb-6 rounded-full'
              style={{ width: 144, height: 144 }}
            />
            <Text className='text-center text-4xl font-bold text-white'>Welcome back</Text>
            <Text className='mt-2 text-center text-base text-blue-100'>Sign in with your assigned account to continue.</Text>
          </View>
        )}
        {wide && <Text className='absolute bottom-8 left-12 text-xs text-blue-100'>Barangay Services Portal</Text>}
        {!wide && <View className='absolute -bottom-10 -left-8 h-20 w-[120%] rotate-[-3deg] border-t-4 border-white/80 bg-[#0754b8]' />}
      </ImageBackground>

      <View className={`flex-1 justify-center px-6 py-10 ${wide ? 'items-center' : 'bg-[#edf4ff] px-5 pb-10 pt-0'}`}>
        <View className={`w-full max-w-sm ${wide ? '' : '-mt-8 self-center rounded-[28px] border border-white bg-white px-6 py-7 shadow-lg'}`}>
          {wide && <>
          <Text className='text-3xl font-semibold text-[#173b70]'>
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset password'}
          </Text>
          <Text className='mb-8 mt-2 text-sm text-[#66748b]'>
            {mode === 'login' ? 'Sign in with your account to continue.' : mode === 'register' ? 'Register, then upload a valid ID for approval.' : 'Enter your email and we’ll send a reset link.'}
          </Text>
          </>}

          {mode === 'register' && (
            <>
              <Field label='Full name' value={f.name} onChangeText={set('name')} placeholder='Juan Dela Cruz' />
              <Field label='Address' value={f.address} onChangeText={set('address')} placeholder='Purok, Barangay' />
              <Field label='Contact number' value={f.contact} onChangeText={set('contact')} placeholder='09XXXXXXXXX' keyboardType='phone-pad' />
            </>
          )}
          <Field label='Email address' value={f.email} onChangeText={set('email')} placeholder='you@example.com' keyboardType='email-address' />
          {mode !== 'forgot' && <Field label='Password' value={f.password} onChangeText={set('password')} secure />}
          {mode === 'register' && (
            <>
              <Field label='Confirm password' value={f.confirm} onChangeText={set('confirm')} secure />
              <Text className='text-xs text-[#66748b]'>Use at least 6 characters. You will upload a valid ID after confirming your email.</Text>
            </>
          )}

          <View className='min-h-6 flex-row justify-end'>
            {err ? <Text accessibilityRole='alert' className='flex-1 text-sm text-crimson'>{err}</Text> : null}
            {msg ? <Text className='flex-1 text-sm text-green-700'>{msg}</Text> : null}
            <Pressable onPress={() => go(mode === 'login' ? 'forgot' : 'login')}>
              <Text className='text-sm font-semibold text-[#173b70]'>
                {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole='button'
            onPress={submit}
            disabled={busy || !ready}
            className={`mt-5 items-center rounded-xl py-3.5 ${busy || !ready ? 'bg-[#9aabc2]' : 'bg-[#0754b8]'}`}
          >
            <Text className='font-semibold text-white'>
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Create account' : 'Send reset link'}
            </Text>
          </Pressable>

          {mode === 'login' && (
            <Pressable onPress={() => go('register')} className='mt-4 items-center'>
              <Text className='text-sm font-semibold text-[#0754b8]'>New resident? Create an account</Text>
            </Pressable>
          )}

          {wide ? (
            <Text className='mt-5 text-center text-xs leading-5 text-[#66748b]'>New accounts are reviewed and approved by the barangay administrator.</Text>
          ) : (
            <View className='mt-8 items-center border-t border-[#d6e2f2] pt-5'>
              <Text className='text-sm font-medium text-[#536c8e]'>Barangay Services Portal</Text>
              <Text className='mt-1 text-xs text-[#71849f]'>Barangay Halang, Cavite</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
