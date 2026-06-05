import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useCallback, useState, type ReactNode } from 'react';
import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useDashboard } from '../../hooks/useDashboard';
import ProximoPartidoCard from '../dashboard/ProximoPartidoCard';
import TorneoResumenCard from '../dashboard/TorneoResumenCard';
import { TorneoResumen } from '../../hooks/useDashboard';
import ResultadoCard from '../dashboard/ResultadoCard';

function SectionTitle({
  icon,
  title,
  action,
}: {
  readonly icon: ComponentProps<typeof Feather>['name'];
  readonly title: string;
  readonly action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3 px-4">
      <View className="flex-row items-center gap-2">
        <View className="w-7 h-7 rounded-lg bg-primary-light items-center justify-center">
          <Feather name={icon} size={14} color="#0D7A3E" />
        </View>
        <Text className="text-night font-sans-medium text-base">{title}</Text>
      </View>
      {action}
    </View>
  );
}

function StatChip({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <View className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5 border border-white/10">
      <Text className="text-primary-light text-xs">{label}</Text>
      <Text className="text-white font-sans-medium text-xl mt-0.5">{value}</Text>
    </View>
  );
}

function EmptyCard({
  icon,
  message,
  hint,
}: {
  readonly icon: ComponentProps<typeof Feather>['name'];
  readonly message: string;
  readonly hint?: string;
}) {
  return (
    <View
      className="mx-4 mb-5 rounded-2xl bg-white px-5 py-8 items-center"
      style={{
        elevation: 1,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.04,
        shadowRadius: 6,
      }}
    >
      <View className="w-14 h-14 rounded-2xl bg-mist items-center justify-center mb-3">
        <Feather name={icon} size={26} color="#3D4F44" />
      </View>
      <Text className="text-night font-sans-medium text-sm text-center">{message}</Text>
      {!!hint && <Text className="text-carbon text-xs text-center mt-1">{hint}</Text>}
    </View>
  );
}

export default function DashboardSection({
  onPressTorneo,
}: {
  onPressTorneo: (torneo: TorneoResumen) => void;
}) {
  const { data, loading, error, fetchDashboard } = useDashboard();
  const { usuario } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const primerNombre = usuario?.nombre?.split(' ')[0] ?? 'Jugador';
  const torneosCount = data?.torneos?.length ?? 0;

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-mist">
        <ActivityIndicator color="#0D7A3E" size="large" />
        <Text className="text-carbon text-sm mt-3">Cargando tu inicio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8 bg-mist">
        <View className="w-16 h-16 rounded-2xl bg-accent-soft items-center justify-center mb-4">
          <Feather name="alert-circle" size={28} color="#F5820D" />
        </View>
        <Text className="text-danger text-sm text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={fetchDashboard}
          className="bg-primary px-6 py-3 rounded-xl"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-medium text-sm">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-mist"
      contentContainerStyle={{ paddingBottom: 40 }}
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
      {/* Hero */}
      <View className="bg-primary pt-2 pb-8 px-4">
        <View
          className="rounded-3xl overflow-hidden bg-primary-dark p-5"
          style={{ position: 'relative' }}
        >
          <View
            style={{
              position: 'absolute',
              right: -24,
              top: -24,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 40,
              bottom: -16,
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(245,130,13,0.15)',
            }}
          />

          <Text className="text-primary-light text-xs font-sans-medium tracking-wide uppercase mb-1">
            Bienvenido
          </Text>
          <Text className="text-white text-2xl font-sans-medium">Hola, {primerNombre}</Text>
          <Text className="text-white/75 text-sm capitalize mt-1">{hoy}</Text>

          <View className="flex-row gap-2 mt-4">
            <StatChip label="Torneos" value={torneosCount} />
            <StatChip
              label="Próximo"
              value={data?.proximoPartido ? 1 : 0}
            />
          </View>
        </View>
      </View>

      {/* Contenido con overlap */}
      <View style={{ marginTop: -20 }}>
        {data?.proximoPartido ? (
          <ProximoPartidoCard partido={data.proximoPartido} />
        ) : (
          <EmptyCard
            icon="calendar"
            message="No tienes partidos próximos"
            hint="Explora torneos o revisa tu fixture"
          />
        )}

        {data?.torneos && data.torneos.length > 0 ? (
          <View className="mb-2">
            <SectionTitle
              icon="award"
              title="Mis torneos"
              action={
                <Link href="/mis-torneos">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-primary font-sans-medium text-sm">Ver todos</Text>
                    <Feather name="chevron-right" size={16} color="#0D7A3E" />
                  </View>
                </Link>
              }
            />
            <View className="px-4">
              {data.torneos.map((t) => (
                <TorneoResumenCard key={t.id} torneo={t} onPress={onPressTorneo} />
              ))}
            </View>
          </View>
        ) : (
          <View className="mb-2">
            <SectionTitle icon="award" title="Mis torneos" />
            <EmptyCard
              icon="users"
              message="Aún no participas en torneos"
              hint="Ve a Explorar para inscribirte"
            />
          </View>
        )}

        {data?.ultimosResultados && data.ultimosResultados.length > 0 ? (
          <View>
            <SectionTitle icon="bar-chart-2" title="Últimos resultados" />
            {data.ultimosResultados.map((r) => (
              <ResultadoCard 
                key={r.id} 
                resultado={r} 
                onPress={() => router.push({ pathname: '/(app)/tournament/match/[id]', params: { id: r.id } } as any)} 
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
