import { useState, useCallback } from 'react';
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
import {
  getStandings,
  getFixture,
  FilaTablaPosiciones,
  TablaPosicionesResponse,
  RondaFixture,
} from '../../../services/fixtureService';
import { getMyTeam } from '../../../services/teamsService';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import BracketView from '../../../components/tournament/BracketView';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

const HEADER_H = 40;
const ROW_H = 48;
const COL_POS = 22;
const COL_SHIELD = 28;
const TEAM_BLOCK_W = COL_POS + COL_SHIELD + 88;
const COL_STAT = 26;
const COL_DG = 30;
const COL_PTS = 32;
const STATS_BLOCK_W = COL_STAT * 7 + COL_DG + COL_PTS;
const HIGHLIGHT_BG = '#D1FAE5';

const rowBorder = (isLast: boolean) =>
  isLast ? {} : { borderBottomWidth: 1, borderBottomColor: '#E8EDEA' };

const CRITERIOS_DESEMPATE_DEFAULT = [
  'Puntos (mayor a menor)',
  'Diferencia de goles (DG)',
  'Goles a favor (GF)',
  'Goles en contra (GC, menor es mejor)',
  'Nombre del equipo (A–Z)',
];

function StatCell({ value, highlight }: { readonly value: number | string; readonly highlight?: boolean }) {
  return (
    <View style={{ width: COL_STAT, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        className={`text-xs font-sans-medium ${highlight ? 'text-primary' : 'text-night'}`}
      >
        {value}
      </Text>
    </View>
  );
}

function StatsHeader() {
  return (
    <View
      className="flex-row items-center bg-mist"
      style={{
        width: STATS_BLOCK_W,
        height: HEADER_H,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E8EDEA',
      }}
    >
      <StatCell value="PJ" />
      <StatCell value="G" />
      <StatCell value="E" />
      <StatCell value="P" />
      <StatCell value="GF" />
      <StatCell value="GC" />
      <View style={{ width: COL_DG, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-carbon text-xs font-sans-medium">DG</Text>
      </View>
      <View style={{ width: COL_PTS, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-carbon text-xs font-sans-medium">Pts</Text>
      </View>
    </View>
  );
}

function StatsRow({
  fila,
  isLast,
  isMine,
  onPress,
}: {
  readonly fila: FilaTablaPosiciones;
  readonly isLast: boolean;
  readonly isMine: boolean;
  readonly onPress: () => void;
}) {
  const dgLabel = fila.dg > 0 ? `+${fila.dg}` : String(fila.dg);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        width: STATS_BLOCK_W,
        height: ROW_H,
        paddingHorizontal: 4,
        backgroundColor: isMine ? HIGHLIGHT_BG : '#FFFFFF',
        ...rowBorder(isLast),
      }}
    >
      <View className="flex-row items-center flex-1">
        <StatCell value={fila.pj} />
        <StatCell value={fila.g} />
        <StatCell value={fila.e} />
        <StatCell value={fila.p} />
        <StatCell value={fila.gf} />
        <StatCell value={fila.gc} />
        <View style={{ width: COL_DG, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-night text-xs font-sans-medium">{dgLabel}</Text>
        </View>
        <View style={{ width: COL_PTS, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-primary text-xs font-sans-medium">{fila.pts}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TeamHeader() {
  return (
    <View
      className="flex-row items-center bg-mist px-2"
      style={{
        width: TEAM_BLOCK_W,
        height: HEADER_H,
        borderBottomWidth: 1,
        borderBottomColor: '#E8EDEA',
      }}
    >
      <View style={{ width: COL_POS, alignItems: 'center' }}>
        <Text className="text-carbon text-xs font-sans-medium">#</Text>
      </View>
      <Text className="text-carbon text-xs font-sans-medium flex-1 ml-1">Equipo</Text>
    </View>
  );
}

function TeamRow({
  fila,
  isLast,
  isMine,
  onPress,
}: {
  readonly fila: FilaTablaPosiciones;
  readonly isLast: boolean;
  readonly isMine: boolean;
  readonly onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center px-2"
      style={{
        width: TEAM_BLOCK_W,
        height: ROW_H,
        backgroundColor: isMine ? HIGHLIGHT_BG : '#FFFFFF',
        ...rowBorder(isLast),
      }}
    >
      <View style={{ width: COL_POS, alignItems: 'center' }}>
        <Text className="text-carbon text-xs font-sans-medium">{fila.posicion}</Text>
      </View>
      <ShieldDisplay escudo={fila.equipo.escudo} size={COL_SHIELD} />
      <Text
        className={`font-sans-medium text-xs flex-1 ml-1.5 ${isMine ? 'text-primary' : 'text-night'}`}
        numberOfLines={1}
      >
        {fila.equipo.nombre}
      </Text>
      {isMine && <Feather name="chevron-right" size={14} color="#0D7A3E" />}
    </TouchableOpacity>
  );
}

function TablaPosiciones({
  filas,
  miEquipoId,
  onPressTeam,
}: {
  readonly filas: FilaTablaPosiciones[];
  readonly miEquipoId: string | null;
  readonly onPressTeam: (equipoId: string) => void;
}) {
  const totalBodyH = HEADER_H + filas.length * ROW_H;

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden flex-row items-start"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View style={{ width: TEAM_BLOCK_W, height: totalBodyH }}>
        <TeamHeader />
        {filas.map((fila, index) => {
          const isLast = index === filas.length - 1;
          const isMine = miEquipoId === fila.equipo.id;
          const onPress = () => onPressTeam(fila.equipo.id);
          return (
            <TeamRow
              key={fila.equipo.id}
              fila={fila}
              isLast={isLast}
              isMine={isMine}
              onPress={onPress}
            />
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        bounces
        nestedScrollEnabled
        style={{ flex: 1, height: totalBodyH }}
        contentContainerStyle={{ height: totalBodyH }}
      >
        <View style={{ width: STATS_BLOCK_W, height: totalBodyH }}>
          <StatsHeader />
          {filas.map((fila, index) => {
            const isLast = index === filas.length - 1;
            const isMine = miEquipoId === fila.equipo.id;
            const onPress = () => onPressTeam(fila.equipo.id);
            return (
              <StatsRow
                key={fila.equipo.id}
                fila={fila}
                isLast={isLast}
                isMine={isMine}
                onPress={onPress}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function TablaScreen() {
  const {
    id: torneoId,
    nombre: torneoNombre,
    rol,
    formato,
    maxEquipos: maxEquiposParam,
    estado,
  } = useLocalSearchParams<{
    id: string;
    nombre?: string;
    rol?: string;
    formato?: string;
    maxEquipos?: string;
    estado?: string;
  }>();
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const isBracket = formato === 'COPA' || formato === 'ELIMINATORIA';
  const maxEquipos = maxEquiposParam ? Number.parseInt(maxEquiposParam, 10) : 8;

  const [data, setData] = useState<TablaPosicionesResponse | null>(null);
  const [rondas, setRondas] = useState<RondaFixture[]>([]);
  const [miEquipoId, setMiEquipoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const esCapitanOJugador = rol === 'CAPITAN' || rol === 'JUGADOR';

  const fetchMiEquipo = useCallback(async () => {
    if (!torneoId || !esCapitanOJugador) {
      setMiEquipoId(null);
      return;
    }
    try {
      const equipo = await getMyTeam(torneoId);
      setMiEquipoId(equipo.id);
    } catch {
      setMiEquipoId(null);
    }
  }, [torneoId, esCapitanOJugador]);

  const fetchTablaLiga = useCallback(async () => {
    if (!torneoId) return;
    try {
      const result = await getStandings(torneoId);
      setData(result);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar la tabla');
      setData(null);
    }
  }, [torneoId]);

  const fetchBracket = useCallback(async () => {
    if (!torneoId) return;
    try {
      const fixture = await getFixture(torneoId);
      setRondas(Array.isArray(fixture) ? fixture : []);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el bracket');
      setRondas([]);
    }
  }, [torneoId]);

  const loadAll = useCallback(async () => {
    await fetchMiEquipo();
    if (isBracket) {
      await fetchBracket();
    } else {
      await fetchTablaLiga();
    }
  }, [fetchMiEquipo, fetchBracket, fetchTablaLiga, isBracket]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAll().finally(() => setLoading(false));
      
      const interval = setInterval(loadAll, 10000);
      return () => clearInterval(interval);
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handlePressTeam = (teamId: string) => {
    router.push({
      pathname: '/(app)/tournament/team-detail',
      params: { teamId },
    } as never);
  };

  const titulo = data?.torneoNombre ?? torneoNombre ?? 'Tabla de posiciones';
  const filas = data?.tabla ?? [];
  const criterios = data?.criteriosDesempate ?? CRITERIOS_DESEMPATE_DEFAULT;

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
          {isBracket ? 'Bracket' : 'Tabla'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D7A3E"
              colors={['#0D7A3E']}
            />
          }
        >
          <Text className="text-night font-sans-medium text-base mb-1" numberOfLines={2}>
            {titulo}
          </Text>
          <Text className="text-carbon text-xs mb-2">
            {isBracket
              ? 'Desliza el bracket · Los goles aparecen al cargar el resultado · Toca un equipo'
              : 'Partidos confirmados · Toca un equipo para ver detalle'}
          </Text>

          {miEquipoId && (
            <View className="flex-row items-center gap-2 mb-3 bg-primary-light rounded-xl px-3 py-2">
              <View
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: HIGHLIGHT_BG, borderWidth: 1, borderColor: '#0D7A3E' }}
              />
              <Text className="text-primary text-xs flex-1">Resaltado: tu equipo en este torneo</Text>
            </View>
          )}

          {isBracket ? (
            rondas.length === 0 ? (
              <View
                className="bg-white rounded-2xl px-4 py-8 items-center"
                style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
              >
                <Feather name="git-branch" size={32} color="#3D4F44" />
                <Text className="text-carbon text-sm text-center mt-3">
                  Aún no hay fixture generado para este torneo.
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl overflow-hidden py-3">
                <BracketView
                  rondas={rondas}
                  maxEquipos={maxEquipos}
                  estadoTorneo={estado}
                  showScheduleControls={false}
                  miEquipoId={miEquipoId}
                  onPressTeam={handlePressTeam}
                />
              </View>
            )
          ) : filas.length === 0 ? (
            <View
              className="bg-white rounded-2xl px-4 py-8 items-center"
              style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
            >
              <Feather name="bar-chart-2" size={32} color="#3D4F44" />
              <Text className="text-carbon text-sm text-center mt-3">
                No hay equipos o partidos confirmados aún.
              </Text>
            </View>
          ) : (
            <TablaPosiciones
              filas={filas}
              miEquipoId={miEquipoId}
              onPressTeam={handlePressTeam}
            />
          )}

          {!isBracket && (
            <View className="mt-4 bg-white rounded-2xl px-4 py-3">
              <Text className="text-night font-sans-medium text-sm mb-2">Criterios de desempate</Text>
              <Text className="text-carbon text-xs mb-2 leading-5">
                Si dos o más equipos tienen los mismos puntos, el orden se define así (en orden):
              </Text>
              {criterios.map((c, i) => (
                <Text key={c} className="text-carbon text-xs leading-5">
                  {i + 1}. {c}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
