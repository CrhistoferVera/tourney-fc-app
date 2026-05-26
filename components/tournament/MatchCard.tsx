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
  const tieneMarcador = partido.golesLocal !== null && partido.golesVisitante !== null;

  const getStatusLabelAndStyle = () => {
    if (partido.faseJuego === 'PRIMER_TIEMPO') {
      return { label: '1er Tiempo', bg: '#DCFCE7', text: '#15803D' };
    }
    if (partido.faseJuego === 'MEDIO_TIEMPO') {
      return { label: 'Medio Tiempo', bg: '#FEF9C3', text: '#A16207' };
    }
    if (partido.faseJuego === 'SEGUNDO_TIEMPO') {
      return { label: '2do Tiempo', bg: '#DCFCE7', text: '#15803D' };
    }
    if (partido.faseJuego === 'FINALIZADO' || partido.estado === 'EN_DISPUTA') {
      return { label: 'Finalizado', bg: '#F3F4F6', text: '#4B5563' };
    }
    const isConf = partido.estado === 'CONFIRMADO';
    return isConf
      ? { label: 'Confirmado', bg: '#EBF5EF', text: '#0D7A3E' }
      : { label: 'Pendiente', bg: '#FEE2E2', text: '#B91C1C' };
  };

  const status = getStatusLabelAndStyle();

  const isFinishedOrLive = tieneMarcador && (
    partido.faseJuego === 'FINALIZADO' || 
    partido.faseJuego === 'PRIMER_TIEMPO' || 
    partido.faseJuego === 'SEGUNDO_TIEMPO' || 
    partido.estado === 'EN_DISPUTA'
  );
  
  const localWinner = isFinishedOrLive && partido.golesLocal! > partido.golesVisitante!;
  const visitanteWinner = isFinishedOrLive && partido.golesLocal! < partido.golesVisitante!;
  const isLoserLocal = isFinishedOrLive && partido.golesLocal! < partido.golesVisitante!;
  const isLoserVisitante = isFinishedOrLive && partido.golesLocal! > partido.golesVisitante!;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(partido)}
      activeOpacity={onPress ? 0.75 : 1}
      className="bg-white rounded-2xl px-4 py-3 mb-3"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      {/* Teams row */}
      <View className="flex-row items-center justify-between mb-2">
        {/* Local team */}
        <View style={{ flex: 1, alignItems: 'center', opacity: isLoserLocal ? 0.6 : 1, gap: 4 }}>
          <Shield escudo={partido.equipoLocal.escudo} nombre={partido.equipoLocal.nombre} />
          <Text 
            style={{
              fontSize: 12,
              textAlign: 'center',
              fontWeight: localWinner ? '700' : '500',
              color: localWinner ? '#0D7A3E' : isLoserLocal ? '#9CA3AF' : '#0F1A14',
            }}
            numberOfLines={2}
          >
            {partido.equipoLocal.nombre}
          </Text>
        </View>

        {/* Score */}
        <View className="px-3 items-center min-w-[48px]">
          {tieneMarcador ? (
            <Text 
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#0F1A14',
              }}
            >
              {partido.golesLocal} - {partido.golesVisitante}
            </Text>
          ) : (
            <Text className="text-carbon text-sm font-sans-medium">vs</Text>
          )}
        </View>

        {/* Visitante team */}
        <View style={{ flex: 1, alignItems: 'center', opacity: isLoserVisitante ? 0.6 : 1, gap: 4 }}>
          <Shield escudo={partido.equipoVisitante.escudo} nombre={partido.equipoVisitante.nombre} />
          <Text 
            style={{
              fontSize: 12,
              textAlign: 'center',
              fontWeight: visitanteWinner ? '700' : '500',
              color: visitanteWinner ? '#0D7A3E' : isLoserVisitante ? '#9CA3AF' : '#0F1A14',
            }}
            numberOfLines={2}
          >
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
            style={{
              backgroundColor: status.bg,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: status.text,
              }}
            >
              {status.label}
            </Text>
          </View>
        </View>
      </View>

    </TouchableOpacity>
  );
}
