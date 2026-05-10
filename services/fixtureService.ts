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

export interface Partido {
  id: string;
  torneoId: string;
  estado: string;
  fecha: string | null;
  ronda: number | null;
  fase: string | null;
  golesLocal: number | null;
  golesVisitante: number | null;
  equipoLocal: PartidoEquipo;
  equipoVisitante: PartidoEquipo;
  campo: Campo | null;
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
