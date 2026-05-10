import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface Inscripcion {
  id: string;
  torneoId: string;
  equipoId: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
  equipo: {
    id: string;
    nombre: string;
    escudo: string | null;
    telefonoCapitan: string | null;
    cantidadJugadores: number | null;
    jugadores: { id: string; nombre: string; fotoPerfil: string | null }[];
  };
}

const getToken = () => useAuthStore.getState().token ?? undefined;

export const getInscripciones = async (torneoId: string): Promise<Inscripcion[]> => {
  return api.get(`/inscriptions/tournament/${torneoId}`, getToken());
};

export const solicitarInscripcion = async (torneoId: string, equipoId: string): Promise<Inscripcion> => {
  return api.post(`/inscriptions/tournament/${torneoId}`, { equipoId }, getToken());
};

export const actualizarEstadoInscripcion = async (
  inscripcionId: string,
  estado: 'APROBADA' | 'RECHAZADA',
): Promise<Inscripcion> => {
  return api.patch(`/inscriptions/${inscripcionId}/status`, { estado }, getToken());
};