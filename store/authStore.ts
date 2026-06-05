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
  pendingInviteCode: string | null;
  setToken: (token: string) => void;
  setUsuario: (usuario: Usuario) => void;
  clearAuth: () => void;
  setPendingInviteCode: (code: string) => void;
  clearPendingInviteCode: () => void;
}

// Estado de autenticación persistido en AsyncStorage.
// pendingInviteCode guarda el código de invitación que llegó por deep-link
// cuando el usuario no estaba logueado, para retomarlo después del login.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      pendingInviteCode: null,
      setToken: (token) => set({ token }),
      setUsuario: (usuario) => set({ usuario }),
      clearAuth: () => set({ token: null, usuario: null }),
      setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
      clearPendingInviteCode: () => set({ pendingInviteCode: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
