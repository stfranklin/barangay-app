import { View, Text, Pressable, ScrollView } from 'react-native';

const SERVICES = [
  ['documents', '01', 'Document Request', 'Request barangay documents', 'border-crimson'],
  ['court', '02', 'Court Scheduling', 'Reserve the court by the hour', 'border-royal'],
  ['clinic', '03', 'Clinic Appointment', 'Schedule a clinic visit', 'border-crimson'],
];

export default function Home({ wide, onOpen }) {
  return (
    <ScrollView className='flex-1' contentContainerClassName='p-6'>
      <Text className='text-sm font-semibold tracking-widest text-muted'>WELCOME</Text>
      <Text className={`${wide ? 'text-5xl' : 'text-3xl'} mt-2 font-bold text-white`}>Barangay Services</Text>
      <Text className='mt-2 text-base text-muted'>Access local services and manage your requests online.</Text>

      <Text className='mb-3 mt-8 text-xs font-semibold tracking-widest text-muted'>AVAILABLE SERVICES</Text>
      <View className={wide ? 'flex-row gap-4' : 'gap-3'}>
        {SERVICES.map(([id, number, title, desc, color]) => (
          <Pressable
            key={id}
            onPress={() => onOpen(id)}
            className={`rounded-2xl border-l-4 bg-card active:opacity-80 ${color} ${wide ? 'flex-1 p-6' : 'flex-row items-center p-4'}`}
          >
            <View className={`${wide ? 'mb-5' : 'mr-4'} h-9 w-9 items-center justify-center rounded-lg bg-line`}>
              <Text className='text-xs font-bold text-muted'>{number}</Text>
            </View>
            <View className='flex-1'>
              <Text className='text-base font-semibold text-white'>{title}</Text>
              <Text className='mt-1 text-sm text-muted'>{desc}</Text>
            </View>
            <Text className='ml-3 text-lg font-semibold text-muted'>Open</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
