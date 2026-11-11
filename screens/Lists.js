import { View, Text, Pressable } from 'react-native';
import { Btn, Page } from '../components/ui';
import { useApp, STATUSES } from '../components/store';

const Empty = ({ text }) => <Text className='mt-8 text-center text-muted'>{text}</Text>;

export function MyRequests({ onBack }) {
  const { requests, advance } = useApp();
  return (
    <Page title='My Requests' onBack={onBack}>
      {requests.length === 0 && <Empty text='No document requests yet.' />}
      {requests.map((r) => (
        <View key={r.ref} className='mb-3 rounded-2xl border-l-4 border-crimson bg-card p-4'>
          <Text className='font-bold text-white'>{r.doc}</Text>
          <Text className='text-sm text-muted'>{r.ref} · {r.date}</Text>
          <Text className='mt-2 font-semibold text-crimson'>{STATUSES[r.status]}</Text>
          <View className='mt-2 flex-row gap-1'>
            {STATUSES.map((s, i) => (
              <View key={s} className={`h-1 flex-1 rounded-full ${i <= r.status ? 'bg-crimson' : 'bg-line'}`} />
            ))}
          </View>
          {/* Demo only: staff would normally update this from the admin side. */}
          {r.status < STATUSES.length - 1 && (
            <Btn outline label='Demo: advance status' onPress={() => advance(r.ref)} />
          )}
        </View>
      ))}
    </Page>
  );
}

export function MyAppointments({ onBack }) {
  const { bookings } = useApp();
  return (
    <Page title='My Appointments' onBack={onBack}>
      {bookings.length === 0 && <Empty text='No bookings yet.' />}
      {bookings.map((b) => (
        <View
          key={b.id}
          className={`mb-3 rounded-2xl border-l-4 bg-card p-4 ${b.kind === 'court' ? 'border-royal' : 'border-crimson'}`}
        >
          <Text className='font-bold text-white'>{b.title}</Text>
          <Text className='text-muted'>{b.date} at {b.time}</Text>
          {b.nurse && <Text className='text-muted'>{b.nurse}</Text>}
        </View>
      ))}
    </Page>
  );
}

export function Notifications() {
  const { notes } = useApp();
  return (
    <Page title='Notifications'>
      {notes.map((n) => (
        <View key={n.id} className='mb-2 rounded-xl bg-card p-4'>
          <Text className='text-white'>{n.text}</Text>
        </View>
      ))}
    </Page>
  );
}

export function Profile({ go }) {
  return (
    <Page title='Profile'>
      <View className='mb-4 flex-row items-center rounded-2xl bg-card p-4'>
        <Text className='mr-4 text-4xl'>👤</Text>
        <View>
          <Text className='text-lg font-bold text-white'>Juan Dela Cruz</Text>
          <Text className='text-muted'>Resident</Text>
        </View>
      </View>
      {[['requests', 'My Requests'], ['appointments', 'My Appointments']].map(([id, label]) => (
        <Pressable key={id} onPress={() => go(id)} className='mb-2 flex-row justify-between rounded-xl bg-card p-4'>
          <Text className='text-white'>{label}</Text>
          <Text className='text-muted'>›</Text>
        </Pressable>
      ))}
    </Page>
  );
}
