import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Team } from '../../services/teamsService';
import ShieldDisplay from './ShieldDisplay';

interface Props {
  readonly team: Team;
  readonly canDelete?: boolean;
  readonly onDelete?: (id: string) => void;
  readonly onPress?: (id: string) => void;
}

export default function TeamCard({ team, canDelete, onDelete, onPress }: Props) {
  const suffix = team.cantidadJugadores === 1 ? '' : 'es';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(team.id)}
      activeOpacity={onPress ? 0.75 : 1}
      className="bg-white rounded-2xl px-4 py-3 mb-3"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">
            <ShieldDisplay escudo={team.escudo} size={40} />
          </View>
          <View className="flex-1">
            <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>
              {team.nombre}
            </Text>
            <Text className="text-carbon text-xs mt-0.5">
              {team.cantidadJugadores} jugador{suffix}
            </Text>
          </View>
        </View>
        {canDelete && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(team.id)}
            className="p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={16} color="#E53935" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
