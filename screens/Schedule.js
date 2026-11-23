import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useApp } from '../components/store';

const SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
const COURT_HOURS = Array.from({ length: 13 }, (_, i) => 8 * 60 + i * 60);
const COURT_RATE = 100;
const COURT_ELECTRICITY_START = 18 * 60;
const SEEDED = { clinic: ['10:00 AM'] };
const NURSES = ['Nurse Ana', 'Nurse Liza', 'Nurse Mae'];
const MAX_SLOTS_PER_DAY = 6;
const CFG = {
  court: { title: 'Court Scheduling', note: 'Court rental is free before 6:00 PM. Electricity use after 6:00 PM is ₱100 per hour, paid at the Barangay Hall.' },
  clinic: { title: 'Clinic Appointment', note: 'Clinic hours: Monday to Friday, 8:00 AM to 4:00 PM.' },
};

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

function DateAvailabilityBadge({ available, fullyBooked }) {
  if (fullyBooked) {
    return (
      <View className='absolute -top-1 -right-1 rounded-full bg-[#98a4b4] px-1.5 py-0.5'>
        <Text className='text-[10px] font-bold text-white'>Fully Booked</Text>
      </View>
    );
  }
  if (available) {
    return (
      <View className='absolute -top-1 -right-1 rounded-full bg-[#287a4b] px-1.5 py-0.5'>
        <Text className='text-[10px] font-bold text-white'>Nurse Available</Text>
      </View>
    );
  }
  return null;
}

