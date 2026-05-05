import { View, Text } from 'react-native';

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  BORRADOR: { label: 'Borrador', bg: 'bg-carbon', text: 'text-white' },
  EN_INSCRIPCION: { label: 'Inscripción', bg: 'bg-accent-soft', text: 'text-accent' },
  EN_CURSO: { label: 'Activo', bg: 'bg-primary-light', text: 'text-primary' },
  FINALIZADO: { label: 'Finalizado', bg: 'bg-mist', text: 'text-carbon' },
};

export default function StatusBadge({ estado }: { estado: string }) {
  const s = STATUS_STYLE[estado] ?? { label: estado, bg: 'bg-mist', text: 'text-carbon' };
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.bg}`}>
      <Text className={`text-xs font-sans-medium ${s.text}`}>{s.label}</Text>
    </View>
  );
}
