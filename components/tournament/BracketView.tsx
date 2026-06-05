import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RondaFixture, partidoCopaFinalizado, getRondaScheduleMode, ScheduleMode } from '../../services/fixtureService';

// ── Layout constants ──────────────────────────────────────────────────────────
const MATCH_H = 72;
const INITIAL_SLOT = MATCH_H + 16;
const COL_W = 138;
const COL_GAP = 30;
const HEADER_H = 54; // extra height to fit the schedule button below the label
const LINE_COLOR = '#C4CFC8';

// ── Math helpers ──────────────────────────────────────────────────────────────
// El slot crece exponencialmente: ronda 0 = INITIAL_SLOT, ronda 1 = 2x, ronda 2 = 4x...
// Esto garantiza que los conectores entre rondas queden centrados correctamente.
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

const HIGHLIGHT_BG = '#D1FAE5';

function hasMarcador(
  score1: number | null | undefined,
  score2: number | null | undefined,
): boolean {
  return score1 !== null && score1 !== undefined && score2 !== null && score2 !== undefined;
}

// ── Team row inside bracket slot ─────────────────────────────────────────────
interface TeamRowProps {
  nombre: string;
  escudo: string | null;
  score: number | null | undefined;
  scoreOponente?: number | null;
  penScore?: number | null;
  penScoreOponente?: number | null;
  showScore?: boolean;
  tbd: boolean;
  border?: boolean;
  isMine?: boolean;
  onPress?: () => void;
}

