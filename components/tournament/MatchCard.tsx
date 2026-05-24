import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Partido } from '../../services/fixtureService';

interface Props {
  readonly partido: Partido;
  readonly canEdit?: boolean;
  readonly onPress?: (partido: Partido) => void;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return 'Sin fecha';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function Shield({ escudo, nombre }: { readonly escudo: string | null; readonly nombre: string }) {
  if (escudo) {
    return (
      <Image
        source={{ uri: escudo }}
        style={{ width: 34, height: 34 }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EBF0EC',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#0D7A3E', fontSize: 14, fontWeight: '600' }}>
        {nombre.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

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
      {/* Teams row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 items-center gap-1">
          <Shield escudo={partido.equipoLocal.escudo} nombre={partido.equipoLocal.nombre} />
          <Text className="text-night font-sans-medium text-xs text-center" numberOfLines={2}>
            {partido.equipoLocal.nombre}
          </Text>
        </View>

        <View className="px-3 items-center min-w-[48px]">
          {tieneMarcador ? (
            <Text className="text-night font-sans-medium text-lg">
              {partido.golesLocal} - {partido.golesVisitante}
            </Text>
          ) : (
            <Text className="text-carbon text-sm font-sans-medium">vs</Text>
          )}
        </View>

        <View className="flex-1 items-center gap-1">
          <Shield escudo={partido.equipoVisitante.escudo} nombre={partido.equipoVisitante.nombre} />
          <Text className="text-night font-sans-medium text-xs text-center" numberOfLines={2}>
            {partido.equipoVisitante.nombre}
          </Text>
        </View>
      </View>

      {/* Meta row */}
      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-1">
          {partido.fecha && (
            <Text className="text-carbon text-xs">{formatFecha(partido.fecha)}</Text>
          )}
          {partido.campo && (
            <Text className="text-carbon text-xs mt-0.5">{partido.campo.nombre}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <View
            className={`px-2 py-0.5 rounded-full ${confirmado ? 'bg-primary-light' : 'bg-accent-soft'}`}
          >
            <Text
              className={`text-xs font-sans-medium ${confirmado ? 'text-primary' : 'text-accent'}`}
            >
              {confirmado ? 'Confirmado' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </View>

    </TouchableOpacity>
  );
}
