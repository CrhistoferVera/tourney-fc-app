import { View, Text } from 'react-native';

const TOTAL_STEPS = 5;

interface Props {
  step: number;
}

export default function ProgressBar({ step }: Props) {
  return (
    <>
      <Text className="text-carbon text-xs mb-1">Paso {step} de {TOTAL_STEPS}</Text>
      <View className="flex-row gap-1 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-mist'}`}
          />
        ))}
      </View>
    </>
  );
}