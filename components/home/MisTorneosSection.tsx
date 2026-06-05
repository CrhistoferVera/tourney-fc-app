import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Tournament } from '../../services/tournamentService';
import TournamentCard from '../tournament/TournamentCard';
import SectionHeader from '../tournament/SectionHeader';

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View
      className="bg-white rounded-2xl px-4 py-8 items-center mb-3"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 6 }}
    >
      <View className="w-14 h-14 rounded-2xl bg-mist items-center justify-center mb-3">
        <Feather name={icon} size={26} color="#3D4F44" />
      </View>
      <Text className="text-night font-sans-medium text-sm text-center">{message}</Text>
    </View>
  );
}


type Props = {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPress: (tournament: Tournament) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

type Filtro = 'activos' | 'inscripcion' | 'finalizados';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'activos', label: 'Activos' },
  { key: 'inscripcion', label: 'Inscripción' },
  { key: 'finalizados', label: 'Finalizados' },
];

export default function MisTorneosSection({
  tournaments,
  loading,
  error,
  onRetry,
  onPress,
  onRefresh,
  refreshing,
}: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('activos');

  const active = tournaments.filter((t) => {
    if (filtro === 'activos') return t.estado === 'EN_CURSO';
    if (filtro === 'inscripcion') return t.estado === 'EN_INSCRIPCION';
    if (filtro === 'finalizados') return t.estado === 'FINALIZADO';
    return false;
  });
  const drafts = tournaments.filter((t) => t.estado === 'BORRADOR');

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );

  if (error)
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-danger text-sm text-center mb-3">{error}</Text>
        <TouchableOpacity onPress={onRetry}>
          <Text className="text-primary font-sans-medium text-sm">Reintentar</Text>
        </TouchableOpacity>
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
      <View className="px-4 mt-4 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/create-tournament')}
          className="bg-primary rounded-2xl px-4 py-3 items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-white font-sans-medium text-sm">＋ Crear torneo</Text>
        </TouchableOpacity>
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

      <View className="px-4">
        <SectionHeader title={FILTROS.find(f => f.key === filtro)?.label || 'Torneos'} count={active.length} />
        {active.length === 0 ? (
          <EmptyState icon="award" message="No tienes torneos activos." />
        ) : (
          active.map((item) => (
            <TournamentCard key={item.id} item={item} onPress={() => onPress(item)} />
          ))
        )}
      </View>

      <View className="px-4 mt-2">
        <SectionHeader title="Borradores" count={drafts.length} />
        {drafts.length === 0 ? (
          <EmptyState icon="edit-3" message="No tienes borradores." />
        ) : (
          drafts.map((item) => (
            <TournamentCard key={item.id} item={item} onPress={() => onPress(item)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
