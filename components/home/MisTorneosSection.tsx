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
import BallLoader from '../common/BallLoader';

function EmptyState({ icon, message }: { icon: any; message: string }) {
  return (
    <View
      className="bg-white rounded-2xl px-4 py-10 items-center mb-3"
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

type Filtro = 'todos' | 'EN_CURSO' | 'EN_INSCRIPCION' | 'FINALIZADO' | 'BORRADOR';

const FILTROS: { key: Filtro; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'todos',         label: 'Todos',        icon: 'grid',       color: '#0F1A14', bg: '#F2F5F3' },
  { key: 'EN_CURSO',      label: 'Activos',      icon: 'zap',        color: '#0D7A3E', bg: 'rgba(13,122,62,0.1)' },
  { key: 'EN_INSCRIPCION',label: 'Inscripción',  icon: 'user-plus',  color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  { key: 'FINALIZADO',    label: 'Finalizados',  icon: 'flag',       color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { key: 'BORRADOR',      label: 'Borradores',   icon: 'edit-3',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
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
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const filtered = filtro === 'todos'
    ? tournaments
    : tournaments.filter((t) => t.estado === filtro);

  const currentFiltro = FILTROS.find((f) => f.key === filtro) ?? FILTROS[0];

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
    <View style={{ flex: 1 }}>
      {refreshing && (
        <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 10, alignItems: 'center' }}>
          <BallLoader size={38} />
        </View>
      )}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
            progressViewOffset={-1000}
          />
        }
      >
        {/* Header */}
      <View style={{ backgroundColor: '#0D7A3E', paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20, position: 'relative' }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <View style={{ position: 'absolute', bottom: -24, left: 20, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
          {tournaments.length} torneo{tournaments.length !== 1 ? 's' : ''} en total
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/create-tournament')}
          style={{
            position: 'absolute', right: 20, bottom: 20,
            backgroundColor: 'white',
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color="#0D7A3E" />
          <Text style={{ color: '#0D7A3E', fontWeight: '700', fontSize: 13 }}>Crear torneo</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8 }}
        style={{ marginTop: -2 }}
      >
        {FILTROS.map((f) => {
          const isActive = filtro === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFiltro(f.key)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? f.color : 'white',
                borderWidth: 1.5,
                borderColor: isActive ? f.color : '#E5E7EB',
                shadowColor: isActive ? f.color : '#000',
                shadowOpacity: isActive ? 0.25 : 0.04,
                shadowRadius: isActive ? 8 : 4,
                elevation: isActive ? 4 : 1,
              }}
            >
              <Feather name={f.icon as any} size={13} color={isActive ? 'white' : f.color} />
              <Text style={{ color: isActive ? 'white' : '#3D4F44', fontWeight: '600', fontSize: 13 }}>
                {f.label}
              </Text>
              {/* Contador por estado */}
              {(() => {
                const count = f.key === 'todos'
                  ? tournaments.length
                  : tournaments.filter(t => t.estado === f.key).length;
                return count > 0 ? (
                  <View style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : f.bg,
                    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center',
                  }}>
                    <Text style={{ color: isActive ? 'white' : f.color, fontSize: 11, fontWeight: '700' }}>{count}</Text>
                  </View>
                ) : null;
              })()}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      <View className="px-4">
        {/* Subtítulo del filtro activo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: currentFiltro.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={currentFiltro.icon as any} size={14} color={currentFiltro.color} />
          </View>
          <Text style={{ color: '#0F1A14', fontSize: 15, fontWeight: '700' }}>{currentFiltro.label}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>({filtered.length})</Text>
        </View>

        {filtered.length === 0 ? (
          <EmptyState icon={currentFiltro.icon} message={`No tienes torneos en "${currentFiltro.label}".`} />
        ) : (
          filtered.map((item) => (
            <TournamentCard key={item.id} item={item} onPress={() => onPress(item)} />
          ))
        )}
      </View>
    </ScrollView>
    </View>
  );
}
