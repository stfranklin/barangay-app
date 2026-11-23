import { useEffect, useMemo, useState, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useAuth } from '../components/auth';
import { clinicBookingError } from '../components/bookingErrors';
import { supabase } from '../lib/supabase';
import MonthCalendar from '../components/MonthCalendar';

const CLINIC_HOURS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
const NURSES = ['Nurse Ana', 'Nurse Liza', 'Nurse Mae'];
const NURSES_COUNT = NURSES.length; // 3 nurses
const HOURS_PER_NURSE = CLINIC_HOURS.length; // 8 hours
const TOTAL_SLOTS_PER_DAY = NURSES_COUNT * HOURS_PER_NURSE; // 24 slots
const SERVICES = [
  { id: 'consultation', name: 'General consultation', description: 'Discuss a health concern with the clinic nurse.' },
  { id: 'screening', name: 'Basic health screening', description: 'Request a routine health check or screening.' },
  { id: 'maternal-child', name: 'Maternal and child health', description: 'Ask about maternal or child health services.' },
];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const dateFromKey = (key) => new Date(`${key}T12:00:00`);
const formatDate = (key) => dateFromKey(key).toLocaleDateString('en-PH', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
});
const toSqlTime = (label) => {
  const [clock, period] = label.split(' ');
  let [hour, minute] = clock.split(':').map(Number);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};
