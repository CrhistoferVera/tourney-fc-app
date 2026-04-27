import { View, Text } from 'react-native';
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
}

function toDisplayDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function Step5({ nombre, formato, maxEquipos, fechaInicio, fechaFin, zona, campos, staffEmails }: Props) {
  const rows = [
    { label: 'Nombre',   value: nombre || '—' },
    { label: 'Formato',  value: formato ? FORMAT_LABEL[formato] : '—' },
    { label: 'Equipos',  value: `${maxEquipos} equipos` },
    { label: 'Período',  value: fechaInicio && fechaFin ? `${toDisplayDate(fechaInicio)} - ${toDisplayDate(fechaFin)}` : '—' },
    { label: 'Zona',     value: zona || '—' },
    { label: 'Canchas',  value: campos.length > 0 ? campos.map((c) => c.nombre).join(', ') : 'Sin canchas' },
    { label: 'Staff',    value: staffEmails.length > 0 ? staffEmails.join(', ') : 'Sin staff' },
  ];

  return (
    <>
      <Text className="text-night font-sans-medium text-base mb-4">Resumen del torneo</Text>
      <View
        className="bg-white rounded-2xl px-4 py-2 border border-mist"
        style={{ shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
      >
        {rows.map((row, i) => (
          <View key={row.label} className={`py-3 ${i < rows.length - 1 ? 'border-b border-mist' : ''}`}>
            <Text className="text-carbon text-xs mb-0.5">{row.label}</Text>
            <Text className="text-night font-sans-medium text-sm">{row.value}</Text>
          </View>
        ))}
      </View>
    </>
  );
}