import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface EstadisticasTorneo {
  goles: number;
  asistencias: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
}

export interface Jugador {
  id: string;
  nombre: string;
  fotoPerfil: string | null;
  email?: string;
  estadisticas?: EstadisticasTorneo;
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

export interface InviteLink {
  code: string;
  url: string;
  expiresAt: string | null;
}

export interface InviteLinkPreview {
  teamId: string;
  nombre: string;
  escudo: string | null;
  capitanNombre: string;
  cantidadJugadores: number;
  expiresAt: string | null;
  yaEsMiembro: boolean;
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
  inviteLink?: InviteLink | null;
}

export interface MyTeamSummary {
  id: string;
  nombre: string;
  escudo: string | null;
  capitanId: string | null;
  cantidadJugadores: number;
  esCapitan: boolean;
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

export interface TeamDetail extends Team {
  torneo?: { id: string; nombre: string } | null;
  capitanId?: string | null;
}

export interface CreateTeamDto {
  nombre: string;
  escudo?: string;
  telefonoCapitan?: string;
}

export interface UpdateTeamDto {
  nombre?: string;
  escudo?: string;
  telefonoCapitan?: string;
}

const getToken = () => useAuthStore.getState().token ?? undefined;

// ─── Equipos globales ────────────────────────────────────────────────────────

export const createTeamGlobal = async (dto: CreateTeamDto): Promise<MyTeam> => {
  return api.post('/teams', dto, getToken());
};

export const getMyTeams = async (): Promise<MyTeamSummary[]> => {
  return api.get('/teams/my', getToken());
};

export const getTeamById = async (id: string): Promise<MyTeam> => {
  return api.get(`/teams/${id}`, getToken());
};

export const getTeamInTournament = async (equipoId: string, torneoId: string): Promise<MyTeam> => {
  return api.get(`/teams/${equipoId}/in-tournament/${torneoId}`, getToken());
};

export const updateTeam = async (id: string, dto: UpdateTeamDto): Promise<MyTeam> => {
  return api.patch(`/teams/${id}`, dto, getToken());
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`, getToken());
};

export const leaveTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}/leave`, getToken());
};

// ─── Invitaciones ────────────────────────────────────────────────────────────

export const invitePlayer = async (teamId: string, email: string): Promise<{ mensaje: string }> => {
  return api.post(`/teams/${teamId}/invite-player`, { email }, getToken());
};

export const createInviteLink = async (
  teamId: string,
  expiraEnDias?: number,
): Promise<InviteLink> => {
  return api.post(
    `/teams/${teamId}/invite-link`,
    expiraEnDias ? { expiraEnDias } : {},
    getToken(),
  );
};

export const revokeInviteLink = async (teamId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/invite-link`, getToken());
};

export const previewInviteLink = async (code: string): Promise<InviteLinkPreview> => {
  return api.get(`/teams/join/${code}/preview`, getToken());
};

export const joinByCode = async (code: string): Promise<{ teamId: string; nombre: string }> => {
  return api.post(`/teams/join/${code}`, {}, getToken());
};

// ─── Equipos en contexto de torneo (lectura) ─────────────────────────────────

export const getTeamsByTournament = async (torneoId: string): Promise<Team[]> => {
  return api.get(`/teams/tournament/${torneoId}`, getToken());
};

export const getMyTeam = async (torneoId: string): Promise<MyTeam> => {
  return api.get(`/teams/tournament/${torneoId}/my-team`, getToken());
};

// ─── Escudo ──────────────────────────────────────────────────────────────────

export const uploadEscudo = async (formData: FormData): Promise<{ url: string }> => {
  return api.postMultipart('/teams/upload-escudo', formData, getToken());
};
