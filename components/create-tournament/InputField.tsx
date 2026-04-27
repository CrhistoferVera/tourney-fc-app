import { View, Text, TextInput } from 'react-native';

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
  error?: string;
}

export default function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  error,
}: Props) {
  return (
    <View className="mb-4">
      <Text className="text-carbon text-sm font-sans-medium mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3D4F44"
        multiline={multiline}
        keyboardType={keyboardType}
        className={`bg-white rounded-xl px-4 text-night font-sans text-sm border ${
          error ? 'border-danger' : 'border-mist'
        } ${multiline ? 'py-3 min-h-[90px]' : 'py-3'}`}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
      {error ? (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}