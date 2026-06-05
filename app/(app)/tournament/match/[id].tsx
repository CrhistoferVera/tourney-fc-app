import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getMatchById,
  controlLiveMatch,
  updateMatch,
  addMatchEvent,
  deleteMatchEvent,
  Partido,
  EventoPartido,
  MatchControlAction,
  TipoEvento,
} from '../../../../services/fixtureService';
import { getTournamentById, Tournament } from '../../../../services/tournamentService';
import { getTeamById, Jugador } from '../../../../services/teamsService';
import { useAlert } from '../../../../hooks/useAlert';
import CustomAlert from '../../../../components/CustomAlert';
import { formatPartidoFecha } from '../../../../utils/matchDate';
import PenaltyShootoutTracker from '../../../../components/tournament/PenaltyShootoutTracker';
import ShieldDisplay from '../../../../components/tournament/ShieldDisplay';

// Un tiro de tanda de penales se identifica de forma fiable por detalle === 'PENAL'
// (el backend lo marca así de forma autoritativa). Esto evita confundirlo con un penal
// fallado del tiempo regular.
const isShootoutEvent = (ev: EventoPartido) => ev.detalle === 'PENAL';

function MatchEventIcon({ tipo, size, color }: { tipo: TipoEvento; size: number; color: string }) {
  if (tipo === 'GOL' || tipo === 'PENAL_FALLADO') {
    return <MaterialCommunityIcons name="soccer" size={size} color={color} />;
  }
  if (tipo === 'ASISTENCIA') {
    return <MaterialCommunityIcons name="shoe-cleat" size={size} color={color} />;
  }
  if (tipo === 'TARJETA_AMARILLA' || tipo === 'TARJETA_ROJA') {
    return <MaterialCommunityIcons name="cards" size={size} color={color} />;
  }
  if (tipo === 'FALTA') {
    return <Feather name="alert-triangle" size={size} color={color} />;
  }
  if (tipo === 'CORNER') {
    return <Feather name="flag" size={size} color={color} />;
  }
  return <Feather name="info" size={size} color={color} />;
}

interface EventConfig {
  tipo: TipoEvento;
  label: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  needsPlayer: boolean;
}

const EVENT_CONFIGS: EventConfig[] = [
  { tipo: 'GOL',              label: 'Gol',      icon: 'soccer',         iconColor: '#15803D', iconBg: '#DCFCE7', bgColor: '#DCFCE7', textColor: '#15803D', borderColor: '#86EFAC', needsPlayer: true },
  { tipo: 'TARJETA_AMARILLA', label: 'Amarilla',  icon: 'cards',          iconColor: '#A16207', iconBg: '#FEF9C3', bgColor: '#FEF9C3', textColor: '#A16207', borderColor: '#FDE047', needsPlayer: true },
  { tipo: 'TARJETA_ROJA',    label: 'Roja',      icon: 'cards',          iconColor: '#B91C1C', iconBg: '#FEE2E2', bgColor: '#FEE2E2', textColor: '#B91C1C', borderColor: '#FCA5A5', needsPlayer: true },
  { tipo: 'PENAL_FALLADO',    label: 'Penal Fallado', icon: 'soccer',   iconColor: '#EF4444', iconBg: '#FEE2E2', bgColor: '#FEE2E2', textColor: '#EF4444', borderColor: '#FCA5A5', needsPlayer: true },
];

const formatFase = (partido: Partido, torneo?: Tournament | null) => {
  const isCopa = torneo?.formato === 'COPA' || torneo?.formato === 'ELIMINATORIA';
  const isEmpate = partido.golesLocal === partido.golesVisitante;
  if (partido.faseJuego === 'SEGUNDO_TIEMPO' && partido.cronometroIniciadoEn === null && isCopa && isEmpate) {
    return 'Fin de Tiempo Regular';
  }
  switch (partido.faseJuego) {
    case 'PREVIA': return 'Sin iniciar';
    case 'PRIMER_TIEMPO': return '1er Tiempo';
    case 'MEDIO_TIEMPO': return 'Medio Tiempo';
    case 'SEGUNDO_TIEMPO': return '2do Tiempo';
    case 'PENALES': return 'Penales';
    case 'FINALIZADO': return 'Finalizado';
    default: return partido.faseJuego;
  }
};

const getFaseBadgeStyle = (partido: Partido, torneo?: Tournament | null) => {
  const isCopa = torneo?.formato === 'COPA' || torneo?.formato === 'ELIMINATORIA';
  const isEmpate = partido.golesLocal === partido.golesVisitante;
  if (partido.faseJuego === 'SEGUNDO_TIEMPO' && partido.cronometroIniciadoEn === null && isCopa && isEmpate) {
    return { bg: '#3B82F6', text: '#fff' }; // Blue style for regular time ended in draw
  }
  switch (partido.faseJuego) {
    case 'PRIMER_TIEMPO':
    case 'SEGUNDO_TIEMPO':
      return { bg: '#22C55E', text: '#fff' };
    case 'MEDIO_TIEMPO':
      return { bg: '#F59E0B', text: '#fff' };
    case 'PENALES':
      return { bg: '#E65C00', text: '#fff' }; // Orange style for shootout
    case 'FINALIZADO':
      return { bg: '#6B7280', text: '#fff' };
    default:
      return { bg: 'rgba(255,255,255,0.2)', text: '#fff' };
  }
};

const getEventLabel = (tipo: TipoEvento) => {
  if (tipo === 'ASISTENCIA') return 'Asistencia';
  return EVENT_CONFIGS.find((c) => c.tipo === tipo)?.label ?? tipo.replace(/_/g, ' ');
};

