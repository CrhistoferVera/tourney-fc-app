import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTournaments } from '../../../hooks/useTournaments';
import MisTorneosSection from '../../../components/home/MisTorneosSection';

export default function MisTorneosTab() {
  const router = useRouter();
  const { myTournaments, loading, refreshing, error, fetchData, onRefresh } = useTournaments();

  return (
    <View className="flex-1 bg-mist">
      <View className="bg-primary px-6 pt-14 pb-4">
        <Text className="text-white text-xl font-sans-medium">Mis torneos</Text>
      </View>
      <MisTorneosSection
        tournaments={myTournaments}
        loading={loading}
        error={error}
        onRetry={fetchData}
        onPress={(id) => router.push(`/(app)/tournament/${id}` as never)}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}
