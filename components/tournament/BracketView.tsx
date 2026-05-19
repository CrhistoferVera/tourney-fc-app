import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RondaFixture } from '../../services/fixtureService';

// ── Layout constants ──────────────────────────────────────────────────────────
const MATCH_H = 72;
const INITIAL_SLOT = MATCH_H + 16;
const COL_W = 138;
const COL_GAP = 30;
const HEADER_H = 54; // extra height to fit the schedule button below the label
const LINE_COLOR = '#C4CFC8';

// ── Math helpers ──────────────────────────────────────────────────────────────
function slotH(roundIdx: number) {
  return INITIAL_SLOT * Math.pow(2, roundIdx);
}
function matchTop(roundIdx: number, matchIdx: number) {
  const s = slotH(roundIdx);
  return HEADER_H + matchIdx * s + (s - MATCH_H) / 2;
}
function matchCenterY(roundIdx: number, matchIdx: number) {
  return matchTop(roundIdx, matchIdx) + MATCH_H / 2;
}
function colLeft(roundIdx: number) {
  return roundIdx * (COL_W + COL_GAP);
}
function roundLabel(roundIdx: number, totalRounds: number) {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Cuartos';
  if (fromEnd === 3) return 'Octavos';
  return `Ronda ${roundIdx + 1}`;
}

// ── Team row inside bracket slot ─────────────────────────────────────────────
interface TeamRowProps {
  nombre: string;
  escudo: string | null;
  score: number | null | undefined;
  tbd: boolean;
  border?: boolean;
}

function TeamRow({ nombre, escudo, score, tbd, border }: TeamRowProps) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderBottomWidth: border ? 0.5 : 0,
        borderBottomColor: '#EBF0EC',
        gap: 5,
      }}
    >
      {tbd ? (
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F3F4F6' }} />
      ) : escudo ? (
        <Image source={{ uri: escudo }} style={{ width: 20, height: 20 }} resizeMode="contain" />
      ) : (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#EBF0EC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#0D7A3E' }}>
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: 10,
          color: tbd ? '#9CA3AF' : '#0F1A14',
          fontStyle: tbd ? 'italic' : 'normal',
        }}
      >
        {nombre}
      </Text>
      {!tbd && score !== null && score !== undefined && (
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0D7A3E' }}>{score}</Text>
      )}
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
type ScheduleMode = 'programar' | 'editar';

interface BracketViewProps {
  rondas: RondaFixture[];
  maxEquipos: number;
  isOrganizador?: boolean;
  estadoTorneo?: string;
  onScheduleRound?: (rondaNum: number, label: string, mode: ScheduleMode) => void;
}

