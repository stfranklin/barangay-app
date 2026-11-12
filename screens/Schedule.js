import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useApp } from '../components/store';

const SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
// Slots already reserved (as if written in the old notebook).
const SEEDED = { court: ['9:00 AM', '2:00 PM'], clinic: ['10:00 AM'] };
const NURSES = ['Nurse Ana', 'Nurse Liza', 'Nurse Mae'];
const CFG = {
  court: { title: 'Court Scheduling', acc: 'bg-royal', note: 'Court fee: ₱200, paid at the Barangay Hall.' },
  clinic: { title: 'Clinic Appointment', acc: 'bg-crimson', note: 'Clinic hours: Mon to Fri, 8:00 AM to 4:00 PM.' },
};
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

export default function Schedule({ kind, onBack }) {
  const { isTaken, addBooking } = useApp();
  const cfg = CFG[kind];
  const [day, setDay] = useState(0);
  const [time, setTime] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');

  const d = days[day];
  const dateKey = d.toDateString();
  const closed = kind === 'clinic' && (d.getDay() === 0 || d.getDay() === 6);
  const nurse = NURSES[d.getDay() % 3];
  const taken = (t) => SEEDED[kind].includes(t) || isTaken(kind, dateKey, t);

  const confirm = () => {
    const ok = addBooking({ kind, title: cfg.title, date: dateKey, time, nurse: kind === 'clinic' ? nurse : null });
    if (ok) setDone({ date: dateKey, time });
    else {
      setErr('That slot was just reserved. Please pick another.');
      setTime(null);
    }
  };

  if (done)
    return (
      <Page title='Booking confirmed'>
        <View className='rounded-2xl border-l-4 border-royal bg-card p-5'>
          <Text className='text-xs font-semibold uppercase tracking-widest text-green-400'>Confirmed</Text>
          <Text className='mt-2 text-lg font-bold text-white'>{cfg.title}</Text>
          <Text className='mt-1 text-muted'>{done.date} at {done.time}</Text>
          {kind === 'clinic' && <Text className='text-muted'>{nurse} will attend to you.</Text>}
          <Text className='mt-2 text-muted'>{cfg.note}</Text>
        </View>
        <Btn label='Back to Home' onPress={onBack} />
      </Page>
    );

  return (
    <Page title={cfg.title} onBack={onBack}>
      <Text className='mb-3 text-muted'>{cfg.note}</Text>
      <Text className='mb-2 font-semibold text-white'>Choose a date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((x, i) => (
          <Pressable
            key={i}
            onPress={() => { setDay(i); setTime(null); setErr(''); }}
            className={`mr-2 items-center rounded-xl px-4 py-3 ${i === day ? cfg.acc : 'bg-card'}`}
          >
            <Text className='text-xs text-white'>{x.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
            <Text className='text-lg font-bold text-white'>{x.getDate()}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {kind === 'clinic' && (
        <Text className='mt-3 text-muted'>
          {closed ? 'Clinic closed. No nurse on duty this day.' : `Nurse on duty: ${nurse}`}
        </Text>
      )}

      <Text className='mb-2 mt-4 font-semibold text-white'>Choose a time</Text>
      <View className='flex-row flex-wrap gap-2'>
        {SLOTS.map((t) => {
          const off = closed || taken(t);
          return (
            <Pressable
              key={t}
              disabled={off}
              onPress={() => setTime(t)}
              className={`rounded-xl px-4 py-3 ${off ? 'bg-line' : t === time ? cfg.acc : 'bg-card'}`}
            >
              <Text className={off ? 'text-muted' : 'text-white'}>
                {t}{off && !closed ? ' (Reserved)' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {err ? <Text className='mt-3 text-crimson'>{err}</Text> : null}
      <Btn label='Confirm booking' disabled={!time} onPress={confirm} />
    </Page>
  );
}
