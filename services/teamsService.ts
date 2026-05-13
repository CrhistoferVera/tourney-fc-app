import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface Jugador {
  id: string;
  nombre: string;
  fotoPerfil: string | null;
  email?: string;
}

export interface PlayerInvitacion {
  id: string;
  email: string;
  createdAt: string;
}

export interface UsuarioEquipoRow {
  id: string;
  usuarioId: string;
  equipoId: string;
  createdAt: string;
  usuario: Jugador;
}

export interface MyTeam {
  id: string;
  nombre: string;
  escudo: string | null;
  telefonoCapitan: string | null;
  cantidadJugadores: number | null;
  jugadores: UsuarioEquipoRow[];
  invitaciones: PlayerInvitacion[];
  capitanId: string | null;
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

export const uploadEscudo = async (formData: FormData): Promise<{ url: string }> => {
  return api.postMultipart('/teams/upload-escudo', formData, getToken());
};

export const getMyTeam = async (torneoId: string): Promise<MyTeam> => {
  return api.get(`/teams/tournament/${torneoId}/my-team`, getToken());
};

export const invitePlayer = async (teamId: string, email: string): Promise<{ mensaje: string }> => {
  return api.post(`/teams/${teamId}/invite-player`, { email }, getToken());
};
