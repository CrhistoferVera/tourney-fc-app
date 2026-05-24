import { View, Text, TouchableOpacity } from 'react-native';
import { Trophy, ListOrdered, Users, Zap, Shield } from 'lucide-react-native';
import { TournamentFormat, TournamentModality } from '../../services/tournamentService';

// Colores unificados (Tema del Paso 2: Naranja)
const FORMATS: { value: TournamentFormat; label: string; desc: string; icon: any; color: string; bg: string; borderSelected: string }[] = [
  {
    value: 'LIGA',
    label: 'Liga',
    desc: 'Todos contra todos, tabla de posiciones',
    icon: ListOrdered,
    color: '#F5820D',
    bg: '#FEF0DC',
    borderSelected: '#F5820D',
  },
  {
    value: 'COPA',
    label: 'Copa',
    desc: 'Eliminación directa, partido único',
    icon: Trophy,
    color: '#F5820D',
    bg: '#FEF0DC',
    borderSelected: '#F5820D',
  },
];

// Modalidades también usan el tema del paso 2
const MODALIDADES: { value: TournamentModality; label: string; jugadores: number; maxJugadores: number; color: string; bg: string; icon: any }[] = [
  { value: 'FUTBOL_5', label: 'Fútbol 5', jugadores: 5, maxJugadores: 10, color: '#F5820D', bg: '#FEF0DC', icon: Zap },
  { value: 'FUTBOL_7', label: 'Fútbol 7', jugadores: 7, maxJugadores: 14, color: '#F5820D', bg: '#FEF0DC', icon: Shield },
  { value: 'FUTBOL_11', label: 'Fútbol 11', jugadores: 11, maxJugadores: 22, color: '#F5820D', bg: '#FEF0DC', icon: Users },
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
            style={{
              borderWidth: 1.5,
              borderColor: selected ? f.borderSelected : '#EBF0EC',
              backgroundColor: selected ? f.bg : '#FFFFFF',
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 18,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: selected ? 0 : 2,
              shadowColor: '#0F1A14',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: selected ? f.bg : '#EBF0EC',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Icon size={24} color={selected ? f.color : '#3D4F44'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 14,
                  color: selected ? f.color : '#0F1A14',
                }}
              >
                {f.label}
              </Text>
              <Text style={{ color: '#3D4F44', fontSize: 12, marginTop: 2 }}>{f.desc}</Text>
            </View>
            {/* Indicador seleccionado */}
            {selected && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: f.color,
                  marginLeft: 8,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}

      {/* Separador */}
      <View style={{ height: 1, backgroundColor: '#EBF0EC', marginVertical: 8 }} />

      {/* Modalidad */}
      <Text className="text-night font-sans-medium text-base mt-4 mb-4">
        Modalidad de juego
      </Text>
      <View className="flex-row gap-3 mb-2">
        {MODALIDADES.map((m) => {
          const selected = modalidad === m.value;
          const Icon = m.icon;
          return (
            <TouchableOpacity
              key={m.value}
              onPress={() => onChangeModalidad(m.value)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: selected ? m.color : '#EBF0EC',
                backgroundColor: selected ? m.bg : '#FFFFFF',
                borderRadius: 18,
                paddingVertical: 16,
                alignItems: 'center',
                elevation: selected ? 0 : 2,
                shadowColor: '#0F1A14',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: selected ? m.bg : '#EBF0EC',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Icon size={20} color={selected ? m.color : '#3D4F44'} />
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                  color: selected ? m.color : '#0F1A14',
                }}
              >
                {m.label}
              </Text>
              <Text style={{ color: '#3D4F44', fontSize: 11, marginTop: 2 }}>
                {m.jugadores} vs {m.jugadores}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info de máximo de jugadores */}
      {selectedModalidad && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: selectedModalidad.bg,
            borderWidth: 1,
            borderColor: selectedModalidad.color + '44',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <selectedModalidad.icon size={14} color={selectedModalidad.color} />
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 12,
                color: selectedModalidad.color,
              }}
            >
              Requisitos por equipo — {selectedModalidad.label}
            </Text>
          </View>

          {/* Mínimo */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: selectedModalidad.color + '22',
            }}
          >
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#3D4F44' }}>
              Jugadores titulares (mínimo)
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: selectedModalidad.color }}>
              {selectedModalidad.jugadores} jug.
            </Text>
          </View>

          {/* Máximo */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#3D4F44' }}>
              Plantilla completa (máximo)
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: selectedModalidad.color }}>
              {selectedModalidad.maxJugadores} jug.
            </Text>
          </View>
        </View>
      )}

      {error ? <Text className="text-danger text-xs mt-3">{error}</Text> : null}
    </>
  );
}
