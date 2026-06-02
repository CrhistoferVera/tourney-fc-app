import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import MyTeamCard from '../../../components/team/MyTeamCard';
import { useAlert } from '../../../hooks/useAlert';
import { getMyTeams, MyTeamSummary } from '../../../services/teamsService';

export default function MisEquiposScreen() {
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const [equipos, setEquipos] = useState<MyTeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { comoCapitan, comoJugador } = useMemo(() => {
    const cap = equipos.filter((e) => e.esCapitan);
    const jug = equipos.filter((e) => !e.esCapitan);
    return { comoCapitan: cap, comoJugador: jug };
  }, [equipos]);

  const fetchEquipos = useCallback(async () => {
    try {
      const data = await getMyTeams();
      setEquipos(data);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudieron cargar tus equipos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEquipos().finally(() => setLoading(false));
    }, [fetchEquipos]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEquipos();
    setRefreshing(false);
  }, [fetchEquipos]);

  const goToCreate = () => router.push('/team/create' as never);
  const goToTeam = (id: string) => router.push(`/team/${id}` as never);

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-night font-sans-medium text-2xl">Mis equipos</Text>
        {!loading && equipos.length > 0 && (
          <TouchableOpacity
            onPress={goToCreate}
            activeOpacity={0.85}
            className="bg-primary rounded-xl px-3 py-2 flex-row items-center gap-1"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-sans-medium text-sm">Crear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
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
          {equipos.length === 0 && (
            <View
              className="bg-white rounded-2xl px-6 py-10 items-center"
              style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
            >
              <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center mb-3">
                <Feather name="shield" size={28} color="#0D7A3E" />
              </View>
              <Text className="text-night font-sans-medium text-base text-center mb-1">
                Aún no tienes equipos
              </Text>
              <Text className="text-carbon text-sm text-center mb-5">
                Crea tu equipo para empezar a invitar jugadores e inscribirte a torneos.
              </Text>
              <TouchableOpacity
                onPress={goToCreate}
                activeOpacity={0.85}
                className="bg-primary rounded-xl px-5 py-3 flex-row items-center gap-2"
              >
                <Feather name="plus" size={16} color="white" />
                <Text className="text-white font-sans-medium text-sm">
                  Crear mi primer equipo
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {comoCapitan.length > 0 && (
            <>
              <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
                Como capitán ({comoCapitan.length})
              </Text>
              {comoCapitan.map((t) => (
                <MyTeamCard key={t.id} team={t} onPress={goToTeam} />
              ))}
            </>
          )}

          {comoJugador.length > 0 && (
            <>
              <Text className="text-carbon text-xs font-sans-medium mb-2 mt-4 uppercase tracking-wide">
                Como jugador ({comoJugador.length})
              </Text>
              {comoJugador.map((t) => (
                <MyTeamCard key={t.id} team={t} onPress={goToTeam} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
