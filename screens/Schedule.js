import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useApp } from '../components/store';

const SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
const COURT_HOURS = Array.from({ length: 13 }, (_, i) => 8 * 60 + i * 60);
const COURT_RATE = 100;
const SEEDED = { clinic: ['10:00 AM'] };
const NURSES = ['Nurse Ana', 'Nurse Liza', 'Nurse Mae'];
const CFG = {
  court: { title: 'Court Scheduling', acc: 'bg-royal', note: 'Court fee: ₱100 per hour, paid at the Barangay Hall.' },
  clinic: { title: 'Clinic Appointment', acc: 'bg-crimson', note: 'Clinic hours: Mon to Fri, 8:00 AM to 4:00 PM.' },
};
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

const toMinutes = (time) => {
  const [clock, period] = time.split(' ');
  let [hours, minutes] = clock.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};
const formatTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
};

export default function Schedule({ kind, onBack }) {
  const { isTaken, addBooking } = useApp();
  const cfg = CFG[kind];
  const [day, setDay] = useState(0);
  const [time, setTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');

  const d = days[day];
  const dateKey = d.toDateString();
  const closed = kind === 'clinic' && (d.getDay() === 0 || d.getDay() === 6);
  const nurse = NURSES[d.getDay() % 3];
  const courtBusy = (start, end) => isTaken('court', dateKey, start, end);
  const taken = (t) => SEEDED.clinic.includes(t) || isTaken(kind, dateKey, t);
  const courtStartOptions = COURT_HOURS.slice(0, -1).filter((start) =>
    !courtBusy(formatTime(start), formatTime(start + 60))
  );
  const courtEndOptions = time
    ? COURT_HOURS.filter((end) => end > toMinutes(time) && !courtBusy(time, formatTime(end)))
    : [];
  const courtHours = time && endTime ? (toMinutes(endTime) - toMinutes(time)) / 60 : 0;
  const courtFee = courtHours * COURT_RATE;

  const confirm = () => {
    const booking = kind === 'court'
      ? { kind, title: cfg.title, date: dateKey, time, startTime: time, endTime, hours: courtHours, fee: courtFee }
      : { kind, title: cfg.title, date: dateKey, time, nurse };
    const ok = addBooking(booking);
    if (ok) setDone({ date: dateKey, time, endTime, fee: courtFee, hours: courtHours });
    else {
      setErr('That time was just reserved. Please pick another.');
      setTime(null);
      setEndTime(null);
    }
  };

  if (done)
    return (
      <Page title='Booking confirmed'>
        <View className='rounded-2xl border-l-4 border-royal bg-card p-5'>
          <Text className='text-xs font-semibold tracking-widest text-green-500'>CONFIRMED</Text>
          <Text className='mt-2 text-lg font-bold text-white'>{cfg.title}</Text>
          <Text className='mt-1 text-muted'>{done.date} · {done.time}{kind === 'court' ? `–${done.endTime}` : ''}</Text>
          {kind === 'court' && <Text className='mt-1 font-semibold text-white'>{done.hours} hour{done.hours === 1 ? '' : 's'} · ₱{done.fee}</Text>}
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
          <Pressable key={i} onPress={() => { setDay(i); setTime(null); setEndTime(null); setErr(''); }} className={`mr-2 items-center rounded-xl px-4 py-3 ${i === day ? cfg.acc : 'bg-card'}`}>
            <Text className='text-xs text-white'>{x.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
            <Text className='text-lg font-bold text-white'>{x.getDate()}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {kind === 'clinic' && <Text className='mt-3 text-muted'>{closed ? 'Clinic closed. No nurse on duty this day.' : `Nurse on duty: ${nurse}`}</Text>}

      <Text className='mb-2 mt-4 font-semibold text-white'>{kind === 'court' ? 'Choose a start time' : 'Choose a time'}</Text>
      <View className='flex-row flex-wrap gap-2'>
        {(kind === 'court' ? courtStartOptions.map(formatTime) : SLOTS).map((t) => {
          const off = closed || (kind === 'clinic' && taken(t));
          return (
            <Pressable key={t} disabled={off} onPress={() => { setTime(t); setEndTime(null); setErr(''); }} className={`rounded-xl px-4 py-3 ${off ? 'bg-line' : t === time ? cfg.acc : 'bg-card'}`}>
              <Text className={off ? 'text-muted' : 'text-white'}>{t}{off && !closed ? ' (Reserved)' : ''}</Text>
            </Pressable>
          );
        })}
      </View>
      {kind === 'court' && time && <>
        <Text className='mb-2 mt-4 font-semibold text-white'>Choose an end time</Text>
        <View className='flex-row flex-wrap gap-2'>
          {courtEndOptions.map((end) => {
            const label = formatTime(end);
            return <Pressable key={end} onPress={() => setEndTime(label)} className={`rounded-xl px-4 py-3 ${label === endTime ? cfg.acc : 'bg-card'}`}>
              <Text className='text-white'>{label}</Text>
            </Pressable>;
          })}
        </View>
        {endTime && <Text className='mt-4 rounded-xl bg-card p-4 font-semibold text-white'>{courtHours} hour{courtHours === 1 ? '' : 's'} × ₱{COURT_RATE} = ₱{courtFee}</Text>}
      </>}
      {err ? <Text className='mt-3 text-crimson'>{err}</Text> : null}
      <Btn label='Confirm booking' disabled={kind === 'court' ? !time || !endTime : !time} onPress={confirm} />
    </Page>
  );
}
