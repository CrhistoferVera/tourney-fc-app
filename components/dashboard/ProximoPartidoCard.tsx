import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProximoPartido } from '../../hooks/useDashboard';

interface Props {
  partido: ProximoPartido;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return 'Fecha por confirmar';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ProximoPartidoCard({ partido }: Props) {
  return (
    <View
      className="mx-4 mb-5 rounded-3xl overflow-hidden bg-white"
      style={{
        elevation: 4,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View className="bg-primary px-4 py-3 flex-row items-center gap-2">
        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
          <Feather name="calendar" size={16} color="#FFFFFF" />
        </View>
        <Text className="text-white font-sans-medium text-sm flex-1">
          {partido.formato === 'COPA' || partido.formato === 'ELIMINATORIA' 
            ? `Próximo partido - ${partido.fase || ''}` 
            : 'Próximo partido'}
        </Text>
        <View className="bg-accent px-2.5 py-1 rounded-full">
          <Text className="text-white text-xs font-sans-medium">Pronto</Text>
        </View>
      </View>

      <View className="px-4 py-5">
        <View className="flex-row items-center">
          <Text
            className="text-night font-sans-medium text-base flex-1 text-center"
            numberOfLines={2}
          >
            {partido.equipoLocal}
          </Text>
          <View
            className="mx-3 w-11 h-11 rounded-full bg-primary-light items-center justify-center"
            style={{ borderWidth: 2, borderColor: '#D4F5E2' }}
          >
            <Text className="text-primary font-sans-medium text-xs">VS</Text>
          </View>
          <Text
            className="text-night font-sans-medium text-base flex-1 text-center"
            numberOfLines={2}
          >
            {partido.equipoVisitante}
          </Text>
        </View>

        <View className="flex-row items-center justify-center gap-4 mt-4 pt-4 border-t border-mist">
          <View className="flex-row items-center gap-1.5">
            <Feather name="clock" size={13} color="#3D4F44" />
            <Text className="text-carbon text-xs">{formatFecha(partido.fecha)}</Text>
          </View>
          {!!partido.lugar && (
            <View className="flex-row items-center gap-1.5">
              <Feather name="map-pin" size={13} color="#3D4F44" />
              <Text className="text-carbon text-xs" numberOfLines={1}>
                {partido.lugar}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