export default function Schedule({ kind, onBack }) {
  const { isTaken, addBooking } = useApp();
  const cfg = CFG[kind];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => new Date(today));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));
  const [time, setTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');

  // Month & Year details
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let day = 1; day <= totalDays; day++) {
      result.push(new Date(year, month, day));
    }
    return result;
  }, [currentYear, currentMonth]);

  // Navigate to previous month
  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  // Navigate to next month
  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Check if a given date is in the past
  const isPast = useCallback((d) => {
    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }, [today]);

  const dateKey = selectedDate.toDateString();
  const closed = kind === 'clinic' && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6);
  const nurse = NURSES[selectedDate.getDay() % 3];
  const courtBusy = (start, end) => isTaken('court', dateKey, start, end);
  const taken = (t) => SEEDED.clinic.includes(t) || isTaken(kind, dateKey, t);

  // Dynamic status of dates in the current month view
  const dateAvailability = useMemo(() => {
    if (kind !== 'clinic') return [];
    return daysInMonth.map((x) => {
      const xKey = x.toDateString();
      const isClinicClosed = x.getDay() === 0 || x.getDay() === 6;
      if (isClinicClosed) return null;
      const bookedCount = SLOTS.filter((slot) => isTaken('clinic', xKey, slot)).length;
      return bookedCount >= MAX_SLOTS_PER_DAY ? 'fully-booked' : 'available';
    });
  }, [kind, isTaken, daysInMonth]);

  const courtStartOptions = COURT_HOURS.slice(0, -1).filter((start) =>
    !courtBusy(formatTime(start), formatTime(start + 60))
  );
  const courtEndOptions = time
    ? COURT_HOURS.filter((end) => end > toMinutes(time) && !courtBusy(time, formatTime(end)))
    : [];
  const courtHours = time && endTime ? (toMinutes(endTime) - toMinutes(time)) / 60 : 0;
  const courtBillableHours = time && endTime
    ? Math.max(0, toMinutes(endTime) - Math.max(toMinutes(time), COURT_ELECTRICITY_START)) / 60
    : 0;
  const courtFee = courtBillableHours * COURT_RATE;

  const confirm = () => {
    const booking = kind === 'court'
      ? { kind, title: cfg.title, date: dateKey, time, startTime: time, endTime, hours: courtHours, fee: courtFee }
      : { kind, title: cfg.title, date: dateKey, time, nurse };
    const ok = addBooking(booking);
    if (ok) setDone({ date: dateKey, time, endTime, fee: courtFee, hours: courtHours, billableHours: courtBillableHours });
    else {
      setErr('That time was just reserved. Please pick another.');
      setTime(null);
      setEndTime(null);
    }
  };

  if (done)
    return (
      <Page title='Booking confirmed' onBack={onBack}>
        <View className='rounded-3xl border border-[#dce8f5] bg-white p-6'>
          <View className='mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f6ed]'>
            <Text className='text-2xl font-bold text-[#287a4b]'>✓</Text>
          </View>
          <Text className='text-xs font-bold uppercase tracking-[2px] text-[#287a4b]'>Confirmed</Text>
          <Text className='mt-2 text-xl font-bold text-[#173b70]'>{cfg.title}</Text>
          <View className='mt-4 rounded-2xl bg-[#f3f7fc] p-4'>
            <Text className='text-sm font-semibold text-[#173b70]'>{done.date}</Text>
            <Text className='mt-1 text-sm text-muted'>{done.time}{kind === 'court' ? ` – ${done.endTime}` : ''}</Text>
          </View>
          {kind === 'court' && <Text className='mt-4 font-semibold text-ink'>{done.hours} total hour{done.hours === 1 ? '' : 's'} · {done.billableHours} electricity hour{done.billableHours === 1 ? '' : 's'} · ₱{done.fee}</Text>}
          {kind === 'clinic' && <Text className='mt-4 text-muted'>{nurse} will attend to you.</Text>}
          <Text className='mt-3 text-sm leading-5 text-muted'>{cfg.note}</Text>
        </View>
        <Btn label='Back to Home' onPress={onBack} />
      </Page>
    );

  const isSelectedDatePast = isPast(selectedDate);
  const bookingDisabled = isSelectedDatePast || (kind === 'court' ? !time || !endTime : !time || closed);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Page title={cfg.title} onBack={onBack}>
      <View className='mb-5 rounded-2xl border border-[#d8e6f8] bg-[#edf4ff] p-4'>
        <Text className='font-semibold text-[#173b70]'>{kind === 'court' ? 'Reserve your court time' : 'Book a clinic visit'}</Text>
        <Text className='mt-1 text-sm leading-5 text-[#526984]'>{cfg.note}</Text>
      </View>

      <View className='mb-4 rounded-2xl border border-line bg-white p-4'>
        {/* Month Navigation Controls */}
        <View className='mb-3 flex-row items-center justify-between'>
          <View>
            <Text className='font-bold text-ink'>Choose a date</Text>
            <Text className='mt-0.5 text-xs text-muted'>{monthYearLabel}</Text>
          </View>
          <View className='flex-row items-center gap-1'>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Previous Month'
              onPress={prevMonth}
              className='h-8 w-8 items-center justify-center rounded-xl bg-[#f3f7fc] border border-[#dce8f5] active:bg-[#e7f0fa]'
            >
              <Text className='text-base font-bold text-[#173b70]'>‹</Text>
            </Pressable>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Next Month'
              onPress={nextMonth}
              className='h-8 w-8 items-center justify-center rounded-xl bg-[#f3f7fc] border border-[#dce8f5] active:bg-[#e7f0fa]'
            >
              <Text className='text-base font-bold text-[#173b70]'>›</Text>
            </Pressable>
          </View>
        </View>

        {kind === 'clinic' && dateAvailability.length > 0 && (
          <View className='mb-3 rounded-lg bg-[#f8fafd] p-3'>
            <Text className='text-xs font-medium text-muted'>Availability Status ({monthYearLabel})</Text>
            <View className='mt-2 flex-row items-center justify-between rounded-lg border border-[#dce6f2] bg-white px-3 py-2'>
              <View className='flex-row items-center gap-2'>
                <View className='h-2 w-2 rounded-full bg-[#287a4b]' />
                <Text className='text-sm text-ink'>Nurse Available</Text>
              </View>
              <Text className='text-xs text-muted'>
                {dateAvailability.filter((a) => a === 'available').length} open days this month
              </Text>
            </View>
          </View>
        )}

        {/* Days Horizontal Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName='pb-1'>
          {daysInMonth.map((x, i) => {
            const selected = x.toDateString() === selectedDate.toDateString();
            const past = isPast(x);
            const availability = dateAvailability?.[i];
            const isAvailable = availability === 'available';
            const isFullyBooked = availability === 'fully-booked';

            let containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3';
            let textClass = 'text-xs font-medium';
            let dayTextClass = 'my-1 text-xl font-bold';

            if (past) {
              containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#f1f3f6] border-[#e8edf3] opacity-50';
              textClass = 'text-xs font-medium text-[#98a4b4]';
              dayTextClass = 'my-1 text-xl font-bold text-[#98a4b4]';
            } else if (isFullyBooked) {
              containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#f1f3f6] border-[#e8edf3]';
              textClass = 'text-xs font-medium text-[#98a4b4]';
              dayTextClass = 'my-1 text-xl font-bold text-[#98a4b4]';
            } else if (selected) {
              containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 border-[#173b70] bg-[#173b70]';
              textClass = 'text-xs font-medium text-blue-100';
              dayTextClass = 'my-1 text-xl font-bold text-white';
            } else if (isAvailable) {
              containerClass = 'mr-2 w-[66px] items-center rounded-2xl border px-2 py-3 bg-[#e7f6ed] border-[#e6f2e8]';
              textClass = 'text-xs font-medium text-[#287a4b]';
              dayTextClass = 'my-1 text-xl font-bold text-[#287a4b]';
            }

            return (
              <View key={x.toDateString()} className='relative'>
                <Pressable
                  accessibilityRole='button'
                  accessibilityState={{ selected, disabled: past }}
                  disabled={past}
                  accessibilityLabel={x.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  onPress={() => {
                    if (past) return; // Prevent selecting past dates
                    setSelectedDate(x);
                    setTime(null);
                    setEndTime(null);
                    setErr('');
                  }}
                  className={containerClass}
                >
                  <Text className={textClass}>{x.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                  <Text className={dayTextClass}>{x.getDate()}</Text>
                  <Text className={`text-[10px] ${selected ? 'text-blue-100' : 'text-muted'}`}>{x.toLocaleDateString('en-US', { month: 'short' })}</Text>
                </Pressable>
                {availability && !selected && !past && (
                  <DateAvailabilityBadge available={isAvailable} fullyBooked={isFullyBooked} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {kind === 'clinic' && (
        <View className={`mb-4 rounded-2xl border p-4 ${closed ? 'border-[#f0d6d6] bg-[#fff5f5]' : 'border-[#d8e6f8] bg-[#edf4ff]'}`}>
          <Text className={`text-sm font-semibold ${closed ? 'text-[#a34040]' : 'text-[#173b70]'}`}>
            {closed ? 'Clinic is closed on this day' : `Nurse on duty: ${nurse}`}
          </Text>
          <Text className='mt-1 text-xs text-muted'>
            {closed
              ? 'Please choose a weekday to see available appointments.'
              : 'Clinic appointments are available from 8:00 AM to 4:00 PM.'}
          </Text>
          {!closed && dateAvailability.length > 0 && (
            <Text className='mt-2 text-xs' style={{ color: isPast(selectedDate) ? '#98a4b4' : '#287a4b' }}>
              {isPast(selectedDate) ? 'Past date selected' : 'Nurses available for booking'}
            </Text>
          )}
        </View>
      )}

      <View className='rounded-2xl border border-line bg-white p-4'>
        <View className='mb-3'>
          <Text className='font-bold text-ink'>{kind === 'court' ? 'Choose a start time' : 'Available times'}</Text>
          <Text className='mt-1 text-xs text-muted'>{kind === 'court' ? 'Unavailable hours are hidden.' : 'Reserved times are marked.'}</Text>
        </View>
        <View className='flex-row flex-wrap gap-2'>
          {(kind === 'court' ? courtStartOptions.map(formatTime) : SLOTS).map((t) => {
            const off = closed || isSelectedDatePast || (kind === 'clinic' && taken(t));
            const selected = t === time;
            return (
              <Pressable
                key={t}
                accessibilityRole='button'
                accessibilityState={{ selected, disabled: off }}
                disabled={off}
                onPress={() => { setTime(t); setEndTime(null); setErr(''); }}
                className={`rounded-xl border px-3 py-2.5 ${off ? 'border-[#e8edf3] bg-[#f1f3f6]' : selected ? 'border-[#173b70] bg-[#173b70]' : 'border-[#dce6f2] bg-[#f8fafd]'}`}
              >
                <Text className={`text-sm font-medium ${off ? 'text-[#98a4b4]' : selected ? 'text-white' : 'text-[#314861]'}`}>
                  {t}{off && !closed && !isSelectedDatePast ? ' · Reserved' : ''}
                </Text>
              </Pressable>
            );
          })}
          {kind === 'court' && courtStartOptions.length === 0 && <Text className='py-2 text-sm text-muted'>No court times are available on this date.</Text>}
        </View>

        {kind === 'court' && time && (
          <View className='mt-5 border-t border-[#e8edf3] pt-4'>
            <Text className='font-bold text-ink'>Choose an end time</Text>
            <Text className='mb-3 mt-1 text-xs text-muted'>Select when your reservation will end.</Text>
            <View className='flex-row flex-wrap gap-2'>
              {courtEndOptions.map((end) => {
                const label = formatTime(end);
                const selected = label === endTime;
                return (
                  <Pressable
                    key={end}
                    accessibilityRole='button'
                    accessibilityState={{ selected }}
                    onPress={() => setEndTime(label)}
                    className={`rounded-xl border px-3 py-2.5 ${selected ? 'border-[#173b70] bg-[#173b70]' : 'border-[#dce6f2] bg-[#f8fafd]'}`}
                  >
                    <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-[#314861]'}`}>{label}</Text>
                  </Pressable>
                );
              })}
              {courtEndOptions.length === 0 && <Text className='py-2 text-sm text-muted'>No end times are available after this start time.</Text>}
            </View>
          </View>
        )}
      </View>

      {kind === 'court' && endTime && (
        <View className='mt-4 flex-row items-center justify-between rounded-2xl border border-[#d8e6f8] bg-[#edf4ff] p-4'>
          <View>
            <Text className='text-xs font-semibold uppercase tracking-wider text-[#526984]'>Estimated electricity fee</Text>
            <Text className='mt-1 font-semibold text-[#173b70]'>
              {courtBillableHours > 0
                ? `${courtBillableHours} electricity hour${courtBillableHours === 1 ? '' : 's'} after 6:00 PM × ₱100/hour`
                : `${courtHours} rental hour${courtHours === 1 ? '' : 's'} · free before 6:00 PM`}
            </Text>
          </View>
          <Text className='text-xl font-bold text-[#173b70]'>₱{courtFee}</Text>
        </View>
      )}

      {err ? <Text accessibilityRole='alert' className='mt-3 rounded-xl border border-[#f0d6d6] bg-[#fff5f5] p-3 text-sm text-[#a34040]'>{err}</Text> : null}
      <Pressable
        accessibilityRole='button'
        onPress={confirm}
        disabled={bookingDisabled}
        className={`mt-5 items-center rounded-2xl py-4 ${bookingDisabled ? 'bg-[#b6c4d7]' : 'bg-[#173b70]'}`}
      >
        <Text className='font-bold text-white'>Confirm booking</Text>
      </Pressable>
    </Page>
  );
}
