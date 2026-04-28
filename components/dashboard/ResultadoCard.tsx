import { View, Text } from 'react-native';
import { Resultado } from '../../hooks/useDashboard';

interface Props {
  resultado: Resultado;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function ResultadoCard({ resultado }: Props) {
  const confirmado = resultado.estadoConfirmacion === 'CONFIRMADO';

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-night font-sans-medium text-sm flex-1">{resultado.equipoLocal}</Text>
        <Text className="text-night font-sans-medium text-lg mx-3">
          {resultado.golesLocal ?? '—'} - {resultado.golesVisitante ?? '—'}
        </Text>
        <Text className="text-night font-sans-medium text-sm flex-1 text-right">{resultado.equipoVisitante}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-carbon text-xs">{formatFecha(resultado.fecha)}</Text>
          {resultado.lugar ? <Text className="text-carbon text-xs">{resultado.lugar}</Text> : null}
        </View>
        <View className={`px-2 py-0.5 rounded-full ${confirmado ? 'bg-primary-light' : 'bg-accent-soft'}`}>
          <Text className={`text-xs font-sans-medium ${confirmado ? 'text-primary' : 'text-accent'}`}>
            {confirmado ? 'Confirmado' : 'Pendiente'}
          </Text>
        </View>
      </View>
    </View>
  );
}