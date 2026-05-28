import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getMyTeam, MyTeam } from '../../../services/teamsService';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import JugadoresStatsTable from '../../../components/tournament/JugadoresStatsTable';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function MiEquipoScreen() {
  const { id: torneoId, rol } = useLocalSearchParams<{ id: string; rol: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const [equipo, setEquipo] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const esCapitan = rol === 'CAPITAN';

  const jugadoresTabla = useMemo(
    () =>
      (equipo?.jugadores ?? []).map((row) => ({
        id: row.usuario.id,
        nombre: row.usuario.nombre,
        fotoPerfil: row.usuario.fotoPerfil,
        email: row.usuario.email,
        estadisticas: row.usuario.estadisticas,
      })),
    [equipo?.jugadores],
  );

  const fetchEquipo = useCallback(async () => {
    if (!torneoId) return;
    try {
      const data = await getMyTeam(torneoId);
      setEquipo(data);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el equipo');
    }
  }, [torneoId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEquipo().finally(() => setLoading(false));
    }, [fetchEquipo]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEquipo();
    setRefreshing(false);
  }, [fetchEquipo]);

  const goToGlobalTeam = () => {
    if (!equipo) return;
    router.push(`/team/${equipo.id}` as never);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      </View>
    );
  }

  if (!equipo) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="shield-off" size={40} color="#3D4F44" />
          <Text className="text-carbon text-base text-center mt-4">
            No tienes un equipo en este torneo.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D7A3E"
            colors={['#0D7A3E']}
          />
        }
      >
        {/* Team card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 mb-4 flex-row items-center"
          style={{ gap: 16, elevation: 2, shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8 }}
        >
          <ShieldDisplay escudo={equipo.escudo} size={64} />
          <View className="flex-1">
            <Text className="text-night font-sans-medium text-lg" numberOfLines={1}>
              {equipo.nombre}
            </Text>
            {!!equipo.telefonoCapitan && (
              <Text className="text-carbon text-xs mt-0.5">📞 {equipo.telefonoCapitan}</Text>
            )}
            <View className="flex-row items-center gap-1 mt-1.5">
              <Feather name={esCapitan ? 'star' : 'user'} size={11} color="#0D7A3E" />
              <Text className="text-primary text-xs font-sans-medium">
                {esCapitan ? 'Eres el capitán' : 'Eres jugador'}
              </Text>
            </View>
          </View>
        </View>

        {/* Banner: gestionar globalmente */}
        <TouchableOpacity
          onPress={goToGlobalTeam}
          activeOpacity={0.85}
          className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-5 flex-row items-center"
        >
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center mr-3">
            <Feather name="shield" size={16} color="#0D7A3E" />
          </View>
          <View className="flex-1">
            <Text className="text-primary font-sans-medium text-sm">
              Gestionar equipo
            </Text>
            <Text className="text-carbon text-xs mt-0.5">
              Invita jugadores y administra tu equipo desde Mis equipos.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#0D7A3E" />
        </TouchableOpacity>

        {/* Estadísticas del torneo */}
        <View className="flex-row items-center mb-3">
          <Text className="text-night font-sans-medium text-base flex-1">
            Roster del torneo
          </Text>
          <View className="bg-primary-light px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs font-sans-medium">{jugadoresTabla.length}</Text>
          </View>
        </View>

        {jugadoresTabla.length === 0 ? (
          <View
            className="bg-white rounded-2xl px-4 py-8 items-center mb-5"
            style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
          >
            <Text className="text-carbon text-sm">Sin jugadores en el roster.</Text>
          </View>
        ) : (
          <View className="mb-5">
            <JugadoresStatsTable jugadores={jugadoresTabla} capitanId={equipo.capitanId} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
