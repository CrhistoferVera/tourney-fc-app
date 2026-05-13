import { api } from './api';
import { useAuthStore } from '../store/authStore';

export type TournamentFormat = 'LIGA' | 'COPA' | 'GRUPOS' | 'ELIMINATORIA';
export type TournamentStatus = 'BORRADOR' | 'EN_INSCRIPCION' | 'EN_CURSO' | 'FINALIZADO';

export interface Campo {
  nombre: string;
  direccion: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  descripcion: string;
  formato: TournamentFormat;
  maxEquipos: number;
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
  maxEquipos: number;
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