function TeamRow({
  nombre,
  escudo,
  score,
  scoreOponente,
  penScore,
  penScoreOponente,
  showScore = false,
  tbd,
  border,
  isMine,
  onPress,
}: TeamRowProps) {
  const marcador = showScore && hasMarcador(score, scoreOponente);

  const sNum = score ?? 0;
  const sOpNum = scoreOponente ?? 0;
  // Si el partido se definió por penales, los goles de penales son la fuente
  // autoritativa del ganador (el marcador regular queda empatado).
  const hayPenales = penScore != null && penScoreOponente != null;
  let isWinner = marcador && sNum > sOpNum;
  let isLoser = marcador && sNum < sOpNum;
  if (marcador && hayPenales) {
    isWinner = penScore! > penScoreOponente!;
    isLoser = penScore! < penScoreOponente!;
  }

  const content = (
    <>
      {tbd ? (
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F3F4F6' }} />
      ) : escudo ? (
        <Image 
          source={{ uri: escudo }} 
          style={{ width: 20, height: 20, opacity: isLoser ? 0.6 : 1 }} 
          resizeMode="contain" 
        />
      ) : (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#EBF0EC',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLoser ? 0.6 : 1,
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
          color: tbd ? '#9CA3AF' : isWinner ? '#0D7A3E' : isLoser ? '#9CA3AF' : isMine ? '#0D7A3E' : '#0F1A14',
          fontWeight: isWinner ? '700' : isMine ? '600' : '400',
          fontStyle: tbd ? 'italic' : 'normal',
        }}
      >
        {nombre}
      </Text>
      {marcador && (
        <View
          style={{
            minWidth: 22,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: isWinner ? '#D1FAE5' : '#F3F4F6',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: isWinner ? '700' : '400',
              color: isWinner ? '#0D7A3E' : '#6B7280'
            }}
          >
            {score}
            {hayPenales && (
              <Text style={{ fontSize: 9, color: '#6B7280' }}> ({penScore})</Text>
            )}
          </Text>
        </View>
      )}
    </>
  );

  const rowStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    borderBottomWidth: border ? 0.5 : 0,
    borderBottomColor: '#EBF0EC',
    gap: 5,
    backgroundColor: isMine ? HIGHLIGHT_BG : 'transparent',
  };

  if (onPress && !tbd) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={rowStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface BracketViewProps {
  rondas: RondaFixture[];
  maxEquipos: number;
  isOrganizador?: boolean;
  estadoTorneo?: string;
  onScheduleRound?: (rondaNum: number, label: string, mode: ScheduleMode) => void;
  showScheduleControls?: boolean;
  miEquipoId?: string | null;
  onPressTeam?: (teamId: string) => void;
}

function getWinnerOfMatch(match: {
  tbd?: boolean;
  finished?: boolean;
  score1: number | null;
  score2: number | null;
  penLocal?: number | null;
  penVisitante?: number | null;
  team1: string;
  team1Id: string | null;
  shield1: string | null;
  team2: string;
  team2Id: string | null;
  shield2: string | null;
}) {
  if (match.tbd || !match.finished) return null;
  if (match.score1 === null || match.score2 === null) return null;
  const team1 = { nombre: match.team1, id: match.team1Id, escudo: match.shield1 };
  const team2 = { nombre: match.team2, id: match.team2Id, escudo: match.shield2 };
  if (match.score1 > match.score2) return team1;
  if (match.score2 > match.score1) return team2;
  // Empate en tiempo regular → se decide por penales
  if (match.penLocal != null && match.penVisitante != null) {
    if (match.penLocal > match.penVisitante) return team1;
    if (match.penVisitante > match.penLocal) return team2;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BracketView({
  rondas,
  maxEquipos,
  isOrganizador,
  estadoTorneo,
  onScheduleRound,
  showScheduleControls = true,
  miEquipoId = null,
  onPressTeam,
}: BracketViewProps) {
  const ronda1 = rondas.find((r) => r.ronda === 1);
  const partidosR1 = ronda1 ? ronda1.partidos.length : 0;
  const calculatedEquipos = partidosR1 > 0 ? partidosR1 * 2 : maxEquipos;

  const safe = Math.max(calculatedEquipos, 2);
  // totalRounds = log2(equipos): 8 equipos → 3 rondas (cuartos, semi, final)
  const totalRounds = Math.ceil(Math.log2(safe));
  const firstRoundMatches = Math.ceil(safe / 2);

  const containerH = slotH(0) * firstRoundMatches + HEADER_H + 24;
  const containerW = totalRounds * (COL_W + COL_GAP) - COL_GAP + 32;

  // Construye el bracket combinando partidos reales con casillas TBD.
  // Para rondas que aún no existen en la base de datos, se calculan los
  // posibles ganadores desde la ronda anterior para adelantar el cuadro.
  const bracketRounds: any[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const matchCount = Math.max(1, Math.ceil(firstRoundMatches / Math.pow(2, r)));
    const realRonda = rondas.find((ro) => ro.ronda === r + 1);

    const roundMatches = Array.from({ length: matchCount }, (__, m) => {
      const real = realRonda?.partidos[m];

      if (real) {
        const finished = partidoCopaFinalizado(real);
        return {
          team1: real.equipoLocal.nombre,
          team1Id: real.equipoLocal.id,
          shield1: real.equipoLocal.escudo,
          team2: real.equipoVisitante.nombre,
          team2Id: real.equipoVisitante.id,
          shield2: real.equipoVisitante.escudo,
          // Solo mostrar el marcador si el partido está cerrado
          score1: finished ? real.golesLocal : null,
          score2: finished ? real.golesVisitante : null,
          penLocal: real.golesPenalesLocal ?? null,
          penVisitante: real.golesPenalesVisitante ?? null,
          finished,
          tbd: false,
        };
      }

      // Ronda sin partido real: calcular quién podría estar desde los ganadores anteriores
      let computedTeam1 = 'Por definir';
      let computedTeam1Id: string | null = null;
      let computedShield1: string | null = null;
      let computedTeam2 = 'Por definir';
      let computedTeam2Id: string | null = null;
      let computedShield2: string | null = null;
      let isTbd = true;

      if (r > 0) {
        const prevRound = bracketRounds[r - 1];

        const parentMatch1 = prevRound.matches[m * 2];
        const winner1 = parentMatch1 ? getWinnerOfMatch(parentMatch1) : null;
        if (winner1) {
          computedTeam1 = winner1.nombre;
          computedTeam1Id = winner1.id;
          computedShield1 = winner1.escudo;
        }

        const parentMatch2 = prevRound.matches[m * 2 + 1];
        const winner2 = parentMatch2 ? getWinnerOfMatch(parentMatch2) : null;
        if (winner2) {
          computedTeam2 = winner2.nombre;
          computedTeam2Id = winner2.id;
          computedShield2 = winner2.escudo;
        }

        isTbd = !winner1 || !winner2;
      }

      return {
        team1: computedTeam1,
        team1Id: computedTeam1Id,
        shield1: computedShield1,
        team2: computedTeam2,
        team2Id: computedTeam2Id,
        shield2: computedShield2,
        score1: null,
        score2: null,
        penLocal: null,
        penVisitante: null,
        finished: false,
        tbd: isTbd,
      };
    });

    bracketRounds.push({
      label: roundLabel(r, totalRounds),
      rondaNum: r + 1,
      matches: roundMatches,
    });
  }

  // Construye las líneas SVG-like (Views absolutas) que conectan partidos entre rondas.
  // Cada partido de la ronda r conecta con su partido padre en la ronda r+1 mediante
  // una línea horizontal saliente, una vertical que une los dos partidos del par,
  // y una línea horizontal entrante al partido padre.
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
          const btnType =
            showScheduleControls && isOrganizador
              ? getRondaScheduleMode(round.rondaNum, rondas, estadoTorneo)
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
              {round.matches.map((match: any, m: number) => {
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
                      scoreOponente={match.score2}
                      penScore={match.penLocal}
                      penScoreOponente={match.penVisitante}
                      showScore={match.finished}
                      tbd={match.team1 === 'Por definir'}
                      border
                      isMine={match.team1 !== 'Por definir' && miEquipoId === match.team1Id}
                      onPress={
                        onPressTeam && match.team1Id
                          ? () => onPressTeam(match.team1Id!)
                          : undefined
                      }
                    />
                    <TeamRow
                      nombre={match.team2}
                      escudo={match.shield2}
                      score={match.score2}
                      scoreOponente={match.score1}
                      penScore={match.penVisitante}
                      penScoreOponente={match.penLocal}
                      showScore={match.finished}
                      tbd={match.team2 === 'Por definir'}
                      isMine={match.team2 !== 'Por definir' && miEquipoId === match.team2Id}
                      onPress={
                        onPressTeam && match.team2Id
                          ? () => onPressTeam(match.team2Id!)
                          : undefined
                      }
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
