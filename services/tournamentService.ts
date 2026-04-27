import { api } from './api';

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
  createdAt: string;
  rolUsuario?: string; 
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
}

export const getMyTournaments = async (): Promise<Tournament[]> => {
  const response = await api.get('/tournaments/my');
  return response.data;
};

export const getPublicTournaments = async (params?: {
  nombre?: string;
  zona?: string;
}): Promise<Tournament[]> => {
  const response = await api.getWithParams('/tournaments', params);
  return response.data;
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const response = await api.get(`/tournaments/${id}`);
  return response.data;
};

export const createTournament = async (
  dto: CreateTournamentDto,
): Promise<Tournament> => {
  const response = await api.post('/tournaments', dto);
  return response.data;
};

export const updateTournament = async (
  id: string,
  dto: Partial<CreateTournamentDto>,
): Promise<Tournament> => {
  const response = await api.patch(`/tournaments/${id}`, dto);
  return response.data;
};

export const publishTournament = async (id: string): Promise<Tournament> => {
  const response = await api.patch(`/tournaments/${id}/publish`, {});
  return response.data;
};

/** Eliminar torneo */
export const deleteTournament = async (id: string): Promise<void> => {
  await api.delete(`/tournaments/${id}`);
};