import { View } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardSection from '../../../components/home/DashboardSection';

export default function HomeTab() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-mist">
      <DashboardSection onPressTorneo={(id) => router.push(`/(app)/tournament/${id}` as never)} />
    </View>
  );
}
