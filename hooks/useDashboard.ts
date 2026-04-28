import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export interface ProximoPartido {
  id: string;
  fecha: string | null;
  lugar: string | null;
  direccion: string | null;
  equipoLocal: string;
  equipoVisitante: string;
}

export interface Resultado {
  id: string;
  equipoLocal: string;
  equipoVisitante: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  fecha: string | null;
  lugar: string | null;
  estadoConfirmacion: string;
}

export interface TorneoResumen {
  id: string;
  nombre: string;
  formato: string;
  estado: string;
  cantidadEquipos: number;
  rol: string;
}

export interface DashboardData {
  torneos: TorneoResumen[];
  proximoPartido: ProximoPartido | null;
  ultimosResultados: Resultado[];
}

export const useDashboard = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/users/me/dashboard', token);
      setData(result);
    } catch {
      setError('No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { data, loading, error, fetchDashboard };
};