import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export const useProfile = () => {
  const { token, usuario, setUsuario } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get('/users/me', token);
      setUsuario(data);
    } catch {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { nombre?: string; zona?: string; fotoPerfil?: string }) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.patch('/users/me', updates, token);
      setUsuario(data);
      return true;
    } catch {
      setError('Error al actualizar el perfil');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { usuario, loading, error, fetchProfile, updateProfile };
};