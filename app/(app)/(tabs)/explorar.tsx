import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTournaments } from '../../../hooks/useTournaments';
import ExplorarSection from '../../../components/home/ExplorarSection';

export default function ExplorarTab() {
  const router = useRouter();
  const { myTournaments, publicTournaments, loading, refreshing, error, fetchData, onRefresh } =
    useTournaments();

  return (
    <View className="flex-1 bg-mist">
      <ExplorarSection
        myTournaments={myTournaments}
        publicTournaments={publicTournaments}
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
