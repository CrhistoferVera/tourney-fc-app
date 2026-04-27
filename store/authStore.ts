import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  fotoPerfil: string | null;
  zona: string | null;
}

interface AuthStore {
  token: string | null;
  usuario: Usuario | null;
  setToken: (token: string) => void;
  setUsuario: (usuario: Usuario) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      setToken: (token) => set({ token }),
      setUsuario: (usuario) => set({ usuario }),
      clearAuth: () => set({ token: null, usuario: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);