import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { Tournament } from '../../services/tournamentService';
import TournamentCard from '../tournament/TournamentCard';
import SectionHeader from '../tournament/SectionHeader';

type Filtro = 'todos' | 'liga' | 'copa' | 'borrador' | 'publicado';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'liga', label: 'Liga' },
  { key: 'copa', label: 'Copa' },
  { key: 'publicado', label: 'Publicados' },
  { key: 'borrador', label: 'Borradores' },
];

type Props = {
  myTournaments: Tournament[];
  publicTournaments: Tournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPress: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

export default function ExplorarSection({
  myTournaments,
  publicTournaments,
  loading,
  error,
  onRetry,
  onPress,
  onRefresh,
  refreshing,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const myDrafts = myTournaments.filter((t) => t.estado === 'BORRADOR');
  const myActive = myTournaments.filter((t) => t.estado !== 'BORRADOR');
  const myIds = new Set(myTournaments.map((t) => t.id));
  const otherPublic = publicTournaments.filter((t) => !myIds.has(t.id));
  const allPublished = [...myActive, ...otherPublic];

  const applySearch = (list: Tournament[]) => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((t) => t.nombre.toLowerCase().includes(q));
  };

  const applyFormatFilter = (list: Tournament[]) => {
    if (filtro === 'liga') return list.filter((t) => t.formato === 'LIGA');
    if (filtro === 'copa') return list.filter((t) => (t as any).formato === 'COPA');
    return list;
  };

  const filteredPublished = useMemo(() => {
    if (filtro === 'borrador') return [];
    return applySearch(applyFormatFilter(allPublished));
  }, [search, filtro, myTournaments, publicTournaments]);

  const filteredDrafts = useMemo(() => {
    if (filtro === 'publicado' || filtro === 'liga' || filtro === 'copa') return [];
    return applySearch(myDrafts);
  }, [search, filtro, myTournaments]);

  const showPublished = filtro !== 'borrador';
  const showDrafts = filtro === 'todos' || filtro === 'borrador';

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0D7A3E"
          colors={['#0D7A3E']}
        />
      }
    >
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
          <Feather name="search" size={16} color="#3D4F44" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-night text-sm"
            placeholder="Buscar torneos..."
            placeholderTextColor="#3D4F44"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#3D4F44" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFiltro(f.key)}
            className={`px-4 py-2 rounded-full border ${filtro === f.key ? 'bg-primary border-primary' : 'bg-white border-mist'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-sans-medium ${filtro === f.key ? 'text-white' : 'text-carbon'}`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="px-4 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/(app)/create-tournament')}
          className="bg-primary rounded-2xl px-4 py-3 flex-row items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-medium text-sm">＋ Crear torneo</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="bg-white rounded-2xl mx-4 px-4 py-6 items-center mb-3">
          <Text className="text-danger text-sm text-center mb-2">{error}</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showPublished && (
        <View className="px-4">
          <SectionHeader title="Torneos publicados" count={filteredPublished.length} />
          {filteredPublished.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
              <Text className="text-carbon text-sm text-center">
                {search
                  ? 'No hay torneos que coincidan con la búsqueda.'
                  : 'No hay torneos publicados aún.'}
              </Text>
            </View>
          ) : (
            filteredPublished.map((item) => (
              <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
            ))
          )}
        </View>
      )}

      {showDrafts && (
        <View className="px-4 mt-2">
          <SectionHeader title="Mis borradores" count={filteredDrafts.length} />
          {filteredDrafts.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-6 items-center">
              <Text className="text-carbon text-sm text-center">
                {search ? 'No hay borradores que coincidan.' : 'No tienes borradores guardados.'}
              </Text>
            </View>
          ) : (
            filteredDrafts.map((item) => (
              <TournamentCard key={item.id} item={item} onPress={() => onPress(item.id)} />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
