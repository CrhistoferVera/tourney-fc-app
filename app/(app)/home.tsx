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

function TournamentCard({
  item,
  onPress,
}: {
  item: Tournament;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{ shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      {/* Color accent bar based on status */}
      <View
        className={`h-1 w-full ${
          item.estado === 'EN_CURSO'
            ? 'bg-primary'
            : item.estado === 'EN_INSCRIPCION'
            ? 'bg-accent'
            : item.estado === 'BORRADOR'
            ? 'bg-carbon'
            : 'bg-mist'
        }`}
      />
      <View className="px-4 py-3">
        <View className="flex-row justify-between items-start mb-1">
          <Text
            className="text-night font-sans-medium text-base flex-1 mr-2"
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          <StatusBadge estado={item.estado} />
        </View>

        <View className="flex-row items-center gap-3 mt-1">
          <Text className="text-carbon text-xs">
            {FORMAT_LABEL[item.formato] ?? item.formato} · {item.maxEquipos} equipos
          </Text>
        </View>

        {item.zona ? (
          <Text className="text-carbon text-xs mt-0.5">📍 {item.zona}</Text>
        ) : null}

        {item.rolUsuario ? (
          <Text className="text-primary text-xs font-sans-medium mt-1">
            Tu rol: {item.rolUsuario}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center mb-3 mt-1">
      <Text className="text-night font-sans-medium text-base flex-1">{title}</Text>
      <View className="bg-primary-light px-2 py-0.5 rounded-full">
        <Text className="text-primary text-xs font-sans-medium">{count}</Text>
      </View>
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
  const { usuario } = useAuthStore();

  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
        <Text className="text-white text-xl font-sans-medium">TourneyFC</Text>
        <TouchableOpacity onPress={() => router.push('/(profile)')}>
          {usuario?.fotoPerfil ? (
            <Image
              source={{ uri: usuario.fotoPerfil }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary-dark items-center justify-center">
              <Text className="text-white text-sm font-sans-medium">
                {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Body */}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D7A3E"
              colors={['#0D7A3E']}
            />
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

          <TouchableOpacity
            onPress={() => router.push('/(app)/create-tournament')}
            className="bg-primary rounded-2xl px-4 py-3 flex-row items-center justify-center mb-5"
            activeOpacity={0.85}
          >
            <Text className="text-white font-sans-medium text-sm mr-1">＋</Text>
            <Text className="text-white font-sans-medium text-sm">Crear torneo</Text>
          </TouchableOpacity>

          {/* Section 1: Torneos publicados y disponibles */}
          <SectionHeader
            title="Torneos disponibles"
            count={allVisible.length}
          />
          {allVisible.length === 0 ? (
            <EmptyState message="No hay torneos publicados aún." />
          ) : (
            allVisible.map((item) => (
              <TournamentCard
                key={item.id}
                item={item}
                onPress={() =>
                  router.push(`/(app)/tournament/${item.id}` as never)
                }
              />
            ))
          )}

          {/* Section 2: Borradores (solo propios) */}
          {myDrafts.length > 0 ? (
            <>
              <View className="mt-4" />
              <SectionHeader title="Mis borradores" count={myDrafts.length} />
              {myDrafts.map((item) => (
                <TournamentCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push(`/(app)/tournament/${item.id}` as never)
                  }
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}