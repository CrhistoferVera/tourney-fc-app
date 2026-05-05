import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface Jugador {
  id: string;
  nombre: string;
  fotoPerfil: string | null;
}

export interface Team {
  id: string;
  nombre: string;
  escudo: string | null;
  telefonoCapitan: string | null;
  cantidadJugadores: number;
  jugadores: Jugador[];
  createdAt: string;
}

export interface CreateTeamDto {
  nombre: string;
  escudo?: string;
  telefonoCapitan?: string;
  cantidadJugadores?: number;
}

const getToken = () => useAuthStore.getState().token ?? undefined;

export const getTeamsByTournament = async (torneoId: string): Promise<Team[]> => {
  return api.get(`/teams/tournament/${torneoId}`, getToken());
};

export const getTeamById = async (id: string): Promise<Team> => {
  return api.get(`/teams/${id}`, getToken());
};

export const createTeam = async (torneoId: string, dto: CreateTeamDto): Promise<Team> => {
  return api.post(`/teams/tournament/${torneoId}`, dto, getToken());
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`, getToken());
};

export const joinTeam = async (equipoId: string): Promise<void> => {
  await api.post(`/teams/${equipoId}/join`, {}, getToken());
};