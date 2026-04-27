import { View, Text, TouchableOpacity } from 'react-native';
import { TournamentFormat } from '../../services/tournamentService';

const FORMATS: { value: TournamentFormat; label: string; desc: string }[] = [
  { value: 'LIGA', label: 'Liga',  desc: 'Todos contra todos, tabla de posiciones' },
  { value: 'COPA', label: 'Copa',  desc: 'Eliminación directa, partido único' },
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
        return (
          <TouchableOpacity
            key={f.value}
            onPress={() => onChange(f.value)}
            activeOpacity={0.8}
            className={`border rounded-2xl px-4 py-4 mb-3 flex-row items-center ${
              selected ? 'border-primary bg-primary-light' : 'border-mist bg-white'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                selected ? 'border-primary' : 'border-carbon'
              }`}
            >
              {selected ? <View className="w-2.5 h-2.5 rounded-full bg-primary" /> : null}
            </View>
            <View>
              <Text className={`font-sans-medium text-sm ${selected ? 'text-primary' : 'text-night'}`}>
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