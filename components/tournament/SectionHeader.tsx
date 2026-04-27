import { View, Text } from 'react-native';

interface Props {
  title: string;
  count: number;
}

export default function SectionHeader({ title, count }: Props) {
  return (
    <View className="flex-row items-center mb-3 mt-1">
      <Text className="text-night font-sans-medium text-base flex-1">{title}</Text>
      <View className="bg-primary-light px-2 py-0.5 rounded-full">
        <Text className="text-primary text-xs font-sans-medium">{count}</Text>
      </View>
    </View>
  );
}