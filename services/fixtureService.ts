import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface PartidoEquipo {
  id: string;
  nombre: string;
  escudo: string | null;
}

export interface Campo {
  id: string;
  nombre: string;
  direccion: string | null;
}

export type FaseJuego = 'PREVIA' | 'PRIMER_TIEMPO' | 'MEDIO_TIEMPO' | 'SEGUNDO_TIEMPO' | 'PENALES' | 'FINALIZADO';
export type TipoEvento = 'GOL' | 'ASISTENCIA' | 'TARJETA_AMARILLA' | 'TARJETA_ROJA' | 'CAMBIO' | 'FALTA' | 'CORNER' | 'PENAL_FALLADO';

export interface EventoPartido {
  id: string;
  tipo: TipoEvento;
  minuto: number | null;
  detalle: string | null;
  equipoId: string;
  equipo?: PartidoEquipo;
  jugadorId: string | null;
  jugador?: { id: string; nombre: string } | null;
  createdAt: string;
}

export interface Partido {
  id: string;
  torneoId: string;
  estado: string;
  faseJuego: FaseJuego;
  minutosJugados: number;
  cronometroIniciadoEn: string | null;
  finalizadoEn?: string | null;
  updatedAt: string;
  fecha: string | null;
  ronda: number | null;
  fase: string | null;
  golesLocal: number | null;
  golesVisitante: number | null;
  golesPenalesLocal?: number | null;
  golesPenalesVisitante?: number | null;
  equipoLocal: PartidoEquipo;
  equipoVisitante: PartidoEquipo;
  campo: Campo | null;
  eventos?: EventoPartido[];
  ganadorTorneo?: { nombre: string; escudo: string | null } | null;
}

export interface RondaFixture {
  ronda: number;
  label: string;
  partidos: Partido[];
}

const getToken = () => useAuthStore.getState().token ?? undefined;

export const generateFixture = async (torneoId: string): Promise<RondaFixture[]> => {
  return api.post(`/fixtures/tournament/${torneoId}/generate`, {}, getToken());
};

export const getFixture = async (torneoId: string): Promise<RondaFixture[]> => {
  return api.get(`/fixtures/tournament/${torneoId}`, getToken());
};

export const getFixtureByEquipo = async (
  torneoId: string,
  equipoId: string,
): Promise<Partido[]> => {
  return api.get(`/fixtures/tournament/${torneoId}/equipo/${equipoId}`, getToken());
};

export const getMatchById = async (id: string): Promise<Partido> => {
  return api.get(`/matches/${id}`, getToken());
};

export const MatchControlActionValues = {
  START_FIRST_HALF: 'START_FIRST_HALF',
  PAUSE_HALF_TIME: 'PAUSE_HALF_TIME',
  START_SECOND_HALF: 'START_SECOND_HALF',
  START_PENALTIES: 'START_PENALTIES',
  END_MATCH: 'END_MATCH',
} as const;

export type MatchControlAction = keyof typeof MatchControlActionValues;

export const controlLiveMatch = async (
  id: string,
  action: MatchControlAction,
  golesPenalesLocal?: number,
  golesPenalesVisitante?: number,
): Promise<Partido> => {
  return api.patch(
    `/matches/${id}/control`,
    { action, golesPenalesLocal, golesPenalesVisitante },
    getToken(),
  );
};

export const addMatchEvent = async (
  id: string,
  payload: { tipo: TipoEvento; equipoId: string; jugadorId?: string; minuto?: number; detalle?: string; asistenciaJugadorId?: string }
): Promise<EventoPartido> => {
  return api.post(`/matches/${id}/events`, payload, getToken());
};

export const deleteMatchEvent = async (id: string, eventId: string): Promise<void> => {
  return api.delete(`/matches/${id}/events/${eventId}`, getToken());
};

export interface FilaTablaPosiciones {
  posicion: number;
  equipo: PartidoEquipo;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface TablaPosicionesResponse {
  torneoId: string;
  torneoNombre: string;
  formato: string;
  criteriosDesempate?: string[];
  tabla: FilaTablaPosiciones[];
}

export const getStandings = async (torneoId: string): Promise<TablaPosicionesResponse> => {
  return api.get(`/fixtures/tournament/${torneoId}/standings`, getToken());
};
