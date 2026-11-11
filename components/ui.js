import { Text, Pressable, ScrollView, View } from 'react-native';

export function Btn({ label, onPress, disabled, outline }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`mt-4 items-center rounded-xl py-3 active:opacity-80 ${
        disabled ? 'bg-line' : outline ? 'border border-line' : 'bg-crimson'
      }`}
    >
      <Text className='font-semibold text-white'>{label}</Text>
    </Pressable>
  );
}

export function Page({ title, onBack, children }) {
  return (
    <ScrollView className='flex-1' contentContainerClassName='p-5'>
      <View className='w-full max-w-3xl self-center'>
        {onBack && (
          <Pressable onPress={onBack}>
            <Text className='mb-2 text-crimson'>‹ Back</Text>
          </Pressable>
        )}
        <Text className='mb-4 text-2xl font-bold text-white'>{title}</Text>
        {children}
      </View>
    </ScrollView>
  );
}
