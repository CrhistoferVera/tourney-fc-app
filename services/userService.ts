import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface User {
    id: string;
    nombre: string;
    email: string;
    fotoPerfil?: string;
    zona?: string;
    createdAt?: string;
}

export const userService = {
    /**
     * @param query
     */
    searchUsers: async (query: string): Promise<User[]> => {
        const token = useAuthStore.getState().token;
        return api.getWithParams('/users/search', { q: query }, token ?? undefined);
    },
    getMe: async (): Promise<User> => {
        const token = useAuthStore.getState().token;
        return api.get('/users/me', token ?? undefined);
    },
    getUserById: async (id: string): Promise<User> => {
        const token = useAuthStore.getState().token;
        return api.get(`/users/${id}`, token ?? undefined);
    },
    updateMe: async (data: Partial<User>): Promise<User> => {
        const token = useAuthStore.getState().token;
        return api.patch('/users/me', data, token ?? undefined);
    }
};