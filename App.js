import './global.css';
import { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './components/store';
import Home from './screens/Home';
import Documents from './screens/Documents';
import Schedule from './screens/Schedule';
import { MyRequests, MyAppointments, Notifications, Profile } from './screens/Lists';

const SIDEBAR = [
  ['home', 'Home', '🏠'],
  ['requests', 'My Requests', '📄'],
  ['appointments', 'My Appointments', '📅'],
  ['notifications', 'Notifications', '🔔'],
  ['profile', 'Settings', '⚙️'],
];
const TABS = [
  ['home', 'Home', '🏠'],
  ['notifications', 'Notifications', '🔔'],
  ['profile', 'Profile', '👤'],
];

function Shell() {
  const { width } = useWindowDimensions();
  const wide = width >= 900; // sidebar layout on web, tab bar on phones
  const [tab, setTab] = useState('home');
  const [svc, setSvc] = useState(null);
  const go = (t) => { setSvc(null); setTab(t); };
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
        <View className='w-60 border-r border-line p-4'>
          <Text className='mb-6 mt-2 text-xl font-bold text-white'>🏠 BARANGAY</Text>
          {SIDEBAR.map(([id, label, icon]) => (
            <Pressable
              key={id}
              onPress={() => go(id)}
              className={`mb-1 flex-row items-center rounded-xl px-3 py-3 ${!svc && tab === id ? 'bg-crimson' : ''}`}
            >
              <Text className='mr-3'>{icon}</Text>
              <Text className='text-white'>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View className='flex-1'>
          <View className='flex-row items-center justify-end border-b border-line px-6 py-4'>
            <Text className='text-white'>👤  Juan Dela Cruz</Text>
          </View>
          {body}
          <View className='flex-row justify-between border-t border-line px-6 py-4'>
            <Text className='text-muted'>© 2026 Barangay Services Portal</Text>
            <Text className='text-muted'>Serving our community</Text>
          </View>
        </View>
      </View>
    );

  const active = tab === 'requests' || tab === 'appointments' ? 'profile' : tab;
  return (
    <View className='flex-1 bg-ink'>
      <View className='flex-row items-center justify-between px-5 py-4'>
        <Text className='text-lg font-bold text-white'>🏠 BARANGAY</Text>
        <Pressable onPress={() => go('profile')}><Text className='text-2xl'>👤</Text></Pressable>
      </View>
      {body}
      <View className='flex-row border-t border-line bg-ink'>
        {TABS.map(([id, label, icon]) => (
          <Pressable key={id} onPress={() => go(id)} className='flex-1 items-center py-3'>
            <Text className='text-xl'>{icon}</Text>
            <Text className={`text-xs ${!svc && active === id ? 'font-bold text-crimson' : 'text-muted'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1 bg-ink'>
        <AppProvider>
          <Shell />
        </AppProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
