import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Resultado } from '../../hooks/useDashboard';

interface Props {
  resultado: Resultado;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ResultadoCard({ resultado }: Props) {
  const confirmado = resultado.estadoConfirmacion === 'CONFIRMADO';
  const tieneMarcador =
    resultado.golesLocal !== null && resultado.golesVisitante !== null;

  return (
    <View
      className="mx-4 mb-3 rounded-2xl bg-white overflow-hidden"
      style={{
        elevation: 2,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="flex-row items-center px-4 py-3">
        <Text className="text-night font-sans-medium text-sm flex-1" numberOfLines={1}>
          {resultado.equipoLocal}
        </Text>
        <View className="mx-3 px-3 py-1.5 rounded-xl bg-mist min-w-[52px] items-center">
          <Text className="text-night font-sans-medium text-base">
            {tieneMarcador ? `${resultado.golesLocal} - ${resultado.golesVisitante}` : '—'}
          </Text>
        </View>
        <Text className="text-night font-sans-medium text-sm flex-1 text-right" numberOfLines={1}>
          {resultado.equipoVisitante}
        </Text>
      </View>

      <View className="flex-row items-center justify-between px-4 py-2.5 bg-mist/60 border-t border-mist">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Feather name="calendar" size={12} color="#3D4F44" />
            <Text className="text-carbon text-xs">{formatFecha(resultado.fecha)}</Text>
          </View>
          {!!resultado.lugar && (
            <View className="flex-row items-center gap-1">
              <Feather name="map-pin" size={12} color="#3D4F44" />
              <Text className="text-carbon text-xs" numberOfLines={1}>
                {resultado.lugar}
              </Text>
            </View>
          )}
        </View>
        <View
          className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
            confirmado ? 'bg-primary-light' : 'bg-accent-soft'
          }`}
        >
          <Feather
            name={confirmado ? 'check-circle' : 'clock'}
            size={11}
            color={confirmado ? '#0D7A3E' : '#F5820D'}
          />
          <Text
            className={`text-xs font-sans-medium ${confirmado ? 'text-primary' : 'text-accent'}`}
          >
            {confirmado ? 'Confirmado' : 'Pendiente'}
          </Text>
        </View>
      </View>
    </View>
  );
}