// ── Returns button type for a bracket round ───────────────────────────────────
function getRondaButtonType(
  r: number,
  rondas: RondaFixture[],
  estadoTorneo: string | undefined,
): ScheduleMode | null {
  if (estadoTorneo !== 'EN_CURSO') return null;
  const realRonda = rondas.find((ro) => ro.ronda === r + 1);
  if (!realRonda || realRonda.partidos.length === 0) return null;
  const allScheduled = realRonda.partidos.every((p) => p.fecha !== null);
  if (allScheduled) return 'editar';
  if (r === 0) return 'programar';
  const prevReal = rondas.find((ro) => ro.ronda === r);
  return !prevReal || prevReal.partidos.every((p) => p.fecha !== null) ? 'programar' : null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BracketView({
  rondas,
  maxEquipos,
  isOrganizador,
  estadoTorneo,
  onScheduleRound,
}: BracketViewProps) {
  const safe = Math.max(maxEquipos, 2);
  const totalRounds = Math.ceil(Math.log2(safe));
  const firstRoundMatches = Math.ceil(safe / 2);

  const containerH = slotH(0) * firstRoundMatches + HEADER_H + 24;
  const containerW = totalRounds * (COL_W + COL_GAP) - COL_GAP + 32;

  // ── Build bracket rounds (real + TBD) ──────────────────────────────────────
  const bracketRounds = Array.from({ length: totalRounds }, (_, r) => {
    const matchCount = Math.max(1, Math.ceil(firstRoundMatches / Math.pow(2, r)));
    const realRonda = rondas.find((ro) => ro.ronda === r + 1);
    return {
      label: roundLabel(r, totalRounds),
      rondaNum: r + 1,
      matches: Array.from({ length: matchCount }, (__, m) => {
        const real = realRonda?.partidos[m];
        if (real) {
          return {
            team1: real.equipoLocal.nombre,
            shield1: real.equipoLocal.escudo,
            team2: real.equipoVisitante.nombre,
            shield2: real.equipoVisitante.escudo,
            score1: real.golesLocal,
            score2: real.golesVisitante,
            tbd: false,
          };
        }
        return {
          team1: 'Por definir',
          shield1: null,
          team2: 'Por definir',
          shield2: null,
          score1: null,
          score2: null,
          tbd: true,
        };
      }),
    };
  });

  // ── Build connector lines ─────────────────────────────────────────────────
  const connectors: React.ReactNode[] = [];
  for (let r = 0; r < totalRounds - 1; r++) {
    const matchCount = bracketRounds[r].matches.length;
    const nextMatchCount = bracketRounds[r + 1].matches.length;
    const x = colLeft(r);
    const midX = x + COL_W + COL_GAP / 2;

    for (let m = 0; m < matchCount; m++) {
      connectors.push(
        <View
          key={`hs-${r}-${m}`}
          style={{
            position: 'absolute',
            left: x + COL_W,
            top: matchCenterY(r, m) - 0.5,
            width: COL_GAP / 2,
            height: 1,
            backgroundColor: LINE_COLOR,
          }}
        />,
      );
    }

    for (let nm = 0; nm < nextMatchCount; nm++) {
      const upperCY = matchCenterY(r, nm * 2);
      const lowerCY = matchCenterY(r, nm * 2 + 1);
      const entryCY = matchCenterY(r + 1, nm);

      connectors.push(
        <View
          key={`vb-${r}-${nm}`}
          style={{
            position: 'absolute',
            left: midX - 0.5,
            top: Math.min(upperCY, lowerCY),
            width: 1,
            height: Math.abs(lowerCY - upperCY),
            backgroundColor: LINE_COLOR,
          }}
        />,
      );
      connectors.push(
        <View
          key={`he-${r}-${nm}`}
          style={{
            position: 'absolute',
            left: midX,
            top: entryCY - 0.5,
            width: COL_GAP / 2,
            height: 1,
            backgroundColor: LINE_COLOR,
          }}
        />,
      );
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
    >
      <View style={{ width: containerW, height: containerH, position: 'relative' }}>
        {connectors}

        {bracketRounds.map((round, r) => {
          const x = colLeft(r);
          const btnType = isOrganizador
            ? getRondaButtonType(r, rondas, estadoTorneo)
            : null;

          return (
            <View key={r}>
              {/* Round label */}
              <Text
                style={{
                  position: 'absolute',
                  left: x,
                  top: 0,
                  width: COL_W,
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#0D7A3E',
                  letterSpacing: 0.5,
                }}
              >
                {round.label.toUpperCase()}
              </Text>

              {/* Schedule / Edit button below each round label */}
              {btnType !== null && onScheduleRound && (
                <TouchableOpacity
                  onPress={() => onScheduleRound(round.rondaNum, round.label, btnType)}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 16,
                    width: COL_W,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: '#EBF5EF',
                    borderRadius: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Feather
                    name={btnType === 'editar' ? 'edit-2' : 'clock'}
                    size={10}
                    color="#0D7A3E"
                  />
                  <Text style={{ fontSize: 9, fontWeight: '600', color: '#0D7A3E' }}>
                    {btnType === 'editar' ? 'Editar horarios' : 'Programar horarios'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Match cards */}
              {round.matches.map((match, m) => {
                const top = matchTop(r, m);
                return (
                  <View
                    key={m}
                    style={{
                      position: 'absolute',
                      left: x,
                      top,
                      width: COL_W,
                      height: MATCH_H,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      overflow: 'hidden',
                      elevation: match.tbd ? 0 : 2,
                      shadowColor: '#0F1A14',
                      shadowOpacity: match.tbd ? 0 : 0.07,
                      shadowRadius: 4,
                      borderWidth: match.tbd ? 1 : 0,
                      borderColor: '#E8EDEA',
                      borderStyle: 'dashed',
                    }}
                  >
                    <TeamRow
                      nombre={match.team1}
                      escudo={match.shield1}
                      score={match.score1}
                      tbd={match.tbd}
                      border
                    />
                    <TeamRow
                      nombre={match.team2}
                      escudo={match.shield2}
                      score={match.score2}
                      tbd={match.tbd}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
