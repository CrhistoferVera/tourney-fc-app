import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TournamentFormat, Campo } from '../../services/tournamentService';

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
};

interface Props {
  nombre: string;
  formato: TournamentFormat | '';
  maxEquipos: number;
  fechaInicio: string;
  fechaFin: string;
  zona: string;
  campos: Campo[];
  staffEmails: string[];
  imagenLocal?: string;
}

function toDisplayDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function Step5({
  nombre,
  formato,
  maxEquipos,
  fechaInicio,
  fechaFin,
  zona,
  campos,
  staffEmails,
  imagenLocal,
}: Props) {
  const rows = [
    { icon: 'award', label: 'Formato', value: formato ? FORMAT_LABEL[formato] : '—' },
    { icon: 'users', label: 'Equipos', value: `${maxEquipos} equipos` },
    {
      icon: 'calendar',
      label: 'Período',
      value:
        fechaInicio && fechaFin
          ? `${toDisplayDate(fechaInicio)} - ${toDisplayDate(fechaFin)}`
          : '—',
    },
    { icon: 'map-pin', label: 'Zona', value: zona || '—' },
    {
      icon: 'map',
      label: 'Canchas',
      value: campos.length > 0 ? campos.map((c) => c.nombre).join(', ') : 'Sin canchas',
    },
    { icon: 'shield', label: 'Staff', value: staffEmails.length > 0 ? staffEmails.join(', ') : 'Sin staff' },
  ];

  return (
    <>
      <Text className="text-night font-sans-medium text-base mb-4">Resumen del torneo</Text>

      {/* Hero Card */}
      <View className="bg-primary rounded-3xl p-6 mb-5 items-center overflow-hidden">
        {imagenLocal && (
          <Image 
            source={{ uri: imagenLocal }} 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.35 }}
            resizeMode="cover" 
          />
        )}
        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
            <Feather name="award" size={32} color="white" />
        </View>
        <Text className="text-white font-sans-medium text-xl text-center mb-1">
            {nombre || 'Torneo sin nombre'}
        </Text>
        <View className="bg-black/20 px-3 py-1 rounded-full mt-1">
            <Text className="text-white/90 font-sans text-xs text-center">
                Revisa que todo esté correcto
            </Text>
        </View>
      </View>

      {/* Details Card */}
      <View
        className="bg-white rounded-2xl px-5 py-2 mb-2"
        style={{ shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        {rows.map((row, i) => (
          <View
            key={row.label}
            className={`py-4 flex-row items-center gap-4 ${i < rows.length - 1 ? 'border-b border-mist' : ''}`}
          >
            <View className="w-10 h-10 rounded-xl bg-mist items-center justify-center">
                <Feather name={row.icon as any} size={18} color="#0D7A3E" />
            </View>
            <View className="flex-1">
                <Text className="text-carbon text-xs mb-0.5">{row.label}</Text>
                <Text className="text-night font-sans-medium text-sm">{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
