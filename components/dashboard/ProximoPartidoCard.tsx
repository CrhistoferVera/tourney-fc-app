import { View, Text } from 'react-native';
import { ProximoPartido } from '../../hooks/useDashboard';

interface Props {
  partido: ProximoPartido;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '—';
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
    <View className="bg-primary rounded-2xl p-4 mx-4 mb-4">
      <Text className="text-primary-light text-xs font-sans-medium mb-3">Próximo partido</Text>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-sans-medium text-base flex-1 text-center">
          {partido.equipoLocal}
        </Text>
        <Text className="text-white font-sans-medium text-lg mx-3">VS</Text>
        <Text className="text-white font-sans-medium text-base flex-1 text-center">
          {partido.equipoVisitante}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-primary-light text-xs">{formatFecha(partido.fecha)}</Text>
        {partido.lugar ? (
          <Text className="text-primary-light text-xs">• {partido.lugar}</Text>
        ) : null}
      </View>
    </View>
  );
}
