import { View, TextInput } from 'react-native';
import { useRef } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeInput({ value, onChange }: CodeInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(6, '').split('');

  const handleChange = (text: string, index: number) => {
    const newDigits = digits.slice();
    newDigits[index] = text.replace(/[^0-9]/g, '').slice(-1);
    const newValue = newDigits.join('').trim();
    onChange(newValue);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-between gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          className="flex-1 h-14 bg-mist rounded-xl text-center text-night text-xl font-sans-medium border-2 border-transparent focus:border-primary"
          maxLength={1}
          keyboardType="numeric"
          value={digits[i] !== ' ' ? digits[i] : ''}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
        />
      ))}
    </View>
  );
}