import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getTeamById, TeamDetail, Jugador } from '../../../services/teamsService';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

function JugadorRow({
  jugador,
  isCapitan,
  isLast,
}: {
  readonly jugador: Jugador;
  readonly isCapitan: boolean;
  readonly isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${isLast ? '' : 'border-b border-mist'}`}
    >
      {jugador.fotoPerfil ? (
        <Image
          source={{ uri: jugador.fotoPerfil }}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
        />
      ) : (
        <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center mr-3">
          <Feather name="user" size={16} color="#0D7A3E" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>
          {jugador.nombre}
        </Text>
        {!!jugador.email && (
          <Text className="text-carbon text-xs mt-0.5" numberOfLines={1}>
            {jugador.email}
          </Text>
        )}
      </View>
      {isCapitan && (
        <View className="flex-row items-center gap-1 bg-primary-light px-2 py-0.5 rounded-full">
          <Feather name="star" size={10} color="#0D7A3E" />
          <Text className="text-primary text-xs font-sans-medium">Capitán</Text>
        </View>
      )}
    </View>
  );
}

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const [equipo, setEquipo] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipo = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = await getTeamById(teamId);
      setEquipo(data);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el equipo');
      setEquipo(null);
    }
  }, [teamId]);

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

  const jugadores = equipo?.jugadores ?? [];
  const count = equipo?.cantidadJugadores ?? jugadores.length;
  const countSuffix = count === 1 ? '' : 'es';

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
          {equipo?.nombre ?? 'Detalle del equipo'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : !equipo ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="shield-off" size={40} color="#3D4F44" />
          <Text className="text-carbon text-base text-center mt-4">
            No se encontró la información del equipo.
          </Text>
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
          <View
            className="bg-white rounded-2xl px-4 py-4 mb-4"
            style={{ elevation: 2, shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8 }}
          >
            <View className="flex-row items-center" style={{ gap: 16 }}>
              <ShieldDisplay escudo={equipo.escudo} size={64} />
              <View className="flex-1">
                <Text className="text-night font-sans-medium text-lg" numberOfLines={2}>
                  {equipo.nombre}
                </Text>
                {!!equipo.telefonoCapitan && (
                  <Text className="text-carbon text-xs mt-1">📞 {equipo.telefonoCapitan}</Text>
                )}
                <Text className="text-carbon text-xs mt-1">
                  {count} jugador{countSuffix}
                </Text>
                {!!equipo.torneo?.nombre && (
                  <Text className="text-primary text-xs mt-1.5 font-sans-medium">
                    {equipo.torneo.nombre}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Text className="text-night font-sans-medium text-base flex-1">Jugadores</Text>
            <View className="bg-primary-light px-2 py-0.5 rounded-full">
              <Text className="text-primary text-xs font-sans-medium">{jugadores.length}</Text>
            </View>
          </View>

          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
          >
            {jugadores.length === 0 ? (
              <View className="px-4 py-8 items-center">
                <Text className="text-carbon text-sm">Sin jugadores registrados aún.</Text>
              </View>
            ) : (
              jugadores.map((jugador, index) => (
                <JugadorRow
                  key={jugador.id}
                  jugador={jugador}
                  isCapitan={jugador.id === equipo.capitanId}
                  isLast={index === jugadores.length - 1}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
