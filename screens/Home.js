import { View, Text, Pressable, ScrollView } from 'react-native';

const SERVICES = [
  ['documents', '📄', 'Document Request', 'Request barangay documents', 'border-crimson'],
  ['court', '📅', 'Court Scheduling', 'Book your court date', 'border-royal'],
  ['clinic', '🩺', 'Clinic Appointment', 'Schedule your clinic visit', 'border-crimson'],
];

export default function Home({ wide, onOpen }) {
  return (
    <ScrollView className='flex-1' contentContainerClassName='p-6'>
      <Text className={`${wide ? 'text-4xl' : 'text-2xl'} text-white`}>Welcome to</Text>
      <Text className={`${wide ? 'text-6xl' : 'text-3xl'} font-bold text-white`}>
        Barangay <Text className={wide ? 'text-white' : 'text-crimson'}>Services</Text>
      </Text>
      <Text className='mt-2 text-lg text-muted'>Fast. Easy. Convenient.</Text>
      {wide && <View className='mt-2 h-1 w-24 rounded-full bg-crimson' />}

      <View className={wide ? 'mt-8 flex-row gap-4' : 'mt-8 gap-3'}>
        {SERVICES.map(([id, icon, title, desc, color]) => (
          <Pressable
            key={id}
            onPress={() => onOpen(id)}
            className={`rounded-2xl bg-card active:opacity-80 ${color} ${
              wide ? 'flex-1 items-center border-t-4 p-8' : 'flex-row items-center border-l-4 p-4'
            }`}
          >
            <Text className={wide ? 'text-5xl' : 'mr-4 text-3xl'}>{icon}</Text>
            <View className={wide ? 'mt-3 items-center' : 'flex-1'}>
              <Text className='text-lg font-semibold text-white'>{title}</Text>
              <Text className='text-sm text-muted'>{desc}</Text>
            </View>
            <Text className={wide ? 'mt-4 text-2xl text-white' : 'text-2xl text-muted'}>
              {wide ? '→' : '›'}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
