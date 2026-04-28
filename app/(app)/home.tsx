import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState, useCallback } from 'react';
import {
  getMyTournaments,
  getPublicTournaments,
  Tournament,
} from '../../services/tournamentService';
import TournamentCard from '../../components/tournament/TournamentCard';
import SectionHeader from '../../components/tournament/SectionHeader';
import DrawerMenu from '../../components/DrawerMenu';


const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

const STATUS_STYLE: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  BORRADOR:       { label: 'Borrador',      bg: 'bg-carbon',        text: 'text-white' },
  EN_INSCRIPCION: { label: 'Inscripción',   bg: 'bg-accent-soft',   text: 'text-accent' },
  EN_CURSO:       { label: 'Activo',        bg: 'bg-primary-light', text: 'text-primary' },
  FINALIZADO:     { label: 'Finalizado',    bg: 'bg-mist',          text: 'text-carbon' },
};


function StatusBadge({ estado }: { estado: string }) {
  const s = STATUS_STYLE[estado] ?? { label: estado, bg: 'bg-mist', text: 'text-carbon' };
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.bg}`}>
      <Text className={`text-xs font-sans-medium ${s.text}`}>{s.label}</Text>
    </View>
  );
}





function EmptyState({ message }: { message: string }) {
  return (
    <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
      <Text className="text-carbon text-sm text-center">{message}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [mine, publics] = await Promise.all([
        getMyTournaments(),
        getPublicTournaments(),
      ]);
      setMyTournaments(Array.isArray(mine) ? mine : []);
      setPublicTournaments(Array.isArray(publics) ? publics : []);
    } catch {
      setError('No se pudieron cargar los torneos.');
    }
  }, [token]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const myDrafts = myTournaments.filter((t) => t.estado === 'BORRADOR');
  const myActive = myTournaments.filter((t) => t.estado !== 'BORRADOR');
  const myIds = new Set(myTournaments.map((t) => t.id));
  const otherPublic = publicTournaments.filter((t) => !myIds.has(t.id));
  const allVisible = [...myActive, ...otherPublic];

  return (
    <View className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => setDrawerOpen(true)}>
          <View className="gap-1">
            <View className="w-6 h-0.5 bg-white rounded-full" />
            <View className="w-6 h-0.5 bg-white rounded-full" />
            <View className="w-6 h-0.5 bg-white rounded-full" />
          </View>
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium">TourneyFC</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7A3E" colors={['#0D7A3E']} />
          }
        >
          {error ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
              <Text className="text-danger text-sm text-center mb-2">{error}</Text>
              <TouchableOpacity onPress={fetchData}>
                <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <SectionHeader title="Torneos disponibles" count={allVisible.length} />
          {allVisible.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
              <Text className="text-carbon text-sm text-center">No hay torneos publicados aún.</Text>
            </View>
          ) : (
            allVisible.map((item) => (
              <TournamentCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/(app)/tournament/${item.id}` as never)}
              />
            ))
          )}

          {myDrafts.length > 0 ? (
            <>
              <View className="mt-4" />
              <SectionHeader title="Mis borradores" count={myDrafts.length} />
              {myDrafts.map((item) => (
                <TournamentCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/(app)/tournament/${item.id}` as never)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        publicTournaments={allVisible}
        draftTournaments={myDrafts}
        onCreateTournament={() => router.push('/(app)/create-tournament')}
        onSelectTournament={(id) => router.push(`/(app)/tournament/${id}` as never)}
      />
    </View>
  );
}