const getEventIcon = (tipo: TipoEvento) => {
  if (tipo === 'ASISTENCIA') return { icon: 'shoe-cleat', iconColor: '#7C3AED', iconBg: '#EDE9FE' };
  const cfg = EVENT_CONFIGS.find((c) => c.tipo === tipo);
  if (!cfg) return { icon: 'info', iconColor: '#6B7280', iconBg: '#F3F4F6' };
  return { icon: cfg.icon, iconColor: cfg.iconColor, iconBg: cfg.iconBg };
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleProps {
  delay: number;
}

// Partícula de confetti animada: cae en loop desde arriba con oscilación lateral
// y rotación aleatoria. Los valores aleatorios se fijan con useMemo para que no
// cambien en cada render y arruinen la animación.
function ConfettiParticle({ delay }: ParticleProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const colors = ['#F97316', '#EAB308', '#22C55E', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#EF4444'];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  const sizeWidth = useMemo(() => Math.floor(Math.random() * 8) + 6, []);
  const sizeHeight = useMemo(() => Math.floor(Math.random() * 10) + 8, []);
  const startX = useMemo(
    () => SCREEN_WIDTH / 2 + (Math.random() - 0.5) * SCREEN_WIDTH * 0.55,
    [],
  );
  const swayDistance = useMemo(() => (Math.random() - 0.5) * 80, []);
  const rotateValue = useMemo(() => `${Math.floor(Math.random() * 360)}deg`, []);
  const rotateTo = useMemo(() => `${Math.floor(Math.random() * 720) + 360}deg`, []);
  const borderRadius = useMemo(() => (Math.random() > 0.5 ? sizeWidth / 2 : 0), []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: Math.floor(Math.random() * 2000) + 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT + 50],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [startX, startX + swayDistance, startX - swayDistance],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [rotateValue, rotateTo],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: sizeWidth,
        height: sizeHeight,
        backgroundColor: color,
        borderRadius: borderRadius,
        transform: [
          { translateY },
          { translateX },
          { rotate },
          { scale },
        ],
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { alertState, hideAlert, showError, showConfirm, showSuccess } = useAlert();

  const [partido, setPartido] = useState<Partido | null>(null);
  const [torneo, setTorneo] = useState<Tournament | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ nombre: string; escudo: string | null } | null>(null);
  const celebrationShownRef = useRef(false);

  const closeCelebration = () => {
    setShowCelebration(false);
    setWinnerInfo(null);
  };

  const [modalStep, setModalStep] = useState<'equipo' | 'jugador' | 'asistencia' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [goalScorerId, setGoalScorerId] = useState<string | null>(null);
  const [jugadoresLocal, setJugadoresLocal] = useState<Jugador[]>([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState<Jugador[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const expelledPlayerIds = useMemo(() => {
    if (!partido?.eventos) return new Set<string>();
    const ids = new Set<string>();
    for (const ev of partido.eventos) {
      if (ev.tipo === 'TARJETA_ROJA' && ev.jugadorId) {
        ids.add(ev.jugadorId);
      }
    }
    return ids;
  }, [partido?.eventos]);

  // Calcula a qué equipo le toca patear el siguiente penal.
  // El primer tiro no tiene turno predefinido (lo elige el árbitro).
  // A partir del segundo, los turnos se alternan respecto al equipo que inició.
  // K par → mismo equipo que el primero; K impar → el otro.
  const nextPenaltyTeamId = useMemo(() => {
    if (!partido || partido.faseJuego !== 'PENALES') return null;
    if (selectedEvent && selectedEvent.tipo !== 'GOL' && selectedEvent.tipo !== 'PENAL_FALLADO') {
      return null;
    }
    const penaltyEvents = (partido.eventos ?? [])
      .filter(isShootoutEvent)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const K = penaltyEvents.length;
    if (K === 0) return null;
    const firstTeamId = penaltyEvents[0].equipoId;
    const otherTeamId =
      firstTeamId === partido.equipoLocal.id ? partido.equipoVisitante.id : partido.equipoLocal.id;
    return K % 2 === 0 ? firstTeamId : otherTeamId;
  }, [partido, selectedEvent]);

  // En muerte súbita, la rotación de pateadores vuelve a empezar cuando todos
  // los jugadores elegibles han pateado (un "ciclo"). Este memo calcula qué
  // jugadores ya patearon en el ciclo actual para que la UI los deshabilite.
  const kickedPlayerIdsInCurrentCycle = useMemo(() => {
    if (!partido || partido.faseJuego !== 'PENALES' || !selectedEquipoId) {
      return new Set<string>();
    }
    const teamPenalties = (partido.eventos ?? []).filter(
      (ev) => ev.equipoId === selectedEquipoId && isShootoutEvent(ev),
    );

    const teamPlayers = selectedEquipoId === partido.equipoLocal.id ? jugadoresLocal : jugadoresVisitante;
    const eligiblePlayers = teamPlayers.filter((j) => !expelledPlayerIds.has(j.id));
    const N = eligiblePlayers.length;

    if (N === 0) return new Set<string>();

    const K = teamPenalties.length;
    // cycleIndex determina en qué vuelta de rotación estamos; dentro del ciclo
    // solo se bloquean los jugadores que ya patearon en esta vuelta.
    const cycleIndex = Math.floor(K / N);
    const cycleStartIndex = cycleIndex * N;
    const kickedInCurrentCycle = teamPenalties.slice(cycleStartIndex).map((ev) => ev.jugadorId).filter(Boolean) as string[];

    return new Set<string>(kickedInCurrentCycle);
  }, [partido, selectedEquipoId, jugadoresLocal, jugadoresVisitante, expelledPlayerIds]);

  // Cronómetro
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getHalfLimit = () => {
    if (torneo?.modalidad === 'FUTBOL_11') return 45;
    return 25; 
  };

  // Formato de cronómetro estilo transmisión: muestra "45 +3'" cuando hay tiempo añadido.
  // Solo aplica durante PRIMER_TIEMPO y SEGUNDO_TIEMPO; en otras fases no muestra nada.
  const getFormattedTime = () => {
    if (!partido || displayMinutes <= 0) return '';
    if (partido.faseJuego !== 'PRIMER_TIEMPO' && partido.faseJuego !== 'SEGUNDO_TIEMPO') {
      return '';
    }
    const halfLimit = getHalfLimit();
    if (partido.faseJuego === 'PRIMER_TIEMPO') {
      if (displayMinutes > halfLimit) {
        return `${halfLimit} +${displayMinutes - halfLimit}'`;
      }
    } else if (partido.faseJuego === 'SEGUNDO_TIEMPO') {
      const secondHalfLimit = halfLimit * 2;
      if (displayMinutes > secondHalfLimit) {
        return `${secondHalfLimit} +${displayMinutes - secondHalfLimit}'`;
      }
    }
    return `${displayMinutes}'`;
  };

  // Muestra la pantalla de celebración del campeón una sola vez por sesión.
  // celebrationShownRef evita que el modal aparezca de nuevo si el partido
  // se recarga por el polling mientras la pantalla está abierta.
  const maybeShowTournamentWinner = useCallback((m: Partido) => {
    if (celebrationShownRef.current || !m.ganadorTorneo) return;
    if (m.faseJuego !== 'FINALIZADO') return;

    celebrationShownRef.current = true;
    setWinnerInfo(m.ganadorTorneo ?? null);
    setShowCelebration(true);
  }, []);

  const fetchMatch = useCallback(async () => {
    try {
      const m = await getMatchById(id);
      setPartido(m);
      maybeShowTournamentWinner(m);
    } catch {
      showError('Error', 'No se pudo cargar el partido');
    }
  }, [id, maybeShowTournamentWinner]);

  const fetchAll = useCallback(async () => {
    try {
      const m = await getMatchById(id);
      setPartido(m);
      const t = await getTournamentById(m.torneoId);
      setTorneo(t);
      maybeShowTournamentWinner(m);
    } catch {
      showError('Error', 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [id, maybeShowTournamentWinner]);

  // Carga inicial completa + polling cada 10s solo para el partido (sin recargar el torneo)
  // para mantener el marcador y los eventos actualizados durante el partido en vivo.
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchMatch();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchMatch]);

  useEffect(() => {
    if (!partido) return;
    (async () => {
      try {
        setLoadingPlayers(true);
        const [local, visitante] = await Promise.all([
          getTeamById(partido.equipoLocal.id),
          getTeamById(partido.equipoVisitante.id),
        ]);
        const mapJugadores = (rows: { usuario: Jugador }[] | undefined | null) =>
          (rows ?? []).map((r) => r.usuario);
        setJugadoresLocal(mapJugadores(local.jugadores));
        setJugadoresVisitante(mapJugadores(visitante.jugadores));
      } catch {
      } finally {
        setLoadingPlayers(false);
      }
    })();
  }, [partido?.id]);

  useEffect(() => {
    if (!partido) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (partido.cronometroIniciadoEn) {
      const startedAt = new Date(partido.cronometroIniciadoEn).getTime();
      const update = () => {
        const diff = Date.now() - startedAt;
        // Evita minutos negativos por desfase entre el reloj del servidor
        // (cronometroIniciadoEn) y el del cliente al iniciar el partido.
        setDisplayMinutes(Math.max(0, partido.minutosJugados + Math.floor(diff / 60000)));
      };
      update();
      intervalRef.current = setInterval(update, 10000);
    } else {
      setDisplayMinutes(partido.minutosJugados);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [partido]);

  const stats = useMemo(() => {
    if (!partido?.eventos) return null;
    const eventos = partido.eventos;
    const localId = partido.equipoLocal.id;
    const visitId = partido.equipoVisitante.id;

    const count = (tipo: TipoEvento, equipoId: string) =>
      eventos.filter((e) => e.tipo === tipo && e.equipoId === equipoId).length;

    return {
      golesLocal: partido.golesLocal ?? 0,
      golesVisitante: partido.golesVisitante ?? 0,
      amarillasLocal: count('TARJETA_AMARILLA', localId),
      amarillasVisitante: count('TARJETA_AMARILLA', visitId),
      rojasLocal: count('TARJETA_ROJA', localId),
      rojasVisitante: count('TARJETA_ROJA', visitId),
      faltasLocal: count('FALTA', localId),
      faltasVisitante: count('FALTA', visitId),
      cornersLocal: count('CORNER', localId),
      cornersVisitante: count('CORNER', visitId),
    };
  }, [partido]);

  const groupedEvents = useMemo(() => {
    if (!partido?.eventos || partido.eventos.length === 0) return null;
    // Los tiros de la tanda de penales se muestran solo en el tracker, no en "Eventos".
    const eventos = partido.eventos.filter((e) => !isShootoutEvent(e));
    if (eventos.length === 0) return null;
    const goles = eventos.filter((e) => e.tipo === 'GOL' || e.tipo === 'ASISTENCIA');
    const tarjetas = eventos.filter((e) => e.tipo === 'TARJETA_AMARILLA' || e.tipo === 'TARJETA_ROJA');
    const otros = eventos.filter((e) => e.tipo !== 'GOL' && e.tipo !== 'ASISTENCIA' && e.tipo !== 'TARJETA_AMARILLA' && e.tipo !== 'TARJETA_ROJA');
    return { goles, tarjetas, otros };
  }, [partido]);

  const isMatchFinished = partido?.faseJuego === 'FINALIZADO';

  if (loading || !partido) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  }

  const isAdmin = torneo?.rolUsuario === 'ORGANIZADOR' || torneo?.rolUsuario === 'STAFF';
  const isLive =
    partido.faseJuego === 'PRIMER_TIEMPO' ||
    partido.faseJuego === 'MEDIO_TIEMPO' ||
    partido.faseJuego === 'SEGUNDO_TIEMPO' ||
    partido.faseJuego === 'PENALES';
  const torneoEnCurso = torneo?.estado === 'EN_CURSO';
  const isReadyToStart =
    partido.estado === 'CONFIRMADO' && partido.faseJuego === 'PREVIA' && torneoEnCurso;
  const esperandoInicioTorneo =
    isAdmin &&
    partido.estado === 'CONFIRMADO' &&
    partido.faseJuego === 'PREVIA' &&
    !torneoEnCurso;
  const hasPenalties = partido.golesPenalesLocal !== null && partido.golesPenalesVisitante !== null;
  const faseBadge = getFaseBadgeStyle(partido, torneo);

  const showEventControls = isLive;

  const doControlAction = (
    action: MatchControlAction,
    msg: string,
    golesPenalesLocal?: number,
    golesPenalesVisitante?: number,
  ) =>
    showConfirm('Confirmar', msg, async () => {
      setActionLoading(true);
      try {
        const res = await controlLiveMatch(partido.id, action, golesPenalesLocal, golesPenalesVisitante);
        await fetchAll();
        if (action === 'END_MATCH') {
          if (res.ganadorTorneo) {
            celebrationShownRef.current = true;
            setWinnerInfo(res.ganadorTorneo);
            setShowCelebration(true);
          } else {
            showSuccess('Partido Finalizado', 'El partido ha finalizado.');
          }
        }
      } catch (e: any) {
        showError('Error', e.message ?? 'No se pudo realizar la acción');
      } finally {
        setActionLoading(false);
      }
    });



  const handleControlActionPress = (action: MatchControlAction) => {
    const halfLimit = getHalfLimit();
    let msg = '';

    if (action === 'START_FIRST_HALF') {
      if (partido.fecha) {
        const scheduledTime = new Date(partido.fecha).getTime();
        const now = Date.now();
        const tenMinutesMs = 10 * 60 * 1000;
        if (now < scheduledTime || now > scheduledTime + tenMinutesMs) {
          const formattedScheduled = formatPartidoFecha(partido.fecha);
          doControlAction(
            action,
            `ADVERTENCIA: El partido está programado para el ${formattedScheduled}. ¿Estás seguro de iniciar este partido en la fecha y hora actual?`
          );
          return;
        }
      }
      doControlAction(action, '¿Iniciar el primer tiempo?');
    } else if (action === 'PAUSE_HALF_TIME') {
      if (displayMinutes < halfLimit) {
        msg = `¡Advertencia! Aún no se han jugado los ${halfLimit} minutos del primer tiempo. ¿Deseas terminar el primer tiempo antes de tiempo?`;
      } else {
        msg = '¿Pausar para el medio tiempo?';
      }
      doControlAction(action, msg);
    } else if (action === 'START_SECOND_HALF') {
      doControlAction(action, '¿Iniciar el segundo tiempo?');
    } else if (action === 'START_PENALTIES') {
      doControlAction(action, '¿Iniciar la tanda de penales?');
    } else if (action === 'END_MATCH') {
      if (partido.faseJuego === 'PRIMER_TIEMPO') {
        doControlAction('END_MATCH', '¿Finalizar el partido?');
      } else if (partido.faseJuego === 'PENALES') {
        const penLocal = partido.golesPenalesLocal ?? 0;
        const penVisitante = partido.golesPenalesVisitante ?? 0;

        if (penLocal === penVisitante) {
          showError('Error', 'No se puede finalizar el partido como empate durante la tanda de penales.');
          return;
        }

        const localShootoutKicks = (partido.eventos ?? []).filter(
          ev => ev.equipoId === partido.equipoLocal.id && isShootoutEvent(ev),
        ).length;
        const visitanteShootoutKicks = (partido.eventos ?? []).filter(
          ev => ev.equipoId === partido.equipoVisitante.id && isShootoutEvent(ev),
        ).length;

        if (localShootoutKicks < 5 || visitanteShootoutKicks < 5) {
          showConfirm(
            'Advertencia',
            '¿Estás seguro de finalizar el partido antes de completar los 5 penales?',
            () => doControlAction(action, '¿Finalizar el partido?')
          );
        } else {
          doControlAction(action, '¿Finalizar el partido?');
        }
      } else {
        const requiredMinutes = halfLimit * 2;
        const finishAction = () => {
          doControlAction(action, '¿Terminar el segundo tiempo?');
        };

        if (displayMinutes < requiredMinutes) {
          showConfirm(
            'Confirmar',
            `¡Advertencia! Aún no se han jugado los ${requiredMinutes} minutos reglamentarios. ¿Deseas terminar el segundo tiempo antes de tiempo?`,
            finishAction
          );
        } else {
          finishAction();
        }
      }
    }
  };

  const openEventFlow = (ev: EventConfig) => {
    setSelectedEvent(ev);
    setSelectedEquipoId(null);
    setModalStep('equipo');
  };

  const selectEquipo = (equipoId: string) => {
    setSelectedEquipoId(equipoId);
    if (selectedEvent?.needsPlayer) {
      setModalStep('jugador');
    } else {
      submitEvent(equipoId, undefined);
    }
  };

  const submitEvent = async (equipoId: string, jugadorId?: string, asistenciaJugadorId?: string) => {
    if (!selectedEvent) return;
    closeModal();
    setActionLoading(true);
    try {
      const wasPenales = partido.faseJuego === 'PENALES';
      // En tanda de penales (o si el partido terminó por penales), los eventos van marcados
      // con detalle 'PENAL' para que el backend y el tracker los identifiquen correctamente
      const isPenal = wasPenales || (partido.faseJuego === 'FINALIZADO' && partido.golesPenalesLocal !== null);
      await addMatchEvent(partido.id, {
        tipo: selectedEvent.tipo,
        equipoId,
        jugadorId,
        minuto: isPenal ? undefined : Math.max(0, displayMinutes),
        detalle: isPenal ? 'PENAL' : undefined,
        asistenciaJugadorId,
      });
      
      const updated = await getMatchById(id);
      setPartido(updated);
      maybeShowTournamentWinner(updated);

      if (wasPenales && updated.faseJuego === 'FINALIZADO') {
        if (updated.ganadorTorneo) {
          celebrationShownRef.current = true;
          setWinnerInfo(updated.ganadorTorneo);
          setShowCelebration(true);
        } else {
          showSuccess('Partido Finalizado', 'La tanda de penales ha concluido y el partido ha finalizado.');
        }
      }
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo guardar el evento');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setModalStep(null);
    setSelectedEvent(null);
    setSelectedEquipoId(null);
    setGoalScorerId(null);
  };

  const onSelectJugador = (jugadorId?: string) => {
    if (selectedEvent?.tipo === 'GOL' && partido.faseJuego !== 'PENALES') {
      setGoalScorerId(jugadorId ?? null);
      setModalStep('asistencia');
    } else {
      submitEvent(selectedEquipoId!, jugadorId);
    }
  };

  const deleteEvent = (ev: EventoPartido) =>
    showConfirm('Borrar evento', '¿Deseas eliminar este evento?', async () => {
      setActionLoading(true);
      try {
        await deleteMatchEvent(partido.id, ev.id);
        await fetchMatch();
      } catch (e: any) {
        showError('Error', e.message ?? 'No se pudo borrar');
      } finally {
        setActionLoading(false);
      }
    });

  const jugadoresEquipoSeleccionado =
    selectedEquipoId === partido.equipoLocal.id ? jugadoresLocal : jugadoresVisitante;
  const nombreEquipoSeleccionado =
    selectedEquipoId === partido.equipoLocal.id
      ? partido.equipoLocal.nombre
      : partido.equipoVisitante.nombre;

  const renderEventRow = (ev: EventoPartido) => {
    const isLocal = ev.equipoId === partido.equipoLocal.id;
    const { icon, iconColor, iconBg } = getEventIcon(ev.tipo);

    return (
      <View key={ev.id} style={styles.eventRow}>
        <View style={[styles.eventCol, styles.eventColLeft]}>
          {isLocal && (
            <>
              <Text style={styles.eventPlayerName} numberOfLines={1}>
                {ev.jugador ? ev.jugador.nombre : partido.equipoLocal.nombre}
                {ev.tipo === 'PENAL_FALLADO' && <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '400' }}> (Fallado)</Text>}
              </Text>
            </>
          )}
        </View>

        <View style={styles.eventCenter}>
          <Text style={styles.eventMinute}>
            {isShootoutEvent(ev) ? 'Pen.' : `${ev.minuto}'`}
          </Text>
          <View style={[styles.eventIconDot, { backgroundColor: iconBg }]}>
            <MatchEventIcon tipo={ev.tipo} size={12} color={iconColor} />
          </View>
        </View>

        <View style={[styles.eventCol, styles.eventColRight]}>
          {!isLocal && (
            <Text style={styles.eventPlayerName} numberOfLines={1}>
              {ev.jugador ? ev.jugador.nombre : partido.equipoVisitante.nombre}
              {ev.tipo === 'PENAL_FALLADO' && <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '400' }}> (Fallado)</Text>}
            </Text>
          )}
        </View>

        {isAdmin && isLive &&
          !(partido.golesPenalesLocal !== null && partido.golesPenalesVisitante !== null &&
            (ev.tipo === 'GOL' || ev.tipo === 'ASISTENCIA') && ev.detalle !== 'PENAL') && (
          <TouchableOpacity onPress={() => deleteEvent(ev)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.eventDeleteBtn}>
            <Feather name="trash-2" size={13} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
          <View style={[styles.faseBadge, { backgroundColor: faseBadge.bg, marginBottom: 0, marginTop: 0 }]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={[styles.faseText, { color: faseBadge.text }]}>
              {formatFase(partido, torneo)}
            </Text>
          </View>
          {getFormattedTime() ? (
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 6 }}>
              {getFormattedTime()}
            </Text>
          ) : null}
        </View>

        <View style={styles.scoreRow}>
          <TeamBadge nombre={partido.equipoLocal.nombre} escudo={partido.equipoLocal.escudo} />

          <View style={styles.scoreBlock}>
            <Text style={styles.scoreText}>
              {partido.golesLocal ?? 0}
              {'  '}–{'  '}
              {partido.golesVisitante ?? 0}
            </Text>
            {partido.golesPenalesLocal !== null && partido.golesPenalesVisitante !== null && (
              <Text style={{ color: '#FEF0DC', fontSize: 13, fontWeight: '600', marginTop: -4 }}>
                Pen: ({partido.golesPenalesLocal} – {partido.golesPenalesVisitante})
              </Text>
            )}
          </View>

          <TeamBadge nombre={partido.equipoVisitante.nombre} escudo={partido.equipoVisitante.escudo} align="right" />
        </View>

        <Text style={styles.faseSubtitle}>{partido.fase || 'Fase de grupos'}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottom + 24 }} showsVerticalScrollIndicator={false}>

        {(partido.faseJuego === 'PENALES' || hasPenalties) && (
          <PenaltyShootoutTracker partido={partido} nextTeamId={nextPenaltyTeamId} />
        )}

        {esperandoInicioTorneo && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control del partido</Text>
            <Text style={styles.controlHint}>
              El torneo aún no está en curso. Cierra las inscripciones e inicia el torneo para poder
              comenzar los partidos.
            </Text>
          </View>
        )}

        {isAdmin && (isLive || isReadyToStart) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control del partido</Text>

            <View style={styles.ctrlRow}>
              {partido.faseJuego === 'PREVIA' && torneoEnCurso && (
                <CtrlBtn
                  icon="play-circle"
                  label="Iniciar 1er Tiempo"
                  color="#0D7A3E"
                  onPress={() => handleControlActionPress('START_FIRST_HALF')}
                />
              )}

              {partido.faseJuego === 'PRIMER_TIEMPO' && (
                <>
                  <CtrlBtn
                    icon="pause-circle"
                    label="Medio Tiempo"
                    color="#F59E0B"
                    onPress={() => handleControlActionPress('PAUSE_HALF_TIME')}
                  />
                  <CtrlBtn
                    icon="x-circle"
                    label="Finalizar"
                    color="#EF4444"
                    onPress={() => handleControlActionPress('END_MATCH')}
                  />
                </>
              )}

              {partido.faseJuego === 'MEDIO_TIEMPO' && (
                <CtrlBtn
                  icon="play-circle"
                  label="Iniciar 2do Tiempo"
                  color="#0D7A3E"
                  onPress={() => handleControlActionPress('START_SECOND_HALF')}
                />
              )}

              {partido.faseJuego === 'SEGUNDO_TIEMPO' && (
                <>
                  {partido.cronometroIniciadoEn !== null ? (
                    <CtrlBtn
                      icon="x-circle"
                      label="Terminar 2do Tiempo"
                      color="#EF4444"
                      onPress={() => handleControlActionPress('END_MATCH')}
                    />
                  ) : (
                    <>
                      {(torneo?.formato === 'COPA' || torneo?.formato === 'ELIMINATORIA') &&
                        partido.golesLocal === partido.golesVisitante && (
                          <CtrlBtn
                            icon="play-circle"
                            label="Iniciar Penales"
                            color="#D97706"
                            onPress={() => handleControlActionPress('START_PENALTIES')}
                          />
                        )}
                    </>
                  )}
                </>
              )}

              {partido.faseJuego === 'PENALES' && (
                <CtrlBtn
                  icon="x-circle"
                  label="Finalizar Partido"
                  color="#EF4444"
                  onPress={() => handleControlActionPress('END_MATCH')}
                />
              )}
            </View>

            {showEventControls && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionSubtitle}>Registrar evento</Text>
                <View style={styles.eventGrid}>
                  {EVENT_CONFIGS.filter((ev) => {
                    if (ev.tipo === 'PENAL_FALLADO') {
                      return partido.faseJuego === 'PENALES';
                    }
                    return true;
                  }).map((ev) => (
                    <TouchableOpacity
                      key={ev.tipo}
                      style={[
                        styles.eventBtn,
                        {
                          backgroundColor: ev.bgColor,
                          borderColor: ev.borderColor,
                        },
                      ]}
                      onPress={() => openEventFlow(ev)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.eventIconCircle,
                          { backgroundColor: ev.iconBg },
                        ]}
                      >
                        <MatchEventIcon
                          tipo={ev.tipo}
                          size={18}
                          color={ev.iconColor}
                        />
                      </View>
                      <Text style={[styles.eventLabel, { color: ev.textColor }]}>
                        {ev.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Eventos</Text>

          {!groupedEvents ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="clipboard" size={28} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyText}>Sin eventos registrados</Text>
            </View>
          ) : (
            <>
              {groupedEvents.goles.length > 0 && (
                <View style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconDot, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialCommunityIcons name="soccer" size={14} color="#15803D" />
                    </View>
                    <Text style={styles.groupTitle}>GOLES</Text>
                  </View>
                  {groupedEvents.goles.map(renderEventRow)}
                </View>
              )}

              {groupedEvents.tarjetas.length > 0 && (
                <View style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconDot, { backgroundColor: '#FEF9C3' }]}>
                      <MaterialCommunityIcons name="cards" size={14} color="#A16207" />
                    </View>
                    <Text style={styles.groupTitle}>TARJETAS</Text>
                  </View>
                  {groupedEvents.tarjetas.map(renderEventRow)}
                </View>
              )}

              {groupedEvents.otros.length > 0 && (
                <View style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupIconDot, { backgroundColor: '#FFEDD5' }]}>
                      <Feather name="alert-triangle" size={14} color="#C2410C" />
                    </View>
                    <Text style={styles.groupTitle}>OTROS</Text>
                  </View>
                  {groupedEvents.otros.map(renderEventRow)}
                </View>
              )}
            </>
          )}
        </View>

        {stats && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Estadísticas del partido</Text>

            <StatRow label="Goles" left={stats.golesLocal} right={stats.golesVisitante} color="#0D7A3E" />
            <StatRow label="Tarjetas amarillas" left={stats.amarillasLocal} right={stats.amarillasVisitante} color="#EAB308" />
            <StatRow label="Tarjetas rojas" left={stats.rojasLocal} right={stats.rojasVisitante} color="#EF4444" />
            <StatRow label="Faltas" left={stats.faltasLocal} right={stats.faltasVisitante} color="#F97316" />
            <StatRow label="Saques de esquina" left={stats.cornersLocal} right={stats.cornersVisitante} color="#3B82F6" />
          </View>
        )}
      </ScrollView>

      <Modal visible={modalStep !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />

            {modalStep === 'equipo' && selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconCircle, { backgroundColor: selectedEvent.iconBg }]}>
                    <MatchEventIcon tipo={selectedEvent.tipo} size={22} color={selectedEvent.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Registrar {selectedEvent.label}</Text>
                    <Text style={styles.modalSubtitle}>¿A qué equipo pertenece?</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Feather name="x" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.teamPickerRow}>
                  <TouchableOpacity
                    style={[
                      styles.teamPickCard,
                      nextPenaltyTeamId && nextPenaltyTeamId !== partido.equipoLocal.id && { opacity: 0.4 }
                    ]}
                    onPress={() => {
                      if (nextPenaltyTeamId && nextPenaltyTeamId !== partido.equipoLocal.id) return;
                      selectEquipo(partido.equipoLocal.id);
                    }}
                    activeOpacity={0.8}
                    disabled={nextPenaltyTeamId ? nextPenaltyTeamId !== partido.equipoLocal.id : false}
                  >
                    <TeamBadgeLarge nombre={partido.equipoLocal.nombre} escudo={partido.equipoLocal.escudo} />
                    <Text style={styles.teamPickLabel}>{partido.equipoLocal.nombre}</Text>
                    <View style={styles.teamPickTag}><Text style={styles.teamPickTagText}>Local</Text></View>
                  </TouchableOpacity>

                  <View style={styles.vsColumn}><Text style={styles.vsText}>VS</Text></View>

                  <TouchableOpacity
                    style={[
                      styles.teamPickCard,
                      nextPenaltyTeamId && nextPenaltyTeamId !== partido.equipoVisitante.id && { opacity: 0.4 }
                    ]}
                    onPress={() => {
                      if (nextPenaltyTeamId && nextPenaltyTeamId !== partido.equipoVisitante.id) return;
                      selectEquipo(partido.equipoVisitante.id);
                    }}
                    activeOpacity={0.8}
                    disabled={nextPenaltyTeamId ? nextPenaltyTeamId !== partido.equipoVisitante.id : false}
                  >
                    <TeamBadgeLarge nombre={partido.equipoVisitante.nombre} escudo={partido.equipoVisitante.escudo} />
                    <Text style={styles.teamPickLabel}>{partido.equipoVisitante.nombre}</Text>
                    <View style={[styles.teamPickTag, styles.teamPickTagVisit]}><Text style={[styles.teamPickTagText, { color: '#1D4ED8' }]}>Visitante</Text></View>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modalStep === 'asistencia' && selectedEvent && selectedEquipoId && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setModalStep('jugador')} style={{ marginRight: 8 }}>
                    <Feather name="arrow-left" size={20} color="#374151" />
                  </TouchableOpacity>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#EDE9FE' }]}>
                    <MaterialCommunityIcons name="shoe-cleat" size={22} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Asistencia (opcional)</Text>
                    <Text style={styles.modalSubtitle}>{nombreEquipoSeleccionado}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Feather name="x" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={styles.playerRow} onPress={() => submitEvent(selectedEquipoId, goalScorerId ?? undefined)}>
                    <View style={styles.playerAvatar}>
                      <Feather name="slash" size={18} color="#6B7280" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>Sin asistencia</Text>
                      <Text style={styles.playerEmail}>Registrar solo el gol</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {loadingPlayers ? (
                    <ActivityIndicator color="#0D7A3E" style={{ marginVertical: 20 }} />
                  ) : jugadoresEquipoSeleccionado.length === 0 ? (
                    <Text style={styles.noPlayersText}>No hay jugadores registrados</Text>
                  ) : (
                    jugadoresEquipoSeleccionado
                      .filter((j) => j.id !== goalScorerId && !expelledPlayerIds.has(j.id))
                      .map((j) => (
                        <TouchableOpacity key={j.id} style={styles.playerRow} onPress={() => submitEvent(selectedEquipoId, goalScorerId ?? undefined, j.id)} activeOpacity={0.7}>
                        <View style={styles.playerAvatar}>
                          {j.fotoPerfil ? (
                            <Image source={{ uri: j.fotoPerfil }} style={styles.playerAvatarImg} />
                          ) : (
                            <Text style={styles.playerAvatarText}>{j.nombre.charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.playerName}>{j.nombre}</Text>
                          {j.email && <Text style={styles.playerEmail}>{j.email}</Text>}
                        </View>
                        <Feather name="chevron-right" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            {modalStep === 'jugador' && selectedEvent && selectedEquipoId && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setModalStep('equipo')} style={{ marginRight: 8 }}>
                    <Feather name="arrow-left" size={20} color="#374151" />
                  </TouchableOpacity>
                  <View style={[styles.modalIconCircle, { backgroundColor: selectedEvent.iconBg }]}>
                    <MatchEventIcon tipo={selectedEvent.tipo} size={22} color={selectedEvent.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Seleccionar jugador</Text>
                    <Text style={styles.modalSubtitle}>{nombreEquipoSeleccionado}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Feather name="x" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {!(selectedEvent?.tipo === 'TARJETA_AMARILLA' || selectedEvent?.tipo === 'TARJETA_ROJA' || partido.faseJuego === 'PENALES') && (
                    <TouchableOpacity style={styles.playerRow} onPress={() => onSelectJugador(undefined)}>
                      <View style={styles.playerAvatar}>
                        <Feather name="users" size={18} color="#6B7280" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playerName}>Sin jugador específico</Text>
                        <Text style={styles.playerEmail}>Registrar solo al equipo</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}

                  <View style={styles.divider} />

                  {loadingPlayers ? (
                    <ActivityIndicator color="#0D7A3E" style={{ marginVertical: 20 }} />
                  ) : jugadoresEquipoSeleccionado.length === 0 ? (
                    <Text style={styles.noPlayersText}>No hay jugadores registrados</Text>
                  ) : (
                    jugadoresEquipoSeleccionado
                      .filter((j) => !expelledPlayerIds.has(j.id) && !kickedPlayerIdsInCurrentCycle.has(j.id))
                      .map((j) => (
                        <TouchableOpacity key={j.id} style={styles.playerRow} onPress={() => onSelectJugador(j.id)} activeOpacity={0.7}>
                        <View style={styles.playerAvatar}>
                          {j.fotoPerfil ? (
                            <Image source={{ uri: j.fotoPerfil }} style={styles.playerAvatarImg} />
                          ) : (
                            <Text style={styles.playerAvatarText}>{j.nombre.charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.playerName}>{j.nombre}</Text>
                          {j.email && <Text style={styles.playerEmail}>{j.email}</Text>}
                        </View>
                        <Feather name="chevron-right" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showCelebration} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.celebrationOverlay}>
          {showCelebration && (
            <View style={styles.confettiLayer} pointerEvents="none">
              {Array.from({ length: 80 }).map((_, idx) => (
                <ConfettiParticle key={idx} delay={idx * 60} />
              ))}
            </View>
          )}
          <Animated.View style={styles.celebrationCard}>
            <View style={styles.celebrationGoldBorder} />
            <View style={styles.trophyContainer}>
              <MaterialCommunityIcons name="trophy" size={80} color="#D97706" style={styles.trophyIcon} />
              <View style={styles.trophyGlow} />
            </View>

            <Text style={styles.champTitle}>
              {torneo?.formato === 'LIGA' ? '¡CAMPEÓN DE LA LIGA!' : '¡CAMPEÓN DE LA COPA!'}
            </Text>

            {winnerInfo && (
              <View style={styles.champWinnerBlock}>
                {winnerInfo.escudo ? (
                  <View style={[styles.champEscudo, { overflow: 'hidden' }]}>
                    <ShieldDisplay escudo={winnerInfo.escudo} nombre={winnerInfo.nombre} size={80} />
                  </View>
                ) : (
                  <View style={styles.champEscudoFallback}>
                    <Text style={styles.champEscudoFallbackText}>
                      {winnerInfo.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.champName}>{winnerInfo.nombre}</Text>
              </View>
            )}

            <Text style={styles.champSubtitle}>
              Felicitaciones al nuevo monarca del torneo por su excelente campaña y gran victoria.
            </Text>

            <TouchableOpacity style={styles.champCloseBtn} onPress={closeCelebration} activeOpacity={0.85}>
              <Text style={styles.champCloseBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>



      {/* ── Loading overlay ── */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0D7A3E" />
        </View>
      )}
    </View>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────

function TeamBadge({ nombre, escudo, align = 'left' }: { nombre: string; escudo: string | null; align?: 'left' | 'right' }) {
  return (
    <View style={[styles.teamBadge, align === 'right' && { alignItems: 'flex-end' }]}>
      <ShieldDisplay escudo={escudo} nombre={nombre} size={44} />
      <Text style={styles.teamName} numberOfLines={2}>{nombre}</Text>
    </View>
  );
}

function TeamBadgeLarge({ nombre, escudo }: { nombre: string; escudo: string | null }) {
  return <ShieldDisplay escudo={escudo} nombre={nombre} size={56} />;
}

function CtrlBtn({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon} size={20} color="#fff" />
      <Text style={styles.ctrlBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Barra de comparación de estadísticas (como en la imagen 2)
function StatRow({ label, left, right, color }: { label: string; left: number; right: number; color: string }) {
  const total = left + right;
  const leftPct = total > 0 ? left / total : 0.5;
  const rightPct = total > 0 ? right / total : 0.5;

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statValue, left > right && styles.statValueBold]}>{left}</Text>
      <View style={styles.statCenter}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statBarContainer}>
          <View style={styles.statBarBg}>
            <View style={[styles.statBarLeft, { flex: leftPct, backgroundColor: left >= right ? color : '#D1D5DB' }]} />
            <View style={{ width: 2 }} />
            <View style={[styles.statBarRight, { flex: rightPct, backgroundColor: right > left ? color : '#D1D5DB' }]} />
          </View>
        </View>
      </View>
      <Text style={[styles.statValue, right > left && styles.statValueBold]}>{right}</Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F1' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F1' },

  // Header
  header: { backgroundColor: '#0D7A3E', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { position: 'absolute', top: 48, left: 16, zIndex: 10, padding: 8 },
  faseBadge: {
    flexDirection: 'row', alignSelf: 'center', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, gap: 6,
    marginBottom: 16, marginTop: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', opacity: 0.9 },
  faseText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreBlock: { alignItems: 'center', paddingHorizontal: 8 },
  scoreText: { color: '#fff', fontSize: 44, fontWeight: '700', letterSpacing: 2 },
  faseSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginTop: 8 },

  // Team in header
  teamBadge: { flex: 1, alignItems: 'flex-start', gap: 6 },
  escudoSm: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff' },
  escudoSmFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  escudoSmText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  teamName: { color: '#fff', fontSize: 12, fontWeight: '600', maxWidth: 90 },

  // Body
  body: { flex: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, margin: 16, marginBottom: 0, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  sectionSubtitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 12, letterSpacing: 0.3, textTransform: 'uppercase' },
  controlHint: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  // Control buttons
  ctrlRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  ctrlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14, minWidth: 130,
  },
  ctrlBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Event grid (admin register buttons)
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  eventBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
    minWidth: '45%', flex: 1,
  },
  eventIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  eventLabel: { fontSize: 14, fontWeight: '600', flexShrink: 1 },

  // Grouped events section
  groupSection: { marginBottom: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  groupIconDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontSize: 12, fontWeight: '700', color: '#374151', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Event row (grouped list)
  eventRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  eventCol: { flex: 1 },
  eventColLeft: { alignItems: 'flex-end', paddingRight: 10 },
  eventColRight: { alignItems: 'flex-start', paddingLeft: 10 },
  eventCenter: { alignItems: 'center', width: 50, gap: 2 },
  eventMinute: { fontSize: 11, fontWeight: '700', color: '#0D7A3E' },
  eventIconDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eventPlayerName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  eventDeleteBtn: { position: 'absolute', right: -4, padding: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },

  // Statistics comparison
  statRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  statValue: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '500', color: '#6B7280' },
  statValueBold: { fontWeight: '700', color: '#111827' },
  statCenter: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  statBarContainer: { width: '100%', height: 6 },
  statBarBg: { flex: 1, flexDirection: 'row', borderRadius: 3, overflow: 'hidden' },
  statBarLeft: { height: 6, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  statBarRight: { height: 6, borderTopRightRadius: 3, borderBottomRightRadius: 3 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 16, minHeight: 300,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  modalIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  // Team picker
  teamPickerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  teamPickCard: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 18, borderWidth: 1.5,
    borderColor: '#E5E7EB', padding: 16, alignItems: 'center', gap: 10,
  },
  teamPickLabel: { fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },
  teamPickTag: { backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  teamPickTagVisit: { backgroundColor: '#DBEAFE' },
  teamPickTagText: { fontSize: 11, fontWeight: '600', color: '#15803D' },
  vsColumn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  vsText: { fontSize: 13, fontWeight: '800', color: '#9CA3AF' },

  // Team large
  escudoLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' },
  escudoLgFallback: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  escudoLgText: { fontSize: 24, fontWeight: '700', color: '#0D7A3E' },

  // Player list
  playerRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  playerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  playerAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  playerAvatarText: { fontSize: 17, fontWeight: '700', color: '#374151' },
  playerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  playerEmail: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  noPlayersText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20, fontSize: 13 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center',
  },

  // Celebration styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 26, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    padding: 28,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    position: 'relative',
    overflow: 'hidden',
  },
  celebrationGoldBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#D97706',
  },
  trophyContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: 120,
    height: 120,
  },
  trophyIcon: {
    zIndex: 2,
  },
  trophyGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
    zIndex: 1,
  },
  champTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F1A14',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  champWinnerBlock: {
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
  },
  champEscudo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#D97706',
    backgroundColor: '#F3F4F6',
  },
  champEscudoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  champEscudoFallbackText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#D97706',
  },
  champName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
    textAlign: 'center',
  },
  champSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 20,
  },
  champCloseBtn: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
    width: '100%',
    alignItems: 'center',
  },
  champCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  counterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    textAlign: 'center',
    minWidth: 48,
  },
});
