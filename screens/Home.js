import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from '../components/Icon';

const SERVICES = [
  { id: 'documents', icon: 'document', title: 'Document requests', description: 'Request certificates and other barangay documents.' },
  { id: 'court', icon: 'calendar', title: 'Court scheduling', description: 'Check availability and reserve a court time.' },
  { id: 'clinic', icon: 'clinic', title: 'Clinic appointments', description: 'See clinic services and book a visit.' },
];

export default function Home({ wide, onOpen }) {
  return (
    <ScrollView className='flex-1' contentContainerClassName='px-5 py-7'>
      <View className='w-full max-w-6xl self-center'>
        <View className='rounded-2xl border border-line bg-card p-6'>
          <Text className='text-xs font-semibold tracking-widest text-muted'>BARANGAY SERVICES</Text>
          <Text className={`${wide ? 'mt-3 text-4xl' : 'mt-2 text-3xl'} font-bold leading-tight text-white`}>
            How can we help you today?
          </Text>
          <Text className='mt-2 max-w-2xl text-base leading-6 text-muted'>Use the resident portal to request documents, reserve the court, or book a clinic visit.</Text>
        </View>

        <View className='mb-4 mt-8'>
          <Text className='text-xl font-semibold text-white'>Services</Text>
          <Text className='mt-1 text-sm text-muted'>Select a service to get started.</Text>
        </View>

        <View className={wide ? 'flex-row flex-wrap gap-4' : 'gap-3'}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              accessibilityRole='button'
              onPress={() => onOpen(service.id)}
              className={`rounded-2xl border border-line bg-card p-5 active:opacity-80 ${wide ? 'min-w-[240px] flex-1' : 'w-full'}`}
            >
              <View className='mb-5 h-11 w-11 items-center justify-center rounded-xl bg-line'>
                <Icon name={service.icon} color='#F3F4F6' size={23} />
              </View>
              <Text className='text-lg font-semibold text-white'>{service.title}</Text>
              <Text className='mt-1 text-sm leading-5 text-muted'>{service.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
