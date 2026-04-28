import { View, Text, TouchableOpacity } from 'react-native';
import { TorneoResumen } from '../../hooks/useDashboard';

interface Props {
  torneo: TorneoResumen;
  onPress: (id: string) => void;
}

const ROL_COLORS: Record<string, string> = {
  ORGANIZADOR: 'bg-accent-soft',
  CAPITAN: 'bg-info',
  JUGADOR: 'bg-primary-light',
  STAFF: 'bg-mist',
};

const ROL_TEXT: Record<string, string> = {
  ORGANIZADOR: 'text-accent',
  CAPITAN: 'text-info',
  JUGADOR: 'text-primary',
  STAFF: 'text-carbon',
};

export default function TorneoResumenCard({ torneo, onPress }: Props) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mr-3 w-48"
      onPress={() => onPress(torneo.id)}
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-night font-sans-medium text-sm flex-1 mr-2" numberOfLines={1}>
          {torneo.nombre}
        </Text>
        <View className={`${ROL_COLORS[torneo.rol] ?? 'bg-mist'} px-2 py-0.5 rounded-full`}>
          <Text className={`${ROL_TEXT[torneo.rol] ?? 'text-carbon'} text-xs font-sans-medium`}>
            {torneo.rol}
          </Text>
        </View>
      </View>
      <Text className="text-carbon text-xs">{torneo.formato} • {torneo.cantidadEquipos} equipos</Text>
      <View className="mt-2 bg-primary-light px-2 py-0.5 rounded-full self-start">
        <Text className="text-primary text-xs font-sans-medium">
          {torneo.estado === 'EN_CURSO' ? 'Activo' : torneo.estado === 'EN_INSCRIPCION' ? 'Inscripción' : torneo.estado}
        </Text>
      </View>
    </TouchableOpacity>
  );
}