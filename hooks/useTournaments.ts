import { useState, useCallback, useEffect } from 'react';
import { getMyTournaments, getPublicTournaments, Tournament } from '../services/tournamentService';

export function useTournaments() {
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [mine, publics] = await Promise.all([getMyTournaments(), getPublicTournaments()]);
      setMyTournaments(Array.isArray(mine) ? mine : []);
      setPublicTournaments(Array.isArray(publics) ? publics : []);
    } catch {
      setError('No se pudieron cargar los torneos.');
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return { myTournaments, publicTournaments, loading, refreshing, error, fetchData, onRefresh };
}
