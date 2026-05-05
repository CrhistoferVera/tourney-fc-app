import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Partido } from '../../services/fixtureService';

interface Props {
  partido: Partido;
  canEdit?: boolean;
  onPress?: (partido: Partido) => void;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return 'Sin fecha';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function MatchCard({ partido, canEdit, onPress }: Props) {
  const confirmado = partido.estado === 'CONFIRMADO';
  const tieneMarcador = partido.golesLocal !== null && partido.golesVisitante !== null;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(partido)}
      activeOpacity={onPress ? 0.75 : 1}
      className="bg-white rounded-2xl px-4 py-3 mb-3"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-night font-sans-medium text-sm flex-1 text-center" numberOfLines={1}>
          {partido.equipoLocal.nombre}
        </Text>
        <View className="px-3 items-center">
          {tieneMarcador ? (
            <Text className="text-night font-sans-medium text-lg">
              {partido.golesLocal} - {partido.golesVisitante}
            </Text>
          ) : (
            <Text className="text-carbon text-sm">vs</Text>
          )}
        </View>
        <Text className="text-night font-sans-medium text-sm flex-1 text-center" numberOfLines={1}>
          {partido.equipoVisitante.nombre}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-carbon text-xs">{formatFecha(partido.fecha)}</Text>
          {partido.campo && (
            <Text className="text-carbon text-xs mt-0.5">{partido.campo.nombre}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          {canEdit && (
            <Feather name="edit-2" size={14} color="#3D4F44" />
          )}
          <View className={`px-2 py-0.5 rounded-full ${confirmado ? 'bg-primary-light' : 'bg-accent-soft'}`}>
            <Text className={`text-xs font-sans-medium ${confirmado ? 'text-primary' : 'text-accent'}`}>
              {confirmado ? 'Confirmado' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}