import './global.css';
import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './components/store';
import { AuthProvider, useAuth } from './components/auth';
import Auth from './screens/Auth';
import Home from './screens/Home';
import Documents from './screens/Documents';
import Schedule from './screens/Schedule';
import { MyRequests, MyAppointments, Notifications, Profile } from './screens/Lists';

const SIDEBAR = [
  ['home', 'Home', 'HM'],
  ['requests', 'My Requests', 'RQ'],
  ['appointments', 'My Appointments', 'AP'],
  ['profile', 'Settings', 'ST'],
];
const TABS = [
  ['home', 'Home', 'HM'],
  ['profile', 'Profile', 'PR'],
];

function NotificationBell({ count, onPress }) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={count ? `Notifications, ${count} unread` : 'Notifications'}
      onPress={onPress}
      className='mr-3 h-10 w-10 items-center justify-center rounded-xl border border-line'
    >
      <View className='h-4 w-4 items-center'>
        <View className='h-3.5 w-3.5 rounded-t-full border-2 border-white' />
        <View className='-mt-px h-0.5 w-4 rounded-full bg-white' />
        <View className='h-1 w-1 rounded-full bg-white' />
      </View>
      {count > 0 && (
        <View className='absolute -right-1 -top-1 min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-crimson px-1'>
          <Text className='text-[9px] font-bold text-white'>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Main() {
  const { profile } = useAuth();
  const { notes } = useApp();
  const unreadCount = notes.filter((note) => !note.read).length;
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState('home');
  const [svc, setSvc] = useState(null);
  const go = (nextTab) => { setSvc(null); setTab(nextTab); };
  const back = wide ? null : () => go('profile');

  let body;
  if (svc === 'documents') body = <Documents onBack={() => setSvc(null)} />;
  else if (svc) body = <Schedule key={svc} kind={svc} onBack={() => setSvc(null)} />;
  else if (tab === 'home') body = <Home wide={wide} onOpen={setSvc} />;
  else if (tab === 'requests') body = <MyRequests onBack={back} />;
  else if (tab === 'appointments') body = <MyAppointments onBack={back} />;
  else if (tab === 'notifications') body = <Notifications />;
  else body = <Profile go={go} />;

  if (wide)
    return (
      <View className='flex-1 flex-row bg-ink'>
        <View className='w-64 border-r border-line p-4'>
          <View className='mb-8 mt-2 border-l-4 border-crimson pl-3'>
            <Text className='text-xs font-semibold tracking-widest text-muted'>BARANGAY</Text>
            <Text className='text-lg font-bold text-white'>Services Portal</Text>
          </View>
          {SIDEBAR.map(([id, label, mark]) => (
            <Pressable key={id} onPress={() => go(id)} className={`mb-1 flex-row items-center rounded-xl px-3 py-3 ${!svc && tab === id ? 'bg-card' : ''}`}>
              <View className={`mr-3 h-7 w-7 items-center justify-center rounded-md ${!svc && tab === id ? 'bg-crimson' : 'bg-line'}`}>
                <Text className='text-[10px] font-bold text-white'>{mark}</Text>
              </View>
              <Text className='text-white'>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View className='flex-1'>
          <View className='flex-row items-center justify-between border-b border-line px-6 py-4'>
            <Text className='font-semibold text-white'>Resident services</Text>
            <View className='flex-row items-center'>
              <NotificationBell count={unreadCount} onPress={() => go('notifications')} />
              <Text className='text-sm text-muted'>{profile?.full_name || 'Resident'}</Text>
            </View>
          </View>
          {body}
          <View className='flex-row justify-between border-t border-line px-6 py-4'>
            <Text className='text-xs text-muted'>Copyright 2026 Barangay Services Portal</Text>
            <Text className='text-xs text-muted'>Serving our community</Text>
          </View>
        </View>
      </View>
    );

  const active = tab === 'requests' || tab === 'appointments' ? 'profile' : tab;
  return (
    <View className='flex-1 bg-ink'>
      <View className='flex-row items-center justify-between border-b border-line px-5 py-4'>
        <View>
          <Text className='text-xs font-semibold tracking-widest text-muted'>BARANGAY SERVICES</Text>
          <Text className='font-semibold text-white'>Resident portal</Text>
        </View>
        <View className='flex-row items-center'>
          <NotificationBell count={unreadCount} onPress={() => go('notifications')} />
          <Pressable onPress={() => go('profile')} className='rounded-lg border border-line px-3 py-2'>
            <Text className='text-xs font-semibold text-white'>{profile?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'ME'}</Text>
          </Pressable>
        </View>
      </View>
      {body}
      <View className='flex-row border-t border-line bg-ink'>
        {TABS.map(([id, label, mark]) => (
          <Pressable key={id} onPress={() => go(id)} className='flex-1 items-center py-2'>
            <View className={`mb-1 h-7 w-7 items-center justify-center rounded-md ${!svc && active === id ? 'bg-crimson' : 'bg-line'}`}>
              <Text className='text-[10px] font-bold text-white'>{mark}</Text>
            </View>
            <Text className={`text-[10px] ${!svc && active === id ? 'font-bold text-white' : 'text-muted'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) return <View className='flex-1 items-center justify-center bg-ink'><ActivityIndicator color='#D91E2A' /></View>;
  return session ? <Main /> : <Auth />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1 bg-ink'>
        <AuthProvider>
          <AppProvider>
            <Gate />
          </AppProvider>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
