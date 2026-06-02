import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Partido, EventoPartido, PartidoEquipo } from '../../services/fixtureService';
import ShieldDisplay from './ShieldDisplay';

const GREEN = '#0D7A3E'; // gol convertido
const RED = '#E53935'; // penal fallado
const PENDING_BORDER = '#CBD5D1'; // ranura pendiente

type Resultado = 'GOL' | 'FALLO';

// Un tiro de tanda se identifica de forma fiable por detalle === 'PENAL'.
const isShootoutEvent = (ev: EventoPartido) => ev.detalle === 'PENAL';

function getTeamKicks(partido: Partido, equipoId: string): Resultado[] {
  return (partido.eventos ?? [])
    .filter((ev) => isShootoutEvent(ev) && ev.equipoId === equipoId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((ev) => (ev.tipo === 'GOL' ? 'GOL' : 'FALLO'));
}

/** Círculo individual con animación de entrada (escala + opacidad) al aparecer. */
function PenaltyCircle({ resultado }: { resultado: Resultado | null }) {
  const anim = useRef(new Animated.Value(resultado ? 0 : 1)).current;

  useEffect(() => {
    if (resultado) {
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [resultado, anim]);

  const filled = resultado === 'GOL' ? GREEN : resultado === 'FALLO' ? RED : 'transparent';

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          backgroundColor: filled,
          borderColor: resultado ? filled : PENDING_BORDER,
          transform: [{ scale: anim }],
        },
      ]}
    />
  );
}

/** Punto pulsante que indica de qué equipo es el turno. */
function TurnDot() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View style={[styles.turnDot, { opacity: pulse }]} />;
}

function TeamRow({
  equipo,
  kicks,
  goles,
  slots,
  isTurn,
}: {
  equipo: PartidoEquipo;
  kicks: Resultado[];
  goles: number;
  slots: number;
  isTurn: boolean;
}) {
  return (
    <View style={[styles.row, isTurn && styles.rowActive]}>
      <View style={styles.teamCol}>
        {isTurn && <TurnDot />}
        <ShieldDisplay escudo={equipo.escudo} size={26} />
        <Text style={styles.teamName} numberOfLines={1}>
          {equipo.nombre}
        </Text>
      </View>

      <View style={styles.circlesCol}>
        {Array.from({ length: slots }).map((_, i) => (
          <PenaltyCircle key={i} resultado={i < kicks.length ? kicks[i] : null} />
        ))}
      </View>

      <Text style={styles.score}>{goles}</Text>
    </View>
  );
}

interface Props {
  readonly partido: Partido;
  readonly nextTeamId?: string | null;
}

export default function PenaltyShootoutTracker({ partido, nextTeamId }: Props) {
  const localKicks = getTeamKicks(partido, partido.equipoLocal.id);
  const visitanteKicks = getTeamKicks(partido, partido.equipoVisitante.id);

  const golesLocal = localKicks.filter((r) => r === 'GOL').length;
  const golesVisitante = visitanteKicks.filter((r) => r === 'GOL').length;

  // Al menos 5 ranuras; en muerte súbita se expande a los tiros realizados.
  const slots = Math.max(5, localKicks.length, visitanteKicks.length);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>TANDA DE PENALES</Text>

      <TeamRow
        equipo={partido.equipoLocal}
        kicks={localKicks}
        goles={golesLocal}
        slots={slots}
        isTurn={nextTeamId === partido.equipoLocal.id}
      />
      <TeamRow
        equipo={partido.equipoVisitante}
        kicks={visitanteKicks}
        goles={golesVisitante}
        slots={slots}
        isTurn={nextTeamId === partido.equipoVisitante.id}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
          <Text style={styles.legendText}>Gol</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: RED }]} />
          <Text style={styles.legendText}>Fallo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendPending]} />
          <Text style={styles.legendText}>Pendiente</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBF0EC',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#3D4F44',
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: '#D4F5E2',
  },
  teamCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  teamName: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F1A14',
    flexShrink: 1,
  },
  turnDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0D7A3E',
    marginRight: 4,
  },
  circlesCol: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  score: {
    width: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F1A14',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendPending: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: PENDING_BORDER,
  },
  legendText: {
    fontSize: 11,
    color: '#3D4F44',
  },
});
