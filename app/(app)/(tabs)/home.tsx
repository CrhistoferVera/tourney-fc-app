import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardSection from '../../../components/home/DashboardSection';

export default function HomeTab() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-mist">
      <View className="bg-primary px-6 pt-14 pb-4">
        <Text className="text-white text-xl font-sans-medium">Inicio</Text>
      </View>
      <DashboardSection onPressTorneo={(id) => router.push(`/(app)/tournament/${id}` as never)} />
    </View>
  );
}