const nextHour = (label) => {
  const [clock, period] = label.split(' ');
  let [hour] = clock.split(':').map(Number);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour + 1).padStart(2, '0')}:00:00`;
};
const clinicDates = () => {
  const result = [];
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  while (result.length < 14) {
    if (date.getDay() !== 0 && date.getDay() !== 6) result.push(toDateKey(date));
    date.setDate(date.getDate() + 1);
  }
  return result;
};
const isOverlap = (booking, start, end) => {
  const bookedStart = booking.start_time?.slice(0, 5);
  const bookedEnd = booking.end_time?.slice(0, 5);
  if (!bookedStart || !bookedEnd) return booking.time === start;
  return start < bookedEnd && end > bookedStart;
};

// Blocking statuses are those that prevent slot availability (per database constraints)
const BLOCKING_STATUSES = new Set(['Confirmed', 'Declined', 'Completed']);
const isStatusBlocking = (status) => BLOCKING_STATUSES.has(status);

// Format date as YYYY-MM-DD string (not using toISOString for date comparisons)
const dateKeyToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a date is in the past
const isPast = (d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(d);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

// Get the start and end of a month for Supabase queries
const getMonthBounds = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  firstDay.setHours(0, 0, 0, 0);
  lastDay.setHours(23, 59, 59, 999);
  return { firstDay, lastDay };
};

const Status = ({ value }) => {
  const color = value === 'Confirmed' || value === 'Completed' ? 'text-green-500' : value === 'Declined' ? 'text-crimson' : 'text-royal';
  return <Text className={`font-semibold ${color}`}>{value || 'Pending'}</Text>;
};

function ClinicServicesPage({ onSelect, onBack }) {
  return (
    <Page title='Clinic services' onBack={onBack}>
      <Text className='mb-5 text-muted'>Choose the type of clinic appointment you need.</Text>
      {SERVICES.map((service, index) => (
        <Pressable key={service.id} onPress={() => onSelect(service)} className='mb-3 flex-row items-center rounded-2xl border-l-4 border-royal bg-card p-4'>
          <View className='mr-4 h-9 w-9 items-center justify-center rounded-lg bg-[#eaf2ff]'>
            <Text className='text-xs font-bold text-royal'>0{index + 1}</Text>
          </View>
          <View className='flex-1'>
            <Text className='font-semibold text-ink'>{service.name}</Text>
            <Text className='mt-1 text-sm text-muted'>{service.description}</Text>
          </View>
          <Text className='ml-2 text-sm font-semibold text-muted'>Select</Text>
        </Pressable>
      ))}
      <Btn outline label='My appointments' onPress={() => onSelect('appointments')} />
    </Page>
  );
}

function ClinicInformationPage({ onAvailability, onAppointments, onBack }) {
  return (
    <Page title='Clinic information' onBack={onBack}>
      <View className='mb-4 rounded-2xl bg-card p-5'>
        <Text className='text-xs font-semibold tracking-widest text-muted'>OPERATING HOURS</Text>
        <Text className='mt-2 font-semibold text-ink'>Monday to Friday</Text>
        <Text className='text-muted'>8:00 AM to 4:00 PM</Text>
        <Text className='mt-2 text-sm text-muted'>Closed on weekends. Last appointment starts at 3:00 PM.</Text>
      </View>
      <View className='mb-4 rounded-2xl bg-card p-5'>
        <Text className='font-semibold text-ink'>Before your visit</Text>
        <Text className='mt-2 text-sm text-muted'>Bring a valid ID and any relevant medical records. Please arrive a few minutes before your appointment.</Text>
      </View>
      <Text className='mb-4 text-sm text-muted'>Appointments are scheduled in one-hour blocks. You can choose a nurse and a time that is available.</Text>
      <Btn label='Check nurse availability' onPress={onAvailability} />
      <Btn outline label='My appointments' onPress={onAppointments} />
    </Page>
  );
}

function NurseAvailabilityPage({ dates, selectedDate, setSelectedDate, bookings, userId, loading, error, notice, onChoose, onBack, visibleMonth }) {
  // Filter bookings to only those for the selected date (fixes bug 1)
  const selectedDateObj = useMemo(() => selectedDate ? dateFromKey(selectedDate) : null, [selectedDate]);
  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDateObj) return [];
    const dateKey = toDateKey(selectedDateObj);
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return dateKeyToString(bookingDate) === dateKey;
    });
  }, [bookings, selectedDateObj]);

  // Check if a specific slot is blocked for a nurse
  const isSlotBlocked = useCallback((nurse, time) => {
    const startTime = toSqlTime(time).slice(0, 5);
    const endTime = nextHour(time).slice(0, 5);
    return bookingsForSelectedDate.some((booking) => {
      // Slot is blocked if:
      // 1. Booking is for this nurse AND the time overlaps
      // 2. Booking is for this user (their own booking blocks them)
      // 3. AND the status blocks the slot
      const isForThisNurse = booking.nurse === nurse;
      const isOwnBooking = booking.user_id === userId;
      const blocksSlot = isStatusBlocking(booking.status);
      return (isForThisNurse || isOwnBooking) && blocksSlot && isOverlap(booking, startTime, endTime);
    });
  }, [bookingsForSelectedDate, userId]);

  // Check if the date is fully booked (all nurses have all hours blocked)
  const isFullyBookedDate = useCallback((date) => {
    return NURSES.every((nurse) =>
      CLINIC_HOURS.every((time) => isSlotBlocked(nurse, time))
    );
  }, [isSlotBlocked]);

  const availability = useMemo(() => NURSES.map((nurse) => ({
    nurse,
    slots: CLINIC_HOURS.map((time) => ({
      time,
      booked: isSlotBlocked(nurse, time),
    })),
  })), [isSlotBlocked]);

  // Get clinic status for a given date
  const getStatus = useCallback((date) => {
    // Check if past date - should not be selectable but we still show availability
    if (isPast(date)) {
      return null;
    }

    // Check if weekend (closed)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'closed';
    }

    // Check if fully booked
    if (isFullyBookedDate(date)) {
      return 'fully-booked';
    }

    // Otherwise available
    return 'available';
  }, [isFullyBookedDate]);

  // Compute available day count from ALL days in the visible month (fixes bug 3)
  const availableDayCount = useMemo(() => {
    if (!visibleMonth) return 0;

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let count = 0;
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);

      // Skip past dates
      if (isPast(date)) continue;

      // Skip weekends (closed)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Skip if fully booked
      if (isFullyBookedDate(date)) continue;

      count++;
    }
    return count;
  }, [visibleMonth, isFullyBookedDate]);

  return (
    <Page title='Nurse availability' onBack={onBack}>
      <Text className='mb-3 text-muted'>Select a date to see available appointment times.</Text>

      {/* Month Calendar with availability markers */}
      <MonthCalendar
        selectedDate={selectedDate ? dateFromKey(selectedDate) : null}
        onSelect={(d) => setSelectedDate(toDateKey(d))}
        minDate={new Date()}
        getStatus={getStatus}
        legendCount={availableDayCount}
        onMonthChange={(firstDayOfMonth) => {
          // Month changed - parent should load new bookings
        }}
      />

      <Text className='mb-4 text-sm font-semibold text-ink'>{formatDate(selectedDate)}</Text>
      {loading ? <Text className='mb-4 text-muted'>Checking availability...</Text> : null}
      {error ? <Text className='mb-4 text-crimson'>{error}</Text> : null}
      {notice ? <Text className='mb-4 text-crimson'>{notice}</Text> : null}
      {availability.map(({ nurse, slots }) => (
        <View key={nurse} className='mb-3 rounded-2xl border border-line bg-card p-4'>
          <Text className='mb-3 font-semibold text-ink'>{nurse}</Text>
          <View className='flex-row flex-wrap gap-2'>
            {slots.map(({ time, booked }) => (
              <Pressable
                key={time}
                disabled={loading || booked || Boolean(error)}
                onPress={() => onChoose(nurse, time)}
                className={`rounded-xl border px-3 py-2.5 ${booked || loading || error ? 'border-line bg-unavailableLight' : 'border-royal bg-royal'}`}
              >
                <Text className={`text-sm font-medium ${booked || loading || error ? 'text-muted' : 'text-white'}`}>{time}{booked ? ' · Booked' : ''}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </Page>
  );
}

function AppointmentBookingForm({ service, date, nurse, time, profile, onConfirm, busy, error, onBack }) {
  return (
    <Page title='Appointment booking' onBack={onBack}>
      <View className='mb-4 rounded-2xl bg-card p-4'>
        <Text className='font-semibold text-ink'>{service?.name}</Text>
        <Text className='mt-2 text-sm text-muted'>{formatDate(date)}</Text>
        <Text className='text-sm text-muted'>{time} to {nextHour(time).slice(0, 5)} | {nurse}</Text>
      </View>
      <Text className='mb-2 font-semibold text-ink'>Resident details</Text>
      <View className='mb-4 rounded-2xl border border-line p-4'>
        <Text className='text-sm text-muted'>Name</Text>
        <Text className='mb-2 font-semibold text-ink'>{profile?.full_name || 'Resident'}</Text>
        <Text className='text-sm text-muted'>Contact number</Text>
        <Text className='font-semibold text-ink'>{profile?.contact || 'No contact number on file'}</Text>
      </View>
      <Text className='mb-3 text-sm text-muted'>Review the details, then submit your appointment request. The clinic will update its status after review.</Text>
      {error ? <Text className='text-crimson'>{error}</Text> : null}
      <Btn label={busy ? 'Submitting request...' : 'Confirm appointment'} onPress={onConfirm} disabled={busy} />
    </Page>
  );
}

function AppointmentConfirmationPage({ booking, onAppointments, onHome }) {
  return (
    <Page title='Appointment submitted'>
      <View className='mb-4 rounded-2xl border-l-4 border-royal bg-card p-5'>
        <Text className='text-xs font-semibold tracking-widest text-green-500'>REQUEST RECEIVED</Text>
        <Text className='mt-3 text-lg font-bold text-ink'>{booking.service}</Text>
        <Text className='mt-2 text-sm text-muted'>{formatDate(booking.date)}</Text>
        <Text className='text-sm text-muted'>{booking.time} | {booking.nurse}</Text>
        <Text className='mt-3 text-sm text-muted'>Reference: CLN-{booking.id}</Text>
        <View className='mt-3 flex-row items-center gap-2'><Text className='text-sm text-muted'>Status</Text><Status value={booking.status} /></View>
      </View>
      <Btn label='View my appointments' onPress={onAppointments} />
      <Btn outline label='Back to clinic services' onPress={onHome} />
    </Page>
  );
}

function ClinicMyAppointmentsPage({ appointments, loading, error, onSelect, onBack }) {
  return (
    <Page title='My clinic appointments' onBack={onBack}>
      {loading ? <Text className='py-4 text-muted'>Loading appointments...</Text> : null}
      {error ? <Text className='py-4 text-crimson'>{error}</Text> : null}
      {!loading && !error && appointments.length === 0 ? <Text className='py-4 text-muted'>You have no clinic appointments yet.</Text> : null}
      {appointments.map((appointment) => (
        <Pressable key={appointment.id} onPress={() => onSelect(appointment)} className='mb-3 rounded-2xl border-l-4 border-royal bg-card p-4'>
          <Text className='font-semibold text-ink'>{appointment.service}</Text>
          <Text className='mt-1 text-sm text-muted'>{formatDate(appointment.date)} | {appointment.time}</Text>
          <Text className='text-sm text-muted'>{appointment.nurse}</Text>
          <View className='mt-2'><Status value={appointment.status} /></View>
        </Pressable>
      ))}
    </Page>
  );
}

export function AppointmentDetailsPage({ appointment, onBack }) {
  const isClinic = appointment?.kind === 'clinic' || Boolean(appointment?.service);
  const title = appointment?.service || appointment?.title || 'Appointment details';
  const date = appointment?.date?.includes('-') ? formatDate(appointment.date) : appointment?.date;
  const time = appointment?.kind === 'court'
    ? `${appointment.startTime} - ${appointment.endTime}`
    : appointment?.time || `${appointment?.start_time?.slice(0, 5) || ''} - ${appointment?.end_time?.slice(0, 5) || ''}`;
  return (
    <Page title='Appointment details' onBack={onBack}>
      <View className='mb-4 rounded-2xl border-l-4 border-royal bg-card p-5'>
        <Text className='text-lg font-bold text-ink'>{title}</Text>
        <Text className='mt-3 text-sm text-muted'>{date}</Text>
        <Text className='text-sm text-muted'>{time}</Text>
        {appointment?.nurse ? <Text className='mt-1 text-sm text-muted'>{appointment.nurse}</Text> : null}
        {appointment?.hours ? <Text className='mt-1 text-sm text-muted'>{appointment.hours} hour{appointment.hours === 1 ? '' : 's'} | PHP {appointment.fee}</Text> : null}
        <View className='mt-4 border-t border-line pt-3'>
          <Text className='mb-1 text-xs font-semibold tracking-widest text-muted'>CURRENT STATUS</Text>
          <Status value={appointment?.status || 'Booked'} />
        </View>
        {appointment?.id ? <Text className='mt-3 text-xs text-muted'>Reference: {isClinic ? 'CLN-' : 'APT-'}{appointment.id}</Text> : null}
      </View>
    </Page>
  );
}

export default function ClinicFlow({ onBack, onAppointmentsUpdated }) {
  const { session, profile } = useAuth();
  const [page, setPage] = useState('services');
  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [availabilityNotice, setAvailabilityNotice] = useState('');
  const [booking, setBooking] = useState(null);
  const [monthlyBookings, setMonthlyBookings] = useState([]);

  // Track the currently visible month for data loading (bug 2 fix)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Initialize selectedDate from the first future weekday
  useEffect(() => {
    if (!selectedDate) {
      const initialDates = clinicDates();
      setSelectedDate(initialDates[0] || toDateKey(new Date()));
    }
  }, []);

  // Load clinic bookings for the visible month (bug 2 fix: depends on visibleMonth, not selectedDate)
  useEffect(() => {
    if (!visibleMonth) return undefined;

    let active = true;
    setLoading(true);
    setError('');

    // Get month bounds from visibleMonth
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Build date strings as YYYY-MM-DD (bug 2 fix: don't use toISOString)
    const firstDayStr = dateKeyToString(firstDay);
    const lastDayStr = dateKeyToString(lastDay);

    supabase.from('bookings')
      .select('id,user_id,date,time,nurse,service,start_time,end_time,status')
      .eq('kind', 'clinic')
      .gte('date', firstDayStr)
      .lte('date', lastDayStr)
      .then(({ data, error: queryError }) => {
        if (!active) return; // Ignore stale responses (bug 2)
        setMonthlyBookings(data || []);
        setError(queryError ? clinicBookingError(queryError, 'Could not load nurse availability. Check your connection and try again.') : '');
        setLoading(false);
      })
      .catch((queryError) => {
        if (!active) return;
        setMonthlyBookings([]);
        setError(queryError?.message || 'Could not load nurse availability.');
        setLoading(false);
      });

    return () => { active = false; };
  }, [visibleMonth]);

  // Load individual day availability for detailed time slots
  useEffect(() => {
    if (page !== 'availability' || !selectedDate) return undefined;

    let active = true;
    setLoading(true);
    setError('');

    supabase.from('bookings')
      .select('id,user_id,date,time,nurse,service,start_time,end_time,status')
      .eq('kind', 'clinic')
      .eq('date', selectedDate)
      .then(({ data, error: queryError }) => {
        if (!active) return;
        setAvailability(data || []);
        setError(queryError ? clinicBookingError(queryError, 'Could not load nurse availability. Check your connection and try again.') : '');
        setLoading(false);
      })
      .catch((queryError) => {
        if (!active) return;
        setAvailability([]);
        setError(queryError?.message || 'Could not load nurse availability.');
        setLoading(false);
      });

    return () => { active = false; };
  }, [page, selectedDate]);

  // Load user's appointments
  useEffect(() => {
    if (page !== 'appointments' || !session?.user?.id) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    supabase.from('bookings')
      .select('id,date,time,nurse,service,start_time,end_time,status')
      .eq('kind', 'clinic')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        setAppointments(data || []);
        setError(queryError ? clinicBookingError(queryError, 'Could not load your appointments. Check your connection and try again.') : '');
        setLoading(false);
      })
      .catch((queryError) => {
        if (!active) return;
        setError(queryError?.message || 'Could not load your appointments.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [page, session?.user?.id]);

  const chooseService = (value) => {
    if (value === 'appointments') setPage('appointments');
    else { setService(value); setPage('information'); }
  };

  const chooseSlot = (nurse, time) => {
    setSelectedNurse(nurse);
    setSelectedTime(time);
    setError('');
    setAvailabilityNotice('');
    setPage('booking');
  };

  const confirmBooking = async () => {
    if (!session?.user?.id || !service || !selectedNurse || !selectedTime) {
      setError('Please sign in again and check the appointment details.');
      return;
    }
    setBusy(true);
    setError('');
    const insert = {
      user_id: session.user.id,
      kind: 'clinic',
      date: selectedDate,
      time: selectedTime,
      nurse: selectedNurse,
      service: service.name,
      start_time: toSqlTime(selectedTime),
      end_time: nextHour(selectedTime),
      status: 'Pending',
    };
    try {
      const { data, error: insertError } = await supabase.from('bookings').insert(insert).select('id,date,time,nurse,service,start_time,end_time,status,kind').single();
      setBusy(false);
      if (insertError) {
        if (insertError.code === '23P01' || insertError.code === '23505') {
          setAvailabilityNotice(clinicBookingError(insertError));
          setPage('availability');
        } else {
          setError(clinicBookingError(insertError, 'Could not submit the appointment. Check your connection and try again.'));
        }
        return;
      }
      setBooking(data);
      onAppointmentsUpdated?.();
      setPage('confirmation');
    } catch (insertError) {
      setBusy(false);
      setError(insertError?.message || 'Could not submit the appointment. Please try again.');
    }
  };

  if (page === 'information') return <ClinicInformationPage onBack={() => setPage('services')} onAvailability={() => setPage('availability')} onAppointments={() => setPage('appointments')} />;
  if (page === 'availability') return (
    <NurseAvailabilityPage
      dates={clinicDates()}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      bookings={monthlyBookings}
      userId={session?.user?.id}
      loading={loading}
      error={error}
      notice={availabilityNotice}
      onChoose={chooseSlot}
      onBack={() => setPage('information')}
      visibleMonth={visibleMonth}
      onMonthChange={(firstDayOfMonth) => setVisibleMonth(firstDayOfMonth)}
    />
  );
  if (page === 'booking') return <AppointmentBookingForm service={service} date={selectedDate} nurse={selectedNurse} time={selectedTime} profile={profile} onConfirm={confirmBooking} busy={busy} error={error} onBack={() => setPage('availability')} />;
  if (page === 'confirmation') return <AppointmentConfirmationPage booking={booking} onAppointments={() => setPage('appointments')} onHome={() => setPage('services')} />;
  if (page === 'appointments') return <ClinicMyAppointmentsPage appointments={appointments} loading={loading} error={error} onSelect={(item) => { setSelectedAppointment(item); setPage('details'); }} onBack={() => setPage('services')} />;
  if (page === 'details') return <AppointmentDetailsPage appointment={selectedAppointment} onBack={() => setPage('appointments')} />;
  return <ClinicServicesPage onSelect={chooseService} onBack={onBack} />;
}