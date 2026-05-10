import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDashboard } from '../../hooks/useDashboard';
import ProximoPartidoCard from '../dashboard/ProximoPartidoCard';
import TorneoResumenCard from '../dashboard/TorneoResumenCard';
import ResultadoCard from '../dashboard/ResultadoCard';

export default function DashboardSection({ onPressTorneo }: { onPressTorneo: (id: string) => void }) {
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

      {data?.torneos && data.torneos.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-night font-sans-medium text-base px-4 mb-3">Mis torneos</Text>
            <Link href="/(app)/mis-torneos">
              <Text className="text-primary font-sans-medium text-sm">Ver todos</Text>
            </Link>
          </View>
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
      )}

      {data?.ultimosResultados && data.ultimosResultados.length > 0 && (
        <View className="mb-4">
          <Text className="text-night font-sans-medium text-base px-4 mb-3">
            Últimos resultados
          </Text>
          {data.ultimosResultados.map((r) => (
            <ResultadoCard key={r.id} resultado={r} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
