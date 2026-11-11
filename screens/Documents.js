import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useApp } from '../components/store';

const DOCS = [
  { name: 'Barangay Clearance', fee: 'PHP 50', reqs: ['Valid ID', 'Proof of residency', '1x1 photo'] },
  { name: 'Certificate of Residency', fee: 'PHP 30', reqs: ['Valid ID', 'Proof of residency'] },
  { name: 'Certificate of Indigency', fee: 'Free', reqs: ['Valid ID', 'Household record'] },
];

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View className='mb-3'>
      <Text className='mb-1 text-sm text-muted'>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#6B7280'
        keyboardType={keyboardType}
        className='rounded-xl border border-line bg-card px-3 py-3 text-white'
      />
    </View>
  );
}

export default function Documents({ onBack }) {
  const { addRequest } = useApp();
  const [doc, setDoc] = useState(null);
  const [done, setDone] = useState(null);
  const [f, setF] = useState({ name: '', address: '', contact: '', purpose: '' });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const ok = f.name && f.address && f.contact && f.purpose;

  if (done)
    return (
      <Page title='Request submitted'>
        <View className='rounded-2xl border-l-4 border-crimson bg-card p-5'>
          <Text className='text-xs font-semibold tracking-widest text-green-500'>SUBMITTED</Text>
          <Text className='mt-2 text-muted'>Reference number</Text>
          <Text className='text-3xl font-bold text-white'>{done.ref}</Text>
          <Text className='mt-2 text-muted'>{done.doc} | Status: Pending</Text>
          <Text className='mt-2 text-muted'>Track it under My Requests. Bring a valid ID when claiming.</Text>
        </View>
        <Btn label='Back to Home' onPress={onBack} />
      </Page>
    );

  if (doc)
    return (
      <Page title={doc.name} onBack={() => setDoc(null)}>
        <View className='mb-4 rounded-2xl bg-card p-4'>
          <Text className='font-semibold text-white'>Fee: {doc.fee}</Text>
          <Text className='mt-1 text-muted'>Requirements: {doc.reqs.join(', ')}</Text>
        </View>
        <Field label='Full name' value={f.name} onChangeText={set('name')} placeholder='Juan Dela Cruz' />
        <Field label='Address' value={f.address} onChangeText={set('address')} placeholder='Purok, Barangay' />
        <Field label='Contact number' value={f.contact} onChangeText={set('contact')} placeholder='09XXXXXXXXX' keyboardType='phone-pad' />
        <Field label='Purpose' value={f.purpose} onChangeText={set('purpose')} placeholder='e.g. Employment' />
        <Btn label='Submit request' disabled={!ok} onPress={() => setDone(addRequest({ ...f, doc: doc.name }))} />
      </Page>
    );

  return (
    <Page title='Document Request' onBack={onBack}>
      <Text className='mb-3 text-muted'>Choose the document you need.</Text>
      {DOCS.map((d) => (
        <Pressable
          key={d.name}
          onPress={() => setDoc(d)}
          className='mb-3 flex-row items-center rounded-2xl border-l-4 border-crimson bg-card p-4 active:opacity-80'
        >
          <View className='flex-1'>
            <Text className='text-base font-semibold text-white'>{d.name}</Text>
            <Text className='text-sm text-muted'>Fee: {d.fee}</Text>
          </View>
          <Text className='text-lg font-semibold text-muted'>Open</Text>
        </Pressable>
      ))}
    </Page>
  );
}
