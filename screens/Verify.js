import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Btn } from '../components/ui';
import { useAuth } from '../components/auth';

export default function Verify() {
  const { profile, session, submitId, refreshProfile, signOut } = useAuth();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const rejected = profile?.status === 'rejected';
  const waiting = profile?.status === 'pending' && !!profile?.id_path;

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 5 * 1024 * 1024) return setErr('That file is larger than 5 MB.');
    setErr('');
    setFile(asset);
  };

  const send = async () => {
    setBusy(true);
    setErr('');
    const error = await submitId(file);
    if (error) setErr(error); else setFile(null);
    setBusy(false);
  };

  return (
    <ScrollView className='flex-1 bg-ink' contentContainerClassName='flex-grow justify-center p-6'>
      <View className='w-full max-w-md self-center'>
        <View className='mb-6 border-l-4 border-crimson pl-4'>
          <Text className='text-sm font-semibold tracking-widest text-muted'>BARANGAY SERVICES PORTAL</Text>
          <Text className='mt-2 text-2xl font-bold text-white'>
            {waiting ? 'Waiting for approval' : rejected ? 'Account not approved' : 'Verify your identity'}
          </Text>
          <Text className='mt-1 text-muted'>{session?.user?.email}</Text>
        </View>

        {waiting ? (
          <>
            <Text className='text-muted'>Your ID was received. A barangay administrator will review it. You can use the app once your account is approved.</Text>
            <Btn label='Check again' onPress={refreshProfile} />
          </>
        ) : (
          <>
            {rejected && <Text className='mb-3 text-crimson'>Reason: {profile?.reject_reason || 'No reason given.'} Upload a new ID to try again.</Text>}
            <Text className='mb-3 text-muted'>Upload a clear photo or PDF of a valid government ID (maximum 5 MB). Only you and barangay administrators can view it.</Text>
            <Btn outline label={file ? 'Choose a different file' : 'Choose ID file'} onPress={pick} />
            {file ? <Text className='mt-3 text-white'>{file.name}</Text> : null}
            {err ? <Text className='mt-3 text-crimson'>{err}</Text> : null}
            <Btn label={busy ? 'Uploading...' : 'Submit for review'} onPress={send} disabled={!file || busy} />
          </>
        )}
        <Btn outline label='Sign out' onPress={signOut} />
      </View>
    </ScrollView>
  );
}
