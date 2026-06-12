import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { Tournament } from '../../services/tournamentService';
import StatusBadge from '../tournament/StatusBadge';
import BallLoader from '../common/BallLoader';

/* ── Tipos ── */
type FiltroEstado  = 'todos' | 'EN_CURSO' | 'EN_INSCRIPCION' | 'FINALIZADO';
type FiltroFormato = 'todos' | 'LIGA' | 'COPA' | 'GRUPOS' | 'ELIMINATORIA';

const ESTADOS: { key: FiltroEstado; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'todos',          label: 'Todos',       icon: 'grid',      color: '#0F1A14', bg: '#F2F5F3' },
  { key: 'EN_CURSO',       label: 'Activos',     icon: 'zap',       color: '#0D7A3E', bg: 'rgba(13,122,62,0.1)' },
  { key: 'EN_INSCRIPCION', label: 'Inscripción', icon: 'user-plus', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  { key: 'FINALIZADO',     label: 'Finalizados', icon: 'flag',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
];

const FORMATOS: { key: FiltroFormato; label: string; icon: string }[] = [
  { key: 'todos', label: 'Todos', icon: 'layers' },
  { key: 'LIGA',  label: 'Liga',  icon: 'bar-chart-2' },
  { key: 'COPA',  label: 'Copa',  icon: 'award' },
];

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga', COPA: 'Copa', GRUPOS: 'Grupos', ELIMINATORIA: 'Eliminatoria',
};

const ESTADO_PLACEHOLDER: Record<string, string> = {
  EN_CURSO: '#0D7A3E', EN_INSCRIPCION: '#D97706', BORRADOR: '#3D4F44', FINALIZADO: '#9CA3AF',
};

