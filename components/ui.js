import { Text, Pressable, ScrollView, View, TextInput } from 'react-native';

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

export function Field({ label, value, onChangeText, placeholder, keyboardType, secure }) {
  return (
    <View className='mb-3'>
      <Text className='mb-1 text-sm text-muted'>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#6B7280'
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize='none'
        className='rounded-xl border border-line bg-card px-3 py-3 text-white'
      />
    </View>
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
