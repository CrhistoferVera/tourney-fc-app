import { Feather } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import ShieldDisplay from '../tournament/ShieldDisplay';
import { MyTeamSummary } from '../../services/teamsService';

interface Props {
  readonly team: MyTeamSummary;
  readonly onPress: (id: string) => void;
}

export default function MyTeamCard({ team, onPress }: Props) {
  const sufijo = team.cantidadJugadores === 1 ? '' : 'es';
  return (
    <TouchableOpacity
      onPress={() => onPress(team.id)}
      activeOpacity={0.85}
      className="bg-white rounded-2xl px-4 py-3 mb-3 flex-row items-center"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <ShieldDisplay escudo={team.escudo} size={48} />
      <View className="flex-1 ml-3">
        <Text className="text-night font-sans-medium text-base" numberOfLines={1}>
          {team.nombre}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Feather name={team.esCapitan ? 'star' : 'user'} size={11} color="#0D7A3E" />
          <Text className="text-primary text-xs font-sans-medium">
            {team.esCapitan ? 'Capitán' : 'Jugador'}
          </Text>
          <Text className="text-carbon text-xs">·</Text>
          <Text className="text-carbon text-xs">
            {team.cantidadJugadores} jugador{sufijo}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#A8B5AE" />
    </TouchableOpacity>
  );
}
