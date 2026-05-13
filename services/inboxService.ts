import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface Invitacion {
  id: string;
  tipo: 'STAFF' | 'JUGADOR';
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  email: string;
  createdAt: string;
  torneo: { id: string; nombre: string; imagen: string | null };
  equipo: { id: string; nombre: string } | null;
  invitador: { id: string; nombre: string; fotoPerfil: string | null };
}

const getToken = () => useAuthStore.getState().token ?? undefined;

export const inboxService = {
  getInvitaciones: (): Promise<Invitacion[]> =>
    api.get('/users/me/invitaciones', getToken()),

  aceptar: (id: string): Promise<{ mensaje: string }> =>
    api.post(`/users/me/invitaciones/${id}/aceptar`, {}, getToken()),

  rechazar: (id: string): Promise<{ mensaje: string }> =>
    api.post(`/users/me/invitaciones/${id}/rechazar`, {}, getToken()),
};
