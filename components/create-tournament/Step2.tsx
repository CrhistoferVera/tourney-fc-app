import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, ListOrdered, Users } from 'lucide-react-native';
import { TournamentFormat, TournamentModality } from '../../services/tournamentService';

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

const MODALIDADES: { value: TournamentModality; label: string; jugadores: number; maxJugadores: number }[] = [
  { value: 'FUTBOL_5', label: 'Fútbol 5', jugadores: 5, maxJugadores: 10 },
  { value: 'FUTBOL_7', label: 'Fútbol 7', jugadores: 7, maxJugadores: 14 },
  { value: 'FUTBOL_11', label: 'Fútbol 11', jugadores: 11, maxJugadores: 22 },
];

interface Props {
  formato: TournamentFormat | '';
  modalidad: TournamentModality | '';
  onChange: (v: TournamentFormat) => void;
  onChangeModalidad: (v: TournamentModality) => void;
  error?: string;
}

export default function Step2({ formato, modalidad, onChange, onChangeModalidad, error }: Props) {
  const selectedModalidad = MODALIDADES.find((m) => m.value === modalidad);

  return (
    <>
      {/* Formato */}
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

      {/* Separador */}
      <View className="h-px bg-mist my-2" />

      {/* Modalidad */}
      <Text className="text-night font-sans-medium text-base mt-4 mb-4">
        Modalidad de juego
      </Text>
      <View className="flex-row gap-3 mb-2">
        {MODALIDADES.map((m) => {
          const selected = modalidad === m.value;
          return (
            <TouchableOpacity
              key={m.value}
              onPress={() => onChangeModalidad(m.value)}
              activeOpacity={0.8}
              className={`flex-1 border rounded-2xl py-4 items-center ${
                selected ? 'border-primary bg-primary-light' : 'border-mist bg-white'
              }`}
              style={!selected ? { shadowColor: '#0F1A14', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 } : {}}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                  selected ? 'bg-white' : 'bg-mist'
                }`}
              >
                <Users size={20} color={selected ? '#0D7A3E' : '#3D4F44'} />
              </View>
              <Text
                className={`font-sans-medium text-sm ${selected ? 'text-primary' : 'text-night'}`}
              >
                {m.label}
              </Text>
              <Text className="text-carbon text-xs mt-0.5">{m.jugadores} vs {m.jugadores}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info de máximo de jugadores */}
      {selectedModalidad && (
        <View className="mt-3 bg-primary-light border border-primary/30 rounded-xl px-4 py-3 flex-row items-center">
          <Users size={16} color="#0D7A3E" />
          <Text className="text-primary text-xs font-sans-medium ml-2 flex-1">
            Máximo <Text className="font-sans-bold">{selectedModalidad.maxJugadores} jugadores</Text> por equipo (titular + suplentes)
          </Text>
        </View>
      )}

      {error ? <Text className="text-danger text-xs mt-3">{error}</Text> : null}
    </>
  );
}
