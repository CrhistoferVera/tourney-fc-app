import { api } from './api';
import { useAuthStore } from '../store/authStore';

export type TournamentFormat = 'LIGA' | 'COPA' | 'GRUPOS' | 'ELIMINATORIA';
export type TournamentStatus = 'BORRADOR' | 'EN_INSCRIPCION' | 'EN_CURSO' | 'FINALIZADO';
export type TournamentModality = 'FUTBOL_5' | 'FUTBOL_7' | 'FUTBOL_11';

export interface Campo {
  nombre: string;
  direccion: string;
}

export interface CampoDetalle {
  id: string;
  nombre: string;
  direccion: string | null;
}

export interface Tournament {
  id: string;
  nombre: string;
  descripcion: string;
  formato: TournamentFormat;
  modalidad?: TournamentModality;
  maxEquipos: number;
  maxJugadoresPorEquipo?: number;
  estado: TournamentStatus;
  fechaInicio: string;
  fechaFin: string;
  zona: string;
  imagen?: string;
  createdAt: string;
  rolUsuario?: string;
  equiposInscritos?: number;
  equiposAprobados?: number;
  totalPartidos?: number;
  tieneSolicitudPendiente?: boolean;
}

export interface CreateTournamentDto {
  nombre: string;
  descripcion: string;
  formato: TournamentFormat;
  modalidad?: TournamentModality;
  maxEquipos: number;
  maxJugadoresPorEquipo?: number;
  fechaInicio: string;
  fechaFin: string;
  zona: string;
  campos: Campo[];
  imagen?: string;
}

const getToken = () => useAuthStore.getState().token;

export const getMyTournaments = async (): Promise<Tournament[]> => {
  const token = getToken();
  const response = await api.get('/tournaments/my', token ?? undefined);
  return response;
};

export const getPublicTournaments = async (params?: {
  nombre?: string;
  zona?: string;
}): Promise<Tournament[]> => {
  const token = getToken();
  const response = await api.getWithParams('/tournaments', params, token ?? undefined);
  return response;
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const token = getToken();
  const response = await api.get(`/tournaments/${id}`, token ?? undefined);
  return response;
};

export const createTournament = async (dto: CreateTournamentDto): Promise<Tournament> => {
  const token = getToken();
  const response = await api.post('/tournaments', dto, token ?? undefined);
  return response;
};

export const updateTournament = async (
  id: string,
  dto: Partial<CreateTournamentDto>,
): Promise<Tournament> => {
  const token = getToken();
  const response = await api.patch(`/tournaments/${id}`, dto, token ?? undefined);
  return response;
};

export const publishTournament = async (id: string): Promise<Tournament> => {
  const token = getToken();
  const response = await api.patch(`/tournaments/${id}/publish`, {}, token ?? undefined);
  return response;
};

export const deleteTournament = async (id: string): Promise<void> => {
  const token = getToken();
  await api.delete(`/tournaments/${id}`, token ?? undefined);
};

export const startTournament = async (id: string): Promise<Tournament> => {
  const token = getToken();
  return api.patch(`/tournaments/${id}/start`, {}, token ?? undefined);
};

export const getCamposByTournament = async (torneoId: string): Promise<CampoDetalle[]> => {
  const token = getToken();
  return api.get(`/tournaments/${torneoId}/campos`, token ?? undefined);
};

export interface EntradaLiderato {
  posicion: number;
  jugadorId: string;
  nombre: string;
  fotoPerfil: string | null;
  equipoNombre: string;
  valor: number;
}

export interface ResumenGlobal {
  totalPartidos: number;
  totalGoles: number;
  totalTarjetasAmarillas: number;
  totalTarjetasRojas: number;
  promedioGolesPorPartido: number;
}

export interface EstadisticasPersonales {
  goles: number;
  asistencias: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  penalesFallados: number;
  posicionGoles: number | null;
  posicionAsistencias: number | null;
  posicionAmarillas: number | null;
  posicionRojas: number | null;
  posicionPenalesFallados: number | null;
}

export interface TorneoEstadisticas {
  resumen: ResumenGlobal;
  goleadores: EntradaLiderato[];
  asistentes: EntradaLiderato[];
  amarillas: EntradaLiderato[];
  rojas: EntradaLiderato[];
  penalesFallados: EntradaLiderato[];
  estadisticasPersonales: EstadisticasPersonales | null;
}

export const getTournamentEstadisticas = async (id: string): Promise<TorneoEstadisticas> => {
  const token = getToken();
  return api.get(`/tournaments/${id}/estadisticas`, token ?? undefined);
};

export const uploadTournamentImage = async (uri: string): Promise<{ url: string }> => {
  const token = getToken();
  const formData = new FormData();

  const filename = uri.split('/').pop() || 'tournament_photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri,
    name: filename,
    type,
  } as any);

  return api.postMultipart('/tournaments/upload-image', formData, token ?? undefined);
};