/* ── Card de torneo para Explorar (más grande, con imagen 4:3) ── */
function ExplorarCard({
  item,
  onPress,
  onInscribirse,
}: {
  item: Tournament;
  onPress: () => void;
  onInscribirse?: () => void;
}) {
  const placeholderColor = ESTADO_PLACEHOLDER[item.estado] ?? '#3D4F44';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'white', borderRadius: 20, marginBottom: 16, overflow: 'hidden',
        shadowColor: '#0F1A14', shadowOpacity: 0.07, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 3,
      }}
    >
      {/* Imagen */}
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 110, backgroundColor: placeholderColor, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="award" size={40} color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* Badge estado flotante */}
      <View style={{ position: 'absolute', top: 10, right: 10 }}>
        <StatusBadge estado={item.estado} />
      </View>

      {/* Contenido */}
      <View style={{ padding: 14 }}>
        <Text style={{ color: '#0F1A14', fontSize: 16, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
          {item.nombre}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {/* Formato */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(13,122,62,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Feather name="award" size={11} color="#0D7A3E" />
            <Text style={{ color: '#0D7A3E', fontSize: 11, fontWeight: '600' }}>
              {FORMAT_LABEL[item.formato] ?? item.formato}
            </Text>
          </View>
          {/* Equipos */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Feather name="users" size={11} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>{item.maxEquipos} equipos</Text>
          </View>
          {/* Zona */}
          {!!item.zona && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
              <Feather name="map-pin" size={11} color="#6B7280" />
              <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600' }}>{item.zona}</Text>
            </View>
          )}
        </View>

        {/* Rol */}
        {!!item.rolUsuario && (
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(13,122,62,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Feather name="user-check" size={12} color="#0D7A3E" />
              <Text style={{ color: '#0D7A3E', fontSize: 12, fontWeight: '600' }}>
                {{ ORGANIZADOR: 'Organizador', STAFF: 'Staff', CAPITAN: 'Capitán', JUGADOR: 'Jugador' }[item.rolUsuario] ?? item.rolUsuario}
              </Text>
            </View>
          </View>
        )}

        {/* Botón inscribirse */}
        {!item.rolUsuario && item.estado === 'EN_INSCRIPCION' && !!onInscribirse && (
          <TouchableOpacity
            onPress={onInscribirse}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 10,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              shadowColor: '#D97706', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
            }}
          >
            <Feather name="user-plus" size={15} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Inscribir mi equipo</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ── Chip de filtro ── */
function FilterChip({
  label, icon, active, color, bg, count, onPress,
}: {
  label: string; icon: string; active: boolean; color: string; bg: string; count?: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: active ? color : 'white',
        borderWidth: 1.5, borderColor: active ? color : '#E5E7EB',
        shadowColor: active ? color : '#000',
        shadowOpacity: active ? 0.22 : 0.04,
        shadowRadius: active ? 6 : 3, elevation: active ? 3 : 1,
      }}
    >
      <Feather name={icon as any} size={12} color={active ? 'white' : color} />
      <Text style={{ color: active ? 'white' : '#3D4F44', fontWeight: '600', fontSize: 12 }}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : bg, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' }}>
          <Text style={{ color: active ? 'white' : color, fontSize: 10, fontWeight: '700' }}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ── Props ── */
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
  myTournaments, publicTournaments, loading, error, onRetry, onPress, onRefresh, refreshing,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroFormato, setFiltroFormato] = useState<FiltroFormato>('todos');

  const myIds = new Set(myTournaments.map((t) => t.id));
  const myActive = myTournaments.filter((t) => t.estado !== 'BORRADOR');
  const otherPublic = publicTournaments.filter((t) => !myIds.has(t.id));
  const allPublished = [...myActive, ...otherPublic];

  const filteredList = useMemo(() => {
    let list = allPublished;
    if (filtroEstado !== 'todos') list = list.filter((t) => t.estado === filtroEstado);
    if (filtroFormato !== 'todos') list = list.filter((t) => t.formato === filtroFormato);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.nombre.toLowerCase().includes(q));
    }
    return list;
  }, [search, filtroEstado, filtroFormato, myTournaments, publicTournaments]);

  if (loading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0D7A3E" size="large" />
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
        style={{ flex: 1 }}
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
      {/* Header decorativo */}
      <View style={{ backgroundColor: '#0D7A3E', paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, position: 'relative' }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </View>

      {/* Buscador (superpuesto al header) */}
      <View style={{ paddingHorizontal: 16, marginTop: -24, paddingBottom: 4 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
          shadowColor: '#0F1A14', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
          borderWidth: 1, borderColor: '#F0F4F1',
        }}>
          <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: '#0F1A14', fontSize: 14 }}
            placeholder="Buscar torneos..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de estado */}
      <View style={{ paddingTop: 14, paddingBottom: 4 }}>
        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
          Estado
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {ESTADOS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              icon={f.icon}
              active={filtroEstado === f.key}
              color={f.color}
              bg={f.bg}
              count={f.key === 'todos' ? allPublished.length : allPublished.filter(t => t.estado === f.key).length}
              onPress={() => setFiltroEstado(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Filtros de formato */}
      <View style={{ paddingTop: 10, paddingBottom: 14 }}>
        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
          Formato
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FORMATOS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              icon={f.icon}
              active={filtroFormato === f.key}
              color="#0D7A3E"
              bg="rgba(13,122,62,0.1)"
              count={f.key === 'todos' ? allPublished.length : allPublished.filter(t => t.formato === f.key).length}
              onPress={() => setFiltroFormato(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Error */}
      {!!error && (
        <View style={{ backgroundColor: 'white', borderRadius: 16, marginHorizontal: 16, padding: 16, alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text style={{ color: '#0D7A3E', fontWeight: '600', fontSize: 14 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      <View style={{ paddingHorizontal: 16 }}>
        {filteredList.length === 0 ? (
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 32, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(13,122,62,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Feather name="search" size={28} color="#0D7A3E" />
            </View>
            <Text style={{ color: '#0F1A14', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Sin resultados</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
              {search ? 'No hay torneos que coincidan con tu búsqueda.' : 'No hay torneos con estos filtros.'}
            </Text>
          </View>
        ) : (
          filteredList.map((item) => (
            <ExplorarCard
              key={item.id}
              item={item}
              onPress={() => onPress(item.id)}
              onInscribirse={
                !item.rolUsuario && !(item as any).tieneSolicitudPendiente && item.estado === 'EN_INSCRIPCION'
                  ? () => router.push({ pathname: '/(app)/tournament/inscribirse', params: { id: item.id } } as never)
                  : undefined
              }
            />
          ))
        )}
      </View>
    </ScrollView>
    </View>
  );
}
