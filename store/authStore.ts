import { create } from 'zustand';

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

export const useAuthStore = create<AuthStore>((set) => ({
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMzA2Nzc3My01MDZiLTQzNTEtYjdjYi1jN2M1MGM0YWMyOWUiLCJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NzcxMzIzNjIsImV4cCI6MTc3NzIxODc2Mn0.3y37L91Usz_mdO-LY7i8Zgp2FIzulJiqGFeOQshdajE',
  usuario: null,
  setToken: (token) => set({ token }),
  setUsuario: (usuario) => set({ usuario }),
  clearAuth: () => set({ token: null, usuario: null }),
}));