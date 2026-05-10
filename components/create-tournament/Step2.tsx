import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, ListOrdered } from 'lucide-react-native';
import { TournamentFormat } from '../../services/tournamentService';

const FORMATS: { value: TournamentFormat; label: string; desc: string; icon: any }[] = [
  { 
    value: 'LIGA', 
    label: 'Liga', 
    desc: 'Todos contra todos, tabla de posiciones', 
    icon: ListOrdered 
  },
  { 
    value: 'COPA', 
    label: 'Copa', 
    desc: 'Eliminación directa, partido único', 
    icon: Trophy 
  },
];

interface Props {
  formato: TournamentFormat | '';
  onChange: (v: TournamentFormat) => void;
  error?: string;
}

export default function Step2({ formato, onChange, error }: Props) {
  return (
    <>
      <Text className="text-night font-sans-medium text-base mb-4">
        Selecciona el formato del torneo
      </Text>
      {FORMATS.map((f) => {
        const selected = formato === f.value;
        const Icon = f.icon;
        return (
          <TouchableOpacity
            key={f.value}
            onPress={() => onChange(f.value)}
            activeOpacity={0.8}
            className={`border rounded-2xl px-4 py-5 mb-4 flex-row items-center ${
              selected ? 'border-primary bg-primary-light' : 'border-mist bg-white'
            }`}
            style={!selected ? { shadowColor: '#0F1A14', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 } : {}}
          >
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                selected ? 'bg-white' : 'bg-mist'
              }`}
            >
              <Icon size={24} color={selected ? '#0D7A3E' : '#3D4F44'} />
            </View>
            <View className="flex-1">
              <Text
                className={`font-sans-medium text-sm ${selected ? 'text-primary' : 'text-night'}`}
              >
                {f.label}
              </Text>
              <Text className="text-carbon text-xs mt-0.5">{f.desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </>
  );
}
