import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TorneoResumen } from '../../hooks/useDashboard';

interface Props {
  torneo: TorneoResumen;
  onPress: (id: string) => void;
}

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

const ROL_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ORGANIZADOR: { bg: 'bg-accent-soft', text: 'text-accent', label: 'Organizador' },
  CAPITAN: { bg: 'bg-primary-light', text: 'text-primary', label: 'Capitán' },
  JUGADOR: { bg: 'bg-mist', text: 'text-carbon', label: 'Jugador' },
  STAFF: { bg: 'bg-mist', text: 'text-info', label: 'Staff' },
};

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  EN_CURSO: { bg: 'bg-primary-light', text: 'text-primary', label: 'En curso' },
  EN_INSCRIPCION: { bg: 'bg-accent-soft', text: 'text-accent', label: 'Inscripción' },
  FINALIZADO: { bg: 'bg-mist', text: 'text-carbon', label: 'Finalizado' },
  BORRADOR: { bg: 'bg-mist', text: 'text-carbon', label: 'Borrador' },
};

export default function TorneoResumenCard({ torneo, onPress }: Props) {
  const rol = ROL_STYLE[torneo.rol] ?? { bg: 'bg-mist', text: 'text-carbon', label: torneo.rol };
  const estado = ESTADO_STYLE[torneo.estado] ?? {
    bg: 'bg-mist',
    text: 'text-carbon',
    label: torneo.estado,
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(torneo.id)}
      activeOpacity={0.85}
      className="mb-3 rounded-2xl overflow-hidden bg-white flex-row"
      style={{
        elevation: 2,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="w-1 bg-primary" />
      <View className="flex-1 p-4 flex-row items-center">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2 mb-1.5">
            <View className="w-8 h-8 rounded-xl bg-primary-light items-center justify-center">
              <Feather name="award" size={16} color="#0D7A3E" />
            </View>
            <Text className="text-night font-sans-medium text-sm flex-1" numberOfLines={1}>
              {torneo.nombre}
            </Text>
          </View>
          <Text className="text-carbon text-xs ml-10">
            {FORMAT_LABEL[torneo.formato] ?? torneo.formato} · {torneo.cantidadEquipos} equipos
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mt-2 ml-10">
            <View className={`${rol.bg} px-2 py-0.5 rounded-full`}>
              <Text className={`${rol.text} text-xs font-sans-medium`}>{rol.label}</Text>
            </View>
            <View className={`${estado.bg} px-2 py-0.5 rounded-full`}>
              <Text className={`${estado.text} text-xs font-sans-medium`}>{estado.label}</Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="#3D4F44" />
      </View>
    </TouchableOpacity>
  );
}
