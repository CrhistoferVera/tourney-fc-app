import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getMyTournaments,
  getPublicTournaments,
  Tournament,
} from '../../services/tournamentService';
import TournamentCard from '../../components/tournament/TournamentCard';
import SectionHeader from '../../components/tournament/SectionHeader';
import DrawerMenu, { DrawerSection } from '../../components/DrawerMenu';
import { useDashboard } from '../../hooks/useDashboard';
import ProximoPartidoCard from '../../components/dashboard/ProximoPartidoCard';
import TorneoResumenCard from '../../components/dashboard/TorneoResumenCard';
import ResultadoCard from '../../components/dashboard/ResultadoCard';
import { Feather } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { useRef } from 'react';

// ─── Dashboard ────────────────────────────────────────────────
function DashboardSection({ onPressTorneo }: { onPressTorneo: (id: string) => void }) {
  const { data, loading, error, fetchDashboard } = useDashboard();
  const { usuario } = useAuthStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
        <TouchableOpacity onPress={fetchDashboard}>
          <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-5 pb-3">
        <Text className="text-night text-2xl font-sans-medium">
          Hola, {usuario?.nombre?.split(' ')[0]}
        </Text>
        <Text className="text-carbon text-sm capitalize">{hoy}</Text>
      </View>
      {data?.proximoPartido ? (
        <ProximoPartidoCard partido={data.proximoPartido} />
      ) : (
        <View className="mx-4 mb-4 bg-mist rounded-2xl p-4 items-center">
          <Text className="text-carbon text-sm">No tienes partidos próximos</Text>
        </View>
      )}
      {data?.torneos && data.torneos.length > 0 ? (
        <View className="mb-4">
          <Text className="text-night font-sans-medium text-base px-4 mb-3">Mis torneos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          >
            {data.torneos.map((t) => (
              <TorneoResumenCard key={t.id} torneo={t} onPress={onPressTorneo} />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {data?.ultimosResultados && data.ultimosResultados.length > 0 ? (
        <View className="mb-4">
          <Text className="text-night font-sans-medium text-base px-4 mb-3">
            Últimos resultados
          </Text>
          {data.ultimosResultados.map((r) => (
            <ResultadoCard key={r.id} resultado={r} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── Filtros ──────────────────────────────────────────────────
type Filtro = 'todos' | 'liga' | 'copa' | 'borrador' | 'publicado';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'liga', label: 'Liga' },
  { key: 'copa', label: 'Copa' },
  { key: 'publicado', label: 'Publicados' },
  { key: 'borrador', label: 'Borradores' },
];

// ─── Explorar ─────────────────────────────────────────────────
function ExplorarSection({
  myTournaments,
  publicTournaments,
  loading,
  error,
  onRetry,
  onPress,
  onRefresh,
  refreshing,
}: {
  myTournaments: Tournament[];
  publicTournaments: Tournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPress: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const myDrafts = myTournaments.filter((t) => t.estado === 'BORRADOR');
  const myActive = myTournaments.filter((t) => t.estado !== 'BORRADOR');
  const myIds = new Set(myTournaments.map((t) => t.id));
  const otherPublic = publicTournaments.filter((t) => !myIds.has(t.id));
  const allPublished = [...myActive, ...otherPublic];

  const applySearch = (list: Tournament[]) => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((t) => t.nombre.toLowerCase().includes(q));
  };

  const applyFormatFilter = (list: Tournament[]) => {
    if (filtro === 'liga') return list.filter((t) => t.formato === 'LIGA');
    if (filtro === 'copa') return list.filter((t) => (t as any).formato === 'COPA');
    return list;
  };

  const filteredPublished = useMemo(() => {
    if (filtro === 'borrador') return [];
    return applySearch(applyFormatFilter(allPublished));
  }, [search, filtro, myTournaments, publicTournaments]);

  const filteredDrafts = useMemo(() => {
    if (filtro === 'publicado' || filtro === 'liga' || filtro === 'copa') return [];
    return applySearch(myDrafts);
  }, [search, filtro, myTournaments]);

  const showPublished = filtro !== 'borrador';
  const showDrafts = filtro === 'todos' || filtro === 'borrador';

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
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
      {/* Buscador */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
          <Feather name="search" size={16} color="#3D4F44" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-night text-sm"
            placeholder="Buscar torneos..."
            placeholderTextColor="#3D4F44"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#3D4F44" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 8,
        }}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFiltro(f.key)}
            className={`px-4 py-2 rounded-full border ${filtro === f.key ? 'bg-primary border-primary' : 'bg-white border-mist'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-sans-medium ${filtro === f.key ? 'text-white' : 'text-carbon'}`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón crear */}
      <View className="px-4 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/(app)/create-tournament')}
          className="bg-primary rounded-2xl px-4 py-3 flex-row items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-medium text-sm">＋ Crear torneo</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? (
        <View className="bg-white rounded-2xl mx-4 px-4 py-6 items-center mb-3">
          <Text className="text-danger text-sm text-center mb-2">{error}</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Sección publicados */}
      {showPublished && (
        <View className="px-4">
          <SectionHeader title="Torneos publicados" count={filteredPublished.length} />
          {filteredPublished.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
              <Text className="text-carbon text-sm text-center">
                {search
                  ? 'No hay torneos que coincidan con la búsqueda.'
                  : 'No hay torneos publicados aún.'}
              </Text>
            </View>
          ) : (
            filteredPublished.map((item) => (
              <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
            ))
          )}
        </View>
      )}

      {/* Sección borradores */}
      {showDrafts && (
        <View className="px-4 mt-2">
          <SectionHeader title="Mis borradores" count={filteredDrafts.length} />
          {filteredDrafts.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center">
              <Text className="text-carbon text-sm text-center">
                {search ? 'No hay borradores que coincidan.' : 'No tienes borradores guardados.'}
              </Text>
            </View>
          ) : (
            filteredDrafts.map((item) => (
              <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Home ─────────────────────────────────────────────────────
const SECTION_TITLES: Record<DrawerSection, string> = {
  explorar: 'Explorar torneos',
  dashboard: 'Dashboard',
};

export default function HomeScreen() {
  const router = useRouter();
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DrawerSection>('explorar');
  const menuScale = useRef(new Animated.Value(1)).current;

  const handleMenuPressIn = () => {
    Animated.spring(menuScale, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handleMenuPressOut = () => {
    Animated.spring(menuScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [mine, publics] = await Promise.all([getMyTournaments(), getPublicTournaments()]);
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

  const goToTournament = (id: string) => router.push(`/(app)/tournament/${id}` as never);

  return (
    <View className="flex-1 bg-mist">
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          onPressIn={handleMenuPressIn}
          onPressOut={handleMenuPressOut}
          className="mr-4"
          activeOpacity={1}
        >
          <Animated.View
            style={{ transform: [{ scale: menuScale }] }}
            className="w-9 h-9 rounded-xl bg-primary-dark items-center justify-center"
          >
            <View className="gap-1">
              <View className="w-5 h-0.5 bg-white rounded-full" />
              <View className="w-5 h-0.5 bg-white rounded-full" />
              <View className="w-3 h-0.5 bg-white rounded-full" />
            </View>
          </Animated.View>
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">
          {SECTION_TITLES[activeSection]}
        </Text>
      </View>

      {activeSection === 'explorar' && (
        <ExplorarSection
          myTournaments={myTournaments}
          publicTournaments={publicTournaments}
          loading={loading}
          error={error}
          onRetry={fetchData}
          onPress={goToTournament}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
      {activeSection === 'dashboard' && <DashboardSection onPressTorneo={goToTournament} />}

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />
    </View>
  );
}
