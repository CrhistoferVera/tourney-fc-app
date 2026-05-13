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
];

type Props = {
  readonly myTournaments: Tournament[];
  readonly publicTournaments: Tournament[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly onPress: (id: string) => void;
  readonly onRefresh: () => void;
  readonly refreshing: boolean;
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

  const showPublished = filtro !== 'borrador';

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
          <SectionHeader title="Torneos " count={filteredPublished.length} />
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
              <TournamentCard
                key={item.id}
                item={item}
                onPress={() => onPress(item.id)}
                onInscribirse={
                  !item.rolUsuario && item.estado === 'EN_INSCRIPCION'
                    ? () =>
                        router.push({
                          pathname: '/(app)/tournament/inscribirse',
                          params: { id: item.id },
                        } as never)
                    : undefined
                }
              />
            ))
          )}
        </View>
      )}

    </ScrollView>
  );
}
