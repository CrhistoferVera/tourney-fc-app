import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState, useCallback } from "react";
import {
  getMyTournaments,
  getPublicTournaments,
  Tournament,
} from "../../services/tournamentService";
import TournamentCard from "../../components/tournament/TournamentCard";
import SectionHeader from "../../components/tournament/SectionHeader";
import DrawerMenu, { DrawerSection } from "../../components/DrawerMenu";
import { useDashboard } from "../../hooks/useDashboard";
import ProximoPartidoCard from "../../components/dashboard/ProximoPartidoCard";
import TorneoResumenCard from "../../components/dashboard/TorneoResumenCard";
import ResultadoCard from "../../components/dashboard/ResultadoCard";

function DashboardSection({
  onPressTorneo,
}: {
  onPressTorneo: (id: string) => void;
}) {
  const { data, loading, error, fetchDashboard } = useDashboard();
  const { usuario } = useAuthStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-danger text-sm text-center mb-3">{error}</Text>
        <TouchableOpacity onPress={fetchDashboard}>
          <Text className="text-primary font-sans-medium text-sm">
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Saludo */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-night text-2xl font-sans-medium">
          Hola, {usuario?.nombre?.split(" ")[0]}
        </Text>
        <Text className="text-carbon text-sm capitalize">{hoy}</Text>
      </View>

      {/* Próximo partido */}
      {data?.proximoPartido ? (
        <ProximoPartidoCard partido={data.proximoPartido} />
      ) : (
        <View className="mx-4 mb-4 bg-mist rounded-2xl p-4 items-center">
          <Text className="text-carbon text-sm">
            No tienes partidos próximos
          </Text>
        </View>
      )}

      {/* Mis torneos */}
      {data?.torneos && data.torneos.length > 0 ? (
        <View className="mb-4">
          <Text className="text-night font-sans-medium text-base px-4 mb-3">
            Mis torneos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          >
            {data.torneos.map((t) => (
              <TorneoResumenCard
                key={t.id}
                torneo={t}
                onPress={onPressTorneo}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Últimos resultados */}
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

function InicioSection({ nombre }: { nombre?: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-4xl mb-4">🏆</Text>
      <Text className="text-night font-sans-medium text-xl text-center mb-2">
        Bienvenido{nombre ? `, ${nombre}` : ""}
      </Text>
      <Text className="text-carbon text-sm text-center leading-5">
        Usa el menú para navegar entre tus torneos y borradores.
      </Text>
    </View>
  );
}

function TorneosSection({
  tournaments,
  loading,
  error,
  onRetry,
  onPress,
  onRefresh,
  refreshing,
}: {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPress: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const router = useRouter();
  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0D7A3E"
          colors={["#0D7A3E"]}
        />
      }
    >
      <TouchableOpacity
        onPress={() => router.push("/(app)/create-tournament")}
        className="bg-primary rounded-2xl px-4 py-3 flex-row items-center justify-center mb-5"
        activeOpacity={0.85}
      >
        <Text className="text-white font-sans-medium text-sm">
          ＋ Crear torneo
        </Text>
      </TouchableOpacity>

      {error ? (
        <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
          <Text className="text-danger text-sm text-center mb-2">{error}</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text className="text-primary font-sans-medium text-sm">
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <SectionHeader title="Torneos disponibles" count={tournaments.length} />
      {tournaments.length === 0 ? (
        <View className="bg-white rounded-2xl px-4 py-6 items-center">
          <Text className="text-carbon text-sm text-center">
            No hay torneos publicados aún.
          </Text>
        </View>
      ) : (
        tournaments.map((item) => (
          <TournamentCard
            key={item.id}
            item={item}
            onPress={() => onPress(item.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function BorradoresSection({
  drafts,
  loading,
  onPress,
  onRefresh,
  refreshing,
}: {
  drafts: Tournament[];
  loading: boolean;
  onPress: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0D7A3E"
          colors={["#0D7A3E"]}
        />
      }
    >
      <SectionHeader title="Mis borradores" count={drafts.length} />
      {drafts.length === 0 ? (
        <View className="bg-white rounded-2xl px-4 py-6 items-center">
          <Text className="text-carbon text-sm text-center">
            No tienes borradores guardados.
          </Text>
        </View>
      ) : (
        drafts.map((item) => (
          <TournamentCard
            key={item.id}
            item={item}
            onPress={() => onPress(item.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const SECTION_TITLES: Record<DrawerSection, string> = {
  inicio: "Inicio",
  dashboard: "Dashboard",
  torneos: "Torneos",
  borradores: "Borradores",
};

export default function HomeScreen() {
  const router = useRouter();
  const { usuario } = useAuthStore();

  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DrawerSection>("inicio");

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
      setError("No se pudieron cargar los torneos.");
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

  const myDrafts = myTournaments.filter((t) => t.estado === "BORRADOR");
  const myActive = myTournaments.filter((t) => t.estado !== "BORRADOR");
  const myIds = new Set(myTournaments.map((t) => t.id));
  const otherPublic = publicTournaments.filter((t) => !myIds.has(t.id));
  const allVisible = [...myActive, ...otherPublic];

  const goToTournament = (id: string) =>
    router.push(`/(app)/tournament/${id}` as never);

  return (
    <View className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => setDrawerOpen(true)} className="mr-4">
          <View className="gap-1">
            <View className="w-6 h-0.5 bg-white rounded-full" />
            <View className="w-6 h-0.5 bg-white rounded-full" />
            <View className="w-6 h-0.5 bg-white rounded-full" />
          </View>
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">
          {SECTION_TITLES[activeSection]}
        </Text>
      </View>

      {activeSection === "inicio" && <InicioSection nombre={usuario?.nombre} />}
      {activeSection === "dashboard" && (
        <DashboardSection onPressTorneo={goToTournament} />
      )}
      {activeSection === "torneos" && (
        <TorneosSection
          tournaments={allVisible}
          loading={loading}
          error={error}
          onRetry={fetchData}
          onPress={goToTournament}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
      {activeSection === "borradores" && (
        <BorradoresSection
          drafts={myDrafts}
          loading={loading}
          onPress={goToTournament}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />
    </View>
  );
}
