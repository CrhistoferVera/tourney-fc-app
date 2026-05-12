import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Tournament } from '../../services/tournamentService';
import TournamentCard from '../tournament/TournamentCard';
import SectionHeader from '../tournament/SectionHeader';

type Props = {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPress: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export default function MisTorneosSection({
  tournaments,
  loading,
  error,
  onRetry,
  onPress,
  onRefresh,
  refreshing,
}: Props) {
  const router = useRouter();
  const active = tournaments.filter((t) => t.estado !== 'BORRADOR');
  const drafts = tournaments.filter((t) => t.estado === 'BORRADOR');

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );

  if (error)
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-danger text-sm text-center mb-3">{error}</Text>
        <TouchableOpacity onPress={onRetry}>
          <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0D7A3E"
          colors={['#0D7A3E']}
        />
      }
    >
      <View className="px-4 mt-4 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/create-tournament')}
          className="bg-primary rounded-2xl px-4 py-3 items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-medium text-sm">＋ Crear torneo</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4">
        <SectionHeader title="Activos" count={active.length} />
        {active.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
            <Text className="text-carbon text-sm text-center">No tienes torneos activos.</Text>
          </View>
        ) : (
          active.map((item) => (
            <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
          ))
        )}
      </View>

      <View className="px-4 mt-2">
        <SectionHeader title="Borradores" count={drafts.length} />
        {drafts.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center">
            <Text className="text-carbon text-sm text-center">No tienes borradores.</Text>
          </View>
        ) : (
          drafts.map((item) => (
            <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
