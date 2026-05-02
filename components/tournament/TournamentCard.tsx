import { View, Text, TouchableOpacity } from 'react-native';
import { Tournament } from '../../services/tournamentService';
import StatusBadge from './StatusBadge';

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

interface Props {
  item: Tournament;
  onPress: () => void;
}

export default function TournamentCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{ shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      <View
        className={`h-1 w-full ${
          item.estado === 'EN_CURSO'
            ? 'bg-primary'
            : item.estado === 'EN_INSCRIPCION'
              ? 'bg-accent'
              : item.estado === 'BORRADOR'
                ? 'bg-carbon'
                : 'bg-mist'
        }`}
      />
      <View className="px-4 py-3">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-night font-sans-medium text-base flex-1 mr-2" numberOfLines={1}>
            {item.nombre}
          </Text>
          <StatusBadge estado={item.estado} />
        </View>
        <View className="flex-row items-center gap-3 mt-1">
          <Text className="text-carbon text-xs">
            {FORMAT_LABEL[item.formato] ?? item.formato} · {item.maxEquipos} equipos
          </Text>
        </View>
        {item.zona ? <Text className="text-carbon text-xs mt-0.5">📍 {item.zona}</Text> : null}
        {item.rolUsuario ? (
          <Text className="text-primary text-xs font-sans-medium mt-1">
            Tu rol: {item.rolUsuario}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
