import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getMatchById,
  controlLiveMatch,
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

function MatchEventIcon({ tipo, size, color }: { tipo: TipoEvento; size: number; color: string }) {
  if (tipo === 'GOL') {
    return <MaterialCommunityIcons name="soccer" size={size} color={color} />;
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

// ─── Tipos de evento con metadatos ─────────────────────────────────────
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
  { tipo: 'FALTA',            label: 'Falta',     icon: 'alert-triangle', iconColor: '#C2410C', iconBg: '#FFEDD5', bgColor: '#FFEDD5', textColor: '#C2410C', borderColor: '#FDBA74', needsPlayer: false },
  { tipo: 'CORNER',           label: 'Corner',    icon: 'flag',           iconColor: '#1D4ED8', iconBg: '#DBEAFE', bgColor: '#DBEAFE', textColor: '#1D4ED8', borderColor: '#93C5FD', needsPlayer: false },
];

// ─── Helpers ────────────────────────────────────────────────────────────
const formatFase = (fase: string) => {
  switch (fase) {
    case 'PREVIA': return 'Sin iniciar';
    case 'PRIMER_TIEMPO': return '1er Tiempo';
    case 'MEDIO_TIEMPO': return 'Medio Tiempo';
    case 'SEGUNDO_TIEMPO': return '2do Tiempo';
    case 'FINALIZADO': return 'Finalizado';
    default: return fase;
  }
};

const getFaseBadgeStyle = (fase: string) => {
  switch (fase) {
    case 'PRIMER_TIEMPO':
    case 'SEGUNDO_TIEMPO':
      return { bg: '#22C55E', text: '#fff' };
    case 'MEDIO_TIEMPO':
      return { bg: '#F59E0B', text: '#fff' };
    case 'FINALIZADO':
      return { bg: '#6B7280', text: '#fff' };
    default:
      return { bg: 'rgba(255,255,255,0.2)', text: '#fff' };
  }
};

const getEventLabel = (tipo: TipoEvento) =>
  EVENT_CONFIGS.find((c) => c.tipo === tipo)?.label ?? tipo.replace(/_/g, ' ');

const getEventIcon = (tipo: TipoEvento) => {
  const cfg = EVENT_CONFIGS.find((c) => c.tipo === tipo);
  if (!cfg) return { icon: 'info', iconColor: '#6B7280', iconBg: '#F3F4F6' };
  return { icon: cfg.icon, iconColor: cfg.iconColor, iconBg: cfg.iconBg };
};

// ─── Componente Principal ────────────────────────────────────────────────
export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { alertState, hideAlert, showError, showConfirm } = useAlert();

  const [partido, setPartido] = useState<Partido | null>(null);
  const [torneo, setTorneo] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de evento
  const [modalStep, setModalStep] = useState<'equipo' | 'jugador' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [jugadoresLocal, setJugadoresLocal] = useState<Jugador[]>([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState<Jugador[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Modal de penales
  const [penalesModalVisible, setPenalesModalVisible] = useState(false);
  const [penLocal, setPenLocal] = useState('0');
  const [penVisitante, setPenVisitante] = useState('0');

  // Cronómetro
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getHalfLimit = () => {
    if (torneo?.modalidad === 'FUTBOL_7') return 25;
    if (torneo?.modalidad === 'FUTBOL_11') return 45;
    return 15; // default FUTBOL_5
  };

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

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchMatch = useCallback(async () => {
    try {
      const m = await getMatchById(id);
      setPartido(m);
    } catch {
      showError('Error', 'No se pudo cargar el partido');
    }
  }, [id]);

  const fetchAll = useCallback(async () => {
    try {
      const m = await getMatchById(id);
      setPartido(m);
      const t = await getTournamentById(m.torneoId);
      setTorneo(t);
    } catch {
      showError('Error', 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchMatch();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchMatch]);

  // Cargar jugadores de ambos equipos una vez
  useEffect(() => {
    if (!partido) return;
    (async () => {
      try {
        setLoadingPlayers(true);
        const [local, visitante] = await Promise.all([
          getTeamById(partido.equipoLocal.id),
          getTeamById(partido.equipoVisitante.id),
        ]);
        setJugadoresLocal(local.jugadores ?? []);
        setJugadoresVisitante(visitante.jugadores ?? []);
      } catch {
        // Si falla, seguimos sin lista de jugadores
      } finally {
        setLoadingPlayers(false);
      }
    })();
  }, [partido?.id]);

  // ─── Cronómetro ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!partido) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (partido.cronometroIniciadoEn) {
      const startedAt = new Date(partido.cronometroIniciadoEn).getTime();
      const update = () => {
        const diff = Date.now() - startedAt;
        setDisplayMinutes(partido.minutosJugados + Math.floor(diff / 60000));
      };
      update();
      intervalRef.current = setInterval(update, 10000);
    } else {
      setDisplayMinutes(partido.minutosJugados);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [partido]);

  // ─── Estadísticas calculadas ─────────────────────────────────────────
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

  // Eventos agrupados por tipo
  const groupedEvents = useMemo(() => {
    if (!partido?.eventos || partido.eventos.length === 0) return null;
    const goles = partido.eventos.filter((e) => e.tipo === 'GOL');
    const tarjetas = partido.eventos.filter((e) => e.tipo === 'TARJETA_AMARILLA' || e.tipo === 'TARJETA_ROJA');
    const otros = partido.eventos.filter((e) => e.tipo !== 'GOL' && e.tipo !== 'TARJETA_AMARILLA' && e.tipo !== 'TARJETA_ROJA');
    return { goles, tarjetas, otros };
  }, [partido]);

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading || !partido) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  }

  const isAdmin = torneo?.rolUsuario === 'ORGANIZADOR' || torneo?.rolUsuario === 'STAFF';
  const isLive = partido.faseJuego === 'PRIMER_TIEMPO' || partido.faseJuego === 'SEGUNDO_TIEMPO';
  const faseBadge = getFaseBadgeStyle(partido.faseJuego);

  // ─── Acciones de control ─────────────────────────────────────────────
  const doControlAction = (
    action: MatchControlAction,
    msg: string,
    golesPenalesLocal?: number,
    golesPenalesVisitante?: number,
  ) =>
    showConfirm('Confirmar', msg, async () => {
      setActionLoading(true);
      try {
        await controlLiveMatch(partido.id, action, golesPenalesLocal, golesPenalesVisitante);
        await fetchAll();
      } catch (e: any) {
        showError('Error', e.message ?? 'No se pudo realizar la acción');
      } finally {
        setActionLoading(false);
      }
    });

  const submitEndMatchWithPenalties = async () => {
    const pl = parseInt(penLocal, 10) || 0;
    const pv = parseInt(penVisitante, 10) || 0;
    if (pl === pv) {
      showError('Error', 'Los penales no pueden terminar en empate. Debe haber un ganador.');
      return;
    }
    setPenalesModalVisible(false);
    setActionLoading(true);
    try {
      await controlLiveMatch(partido.id, 'END_MATCH', pl, pv);
      await fetchAll();
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo finalizar el partido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleControlActionPress = (action: MatchControlAction) => {
    const halfLimit = getHalfLimit();
    let msg = '';

    if (action === 'START_FIRST_HALF') {
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
    } else if (action === 'END_MATCH') {
      const requiredMinutes = partido.faseJuego === 'PRIMER_TIEMPO' ? halfLimit : halfLimit * 2;
      const isCopa = torneo?.formato === 'COPA' || torneo?.formato === 'ELIMINATORIA';
      const isEmpate = partido.golesLocal === partido.golesVisitante;

      const finishAction = () => {
        if (isCopa && isEmpate) {
          setPenLocal('0');
          setPenVisitante('0');
          setPenalesModalVisible(true);
        } else {
          doControlAction(action, '¿Finalizar el partido?');
        }
      };

      if (displayMinutes < requiredMinutes) {
        showConfirm(
          'Confirmar',
          `¡Advertencia! Aún no se han jugado los ${requiredMinutes} minutos reglamentarios. ¿Deseas finalizar el partido antes de tiempo?`,
          finishAction
        );
      } else {
        finishAction();
      }
    }
  };

  // ─── Flujo de eventos ─────────────────────────────────────────────────
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

  const submitEvent = async (equipoId: string, jugadorId?: string) => {
    if (!selectedEvent) return;
    closeModal();
    setActionLoading(true);
    try {
      await addMatchEvent(partido.id, {
        tipo: selectedEvent.tipo,
        equipoId,
        jugadorId,
        minuto: displayMinutes,
      });
      await fetchMatch();
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

  // ─── Render de evento en la lista agrupada ───────────────────────────
  const renderEventRow = (ev: EventoPartido) => {
    const isLocal = ev.equipoId === partido.equipoLocal.id;
    const { icon, iconColor, iconBg } = getEventIcon(ev.tipo);

    return (
      <View key={ev.id} style={styles.eventRow}>
        {/* Columna izquierda — jugador local */}
        <View style={[styles.eventCol, styles.eventColLeft]}>
          {isLocal && (
            <>
              <Text style={styles.eventPlayerName} numberOfLines={1}>
                {ev.jugador ? ev.jugador.nombre : partido.equipoLocal.nombre}
              </Text>
            </>
          )}
        </View>

        {/* Centro — minuto + ícono */}
        <View style={styles.eventCenter}>
          <Text style={styles.eventMinute}>{ev.minuto}'</Text>
          <View style={[styles.eventIconDot, { backgroundColor: iconBg }]}>
            <MatchEventIcon tipo={ev.tipo} size={12} color={iconColor} />
          </View>
        </View>

        {/* Columna derecha — jugador visitante */}
        <View style={[styles.eventCol, styles.eventColRight]}>
          {!isLocal && (
            <Text style={styles.eventPlayerName} numberOfLines={1}>
              {ev.jugador ? ev.jugador.nombre : partido.equipoVisitante.nombre}
            </Text>
          )}
        </View>

        {/* Botón borrar (solo admin) */}
        {isAdmin && (
          <TouchableOpacity onPress={() => deleteEvent(ev)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.eventDeleteBtn}>
            <Feather name="trash-2" size={13} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* ── Header Scoreboard ── */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Fase badge */}
        <View style={{ alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
          <View style={[styles.faseBadge, { backgroundColor: faseBadge.bg, marginBottom: 0, marginTop: 0 }]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={[styles.faseText, { color: faseBadge.text }]}>
              {formatFase(partido.faseJuego)}
            </Text>
          </View>
          {getFormattedTime() ? (
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 6 }}>
              {getFormattedTime()}
            </Text>
          ) : null}
        </View>

        {/* Teams + Score */}
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

        {/* Fase info */}
        <Text style={styles.faseSubtitle}>{partido.fase || 'Fase de grupos'}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* ── Panel de Control (solo admin) ── */}
        {isAdmin && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control del partido</Text>

            {/* Botones de fase */}
            <View style={styles.ctrlRow}>
              {partido.faseJuego === 'PREVIA' && (
                <CtrlBtn icon="play-circle" label="Iniciar 1er Tiempo" color="#0D7A3E"
                  onPress={() => handleControlActionPress('START_FIRST_HALF')} />
              )}
              {partido.faseJuego === 'PRIMER_TIEMPO' && (
                <>
                  <CtrlBtn icon="pause-circle" label="Medio Tiempo" color="#F59E0B"
                    onPress={() => handleControlActionPress('PAUSE_HALF_TIME')} />
                  <CtrlBtn icon="x-circle" label="Finalizar" color="#EF4444"
                    onPress={() => handleControlActionPress('END_MATCH')} />
                </>
              )}
              {partido.faseJuego === 'MEDIO_TIEMPO' && (
                <CtrlBtn icon="play-circle" label="Iniciar 2do Tiempo" color="#0D7A3E"
                  onPress={() => handleControlActionPress('START_SECOND_HALF')} />
              )}
              {partido.faseJuego === 'SEGUNDO_TIEMPO' && (
                <CtrlBtn icon="x-circle" label="Finalizar Partido" color="#EF4444"
                  onPress={() => handleControlActionPress('END_MATCH')} />
              )}
            </View>

            {/* Botones de eventos */}
            {isLive && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionSubtitle}>Registrar evento</Text>
                <View style={styles.eventGrid}>
                  {EVENT_CONFIGS.map((ev) => (
                    <TouchableOpacity
                      key={ev.tipo}
                      style={[styles.eventBtn, { backgroundColor: ev.bgColor, borderColor: ev.borderColor }]}
                      onPress={() => openEventFlow(ev)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.eventIconCircle, { backgroundColor: ev.iconBg }]}>
                        <MatchEventIcon tipo={ev.tipo} size={18} color={ev.iconColor} />
                      </View>
                      <Text style={[styles.eventLabel, { color: ev.textColor }]}>{ev.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Eventos agrupados por tipo (visible para todos) ── */}
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
              {/* ── GOLES ── */}
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

              {/* ── TARJETAS ── */}
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

              {/* ── OTROS (faltas, corners) ── */}
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

        {/* ── Estadísticas del Partido ── */}
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

      {/* ── MODAL DE EVENTO ── */}
      <Modal visible={modalStep !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />

            {/* ── Paso: Seleccionar Equipo ── */}
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
                  <TouchableOpacity style={styles.teamPickCard} onPress={() => selectEquipo(partido.equipoLocal.id)} activeOpacity={0.8}>
                    <TeamBadgeLarge nombre={partido.equipoLocal.nombre} escudo={partido.equipoLocal.escudo} />
                    <Text style={styles.teamPickLabel}>{partido.equipoLocal.nombre}</Text>
                    <View style={styles.teamPickTag}><Text style={styles.teamPickTagText}>Local</Text></View>
                  </TouchableOpacity>

                  <View style={styles.vsColumn}><Text style={styles.vsText}>VS</Text></View>

                  <TouchableOpacity style={styles.teamPickCard} onPress={() => selectEquipo(partido.equipoVisitante.id)} activeOpacity={0.8}>
                    <TeamBadgeLarge nombre={partido.equipoVisitante.nombre} escudo={partido.equipoVisitante.escudo} />
                    <Text style={styles.teamPickLabel}>{partido.equipoVisitante.nombre}</Text>
                    <View style={[styles.teamPickTag, styles.teamPickTagVisit]}><Text style={[styles.teamPickTagText, { color: '#1D4ED8' }]}>Visitante</Text></View>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Paso: Seleccionar Jugador ── */}
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
                  <TouchableOpacity style={styles.playerRow} onPress={() => submitEvent(selectedEquipoId)}>
                    <View style={styles.playerAvatar}>
                      <Feather name="users" size={18} color="#6B7280" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>Sin jugador específico</Text>
                      <Text style={styles.playerEmail}>Registrar solo al equipo</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {loadingPlayers ? (
                    <ActivityIndicator color="#0D7A3E" style={{ marginVertical: 20 }} />
                  ) : jugadoresEquipoSeleccionado.length === 0 ? (
                    <Text style={styles.noPlayersText}>No hay jugadores registrados</Text>
                  ) : (
                    jugadoresEquipoSeleccionado.map((j) => (
                      <TouchableOpacity key={j.id} style={styles.playerRow} onPress={() => submitEvent(selectedEquipoId, j.id)} activeOpacity={0.7}>
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

      {/* ── MODAL DE PENALES ── */}
      <Modal visible={penalesModalVisible} transparent animationType="slide" onRequestClose={() => setPenalesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#FEF0DC' }]}>
                <MaterialCommunityIcons name="soccer" size={22} color="#F5820D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Definición por Penales</Text>
                <Text style={styles.modalSubtitle}>El partido terminó en empate. Registra los penales.</Text>
              </View>
              <TouchableOpacity onPress={() => setPenalesModalVisible(false)}>
                <Feather name="x" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 20 }}>
              <View style={{ alignItems: 'center', width: '40%' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 }} numberOfLines={1}>
                  {partido.equipoLocal.nombre}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setPenLocal(prev => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)))}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Feather name="minus" size={18} color="#374151" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', width: 40, textAlign: 'center' }}>
                    {penLocal || '0'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setPenLocal(prev => String((parseInt(prev, 10) || 0) + 1))}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBF0EC', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Feather name="plus" size={18} color="#0D7A3E" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: '800', color: '#9CA3AF' }}>vs</Text>

              <View style={{ alignItems: 'center', width: '40%' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 }} numberOfLines={1}>
                  {partido.equipoVisitante.nombre}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setPenVisitante(prev => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)))}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Feather name="minus" size={18} color="#374151" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', width: 40, textAlign: 'center' }}>
                    {penVisitante || '0'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setPenVisitante(prev => String((parseInt(prev, 10) || 0) + 1))}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBF0EC', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Feather name="plus" size={18} color="#0D7A3E" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={submitEndMatchWithPenalties}
              style={{ backgroundColor: '#0D7A3E', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 10 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Confirmar y Finalizar Partido</Text>
            </TouchableOpacity>
          </View>
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
      {escudo ? (
        <Image source={{ uri: escudo }} style={styles.escudoSm} />
      ) : (
        <View style={styles.escudoSmFallback}>
          <Text style={styles.escudoSmText}>{nombre.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.teamName} numberOfLines={2}>{nombre}</Text>
    </View>
  );
}

function TeamBadgeLarge({ nombre, escudo }: { nombre: string; escudo: string | null }) {
  return escudo ? (
    <Image source={{ uri: escudo }} style={styles.escudoLg} />
  ) : (
    <View style={styles.escudoLgFallback}>
      <Text style={styles.escudoLgText}>{nombre.charAt(0)}</Text>
    </View>
  );
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
});
