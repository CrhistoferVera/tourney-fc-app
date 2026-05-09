import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface UpdateMatchDto {
  estado?: 'PENDIENTE' | 'CONFIRMADO';
  fecha?: string;
  campoId?: string;
}

const getToken = () => useAuthStore.getState().token ?? undefined;

export const getMatch = async (id: string) => {
  return api.get(`/matches/${id}`, getToken());
};

export const updateMatch = async (id: string, dto: UpdateMatchDto) => {
  return api.patch(`/matches/${id}`, dto, getToken());
};

export const confirmMatch = async (id: string) => {
  return api.post(`/matches/${id}/confirm`, {}, getToken());
};
