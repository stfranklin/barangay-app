import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import Icon from '../components/Icon';
import { useApp, STATUSES, REJECTED, statusLabel } from '../components/store';

const barangayBanner = require('../assets/barangay-services-banner.png');
const BANNER_ASPECT_RATIO = 1999 / 357;
const SERVICES = [
  { id: 'documents', icon: 'document', title: 'Document Request', description: 'Request barangay documents', accent: '#2D5FA5', tint: '#E0ECFF' },
  { id: 'court', icon: 'calendar', title: 'Court Schedule', description: 'Book a court date', accent: '#478461', tint: '#E1F5E8' },
  { id: 'clinic', icon: 'clinic', title: 'Clinic Appointment', description: 'Schedule a clinic visit', accent: '#C74747', tint: '#FCE6E6' },
];

export default function Home({ wide, onOpen, onViewRequests }) {
  const { requests } = useApp();
  const recentRequests = requests.slice(0, 2);
  const [bannerWidth, setBannerWidth] = useState(0);

  return (
    <ScrollView className='flex-1 bg-[#F4F7FC]' contentContainerClassName='relative px-5 py-7'>
      <View pointerEvents='none' className={`absolute left-0 right-0 top-0 overflow-hidden ${wide ? 'h-[720px]' : 'h-[520px]'}`}>
        <View className={`absolute h-16 rounded-full rotate-[-28deg] ${wide ? '-right-36 top-28 w-[760px]' : '-right-20 top-24 w-[360px]'}`} style={{ backgroundColor: '#1769D2', opacity: 0.1 }} />
        <View className={`absolute h-6 rounded-full rotate-[-28deg] bg-white ${wide ? '-right-36 top-44 w-[760px]' : '-right-20 top-40 w-[360px]'}`} style={{ opacity: 0.9 }} />
        <View className={`absolute h-5 rounded-full rotate-[-28deg] ${wide ? '-right-36 top-52 w-[760px]' : '-right-20 top-48 w-[360px]'}`} style={{ backgroundColor: '#347FE0', opacity: 0.11 }} />
        <View className={`absolute h-2 rounded-full rotate-[-28deg] ${wide ? '-right-36 top-60 w-[760px]' : '-right-20 top-56 w-[360px]'}`} style={{ backgroundColor: '#164A9A', opacity: 0.08 }} />
      </View>
      <View className='z-10 w-full max-w-6xl self-center'>
        <View
          className='mb-5 w-full self-center overflow-hidden rounded-xl'
          onLayout={({ nativeEvent }) => {
            const nextWidth = nativeEvent.layout.width;
            setBannerWidth((currentWidth) => Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth);
          }}
        >
          <Image
            source={barangayBanner}
            resizeMode='cover'
            accessibilityLabel='Welcome to Barangay Services, Barangay Halang, Cavite'
            className='w-full'
            style={{ width: '100%', height: bannerWidth / BANNER_ASPECT_RATIO }}
          />
        </View>

        <View className='mb-3'>
          <Text className='text-xl font-bold text-ink'>Explore services</Text>
          <Text className='mt-1 text-sm text-muted'>Choose a service to get started.</Text>
        </View>

        <View className={wide ? 'flex-row flex-wrap gap-3' : 'gap-3'}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              accessibilityRole='button'
              onPress={() => onOpen(service.id)}
              className={`relative rounded-2xl border border-line bg-card p-4 active:opacity-80 ${wide ? 'min-w-[220px] flex-1' : 'w-full'}`}
              style={{ borderTopWidth: 4, borderTopColor: service.accent }}
            >
              <View className='mb-4 h-11 w-11 items-center justify-center rounded-xl' style={{ backgroundColor: service.tint }}>
                <Icon name={service.icon} color={service.accent} size={22} />
              </View>
              <Text className='text-base font-semibold text-ink'>{service.title}</Text>
              <Text className='mt-1 text-sm leading-5 text-muted'>{service.description}</Text>
              <Text className='absolute right-4 top-5 text-xl text-crimson'>›</Text>
            </Pressable>
          ))}
        </View>

        <View className='mt-8 overflow-hidden rounded-2xl border border-line bg-card'>
          <View className='flex-row items-center justify-between bg-royal px-5 py-4'>
            <View>
              <Text className='text-xs font-bold tracking-widest text-blue-100'>YOUR SERVICE ACTIVITY</Text>
              <Text className='mt-1 text-lg font-bold text-white'>My Requests</Text>
            </View>
            <View className='h-11 min-w-11 items-center justify-center rounded-full bg-white px-3'>
              <Text className='text-lg font-bold text-royal'>{requests.length}</Text>
            </View>
          </View>

          <View className='p-4'>
            {recentRequests.length === 0 ? (
              <View className='items-center rounded-xl bg-canvas px-4 py-5'>
                <View className='mb-3 h-11 w-11 items-center justify-center rounded-xl bg-white'>
                  <Icon name='document' color='#3265A8' size={22} />
                </View>
                <Text className='font-semibold text-ink'>No requests yet</Text>
                <Text className='mt-1 text-center text-sm text-muted'>Your document request updates will appear here.</Text>
                <Pressable
                  accessibilityRole='button'
                  onPress={() => onOpen('documents')}
                  className='mt-4 rounded-xl bg-royal px-4 py-2.5 active:opacity-80'
                >
                  <Text className='text-sm font-semibold text-white'>Request a document</Text>
                </Pressable>
              </View>
            ) : (
              <View className={wide ? 'flex-row gap-3' : 'gap-3'}>
                {recentRequests.map((request) => {
                  const rejected = request.status === REJECTED;
                  const complete = request.status === STATUSES.length - 1;
                  const statusColor = rejected ? '#C74747' : complete ? '#478461' : '#3265A8';
                  return (
                    <Pressable
                      key={request.id}
                      accessibilityRole='button'
                      accessibilityLabel={`${request.doc}, ${statusLabel(request.status)}`}
                      onPress={onViewRequests}
                      className={`rounded-xl border border-line bg-white p-4 active:opacity-80 ${wide ? 'flex-1' : ''}`}
                      style={{ borderLeftWidth: 4, borderLeftColor: statusColor }}
                    >
                      <View className='flex-row items-start justify-between gap-2'>
                        <View className='flex-1'>
                          <Text numberOfLines={1} className='font-bold text-ink'>{request.doc}</Text>
                          <Text className='mt-1 text-xs text-muted'>{request.ref}  |  {request.date}</Text>
                        </View>
                        <View className='rounded-full px-2.5 py-1' style={{ backgroundColor: rejected ? '#FCE6E6' : complete ? '#E1F5E8' : '#E0ECFF' }}>
                          <Text className='text-xs font-semibold' style={{ color: statusColor }}>{statusLabel(request.status)}</Text>
                        </View>
                      </View>
                      {!rejected && (
                        <View className='mt-4 flex-row gap-1'>
                          {STATUSES.map((status, index) => (
                            <View key={status} className='h-1.5 flex-1 rounded-full' style={{ backgroundColor: index <= request.status ? statusColor : '#E2E8F0' }} />
                          ))}
                        </View>
                      )}
                      <Text className='mt-3 text-xs font-semibold text-muted'>Tap to view request details</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {requests.length > 0 && (
              <Pressable accessibilityRole='button' onPress={onViewRequests} className='mt-3 items-center rounded-xl bg-canvas py-3 active:opacity-80'>
                <Text className='text-sm font-semibold text-royal'>View all requests</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
