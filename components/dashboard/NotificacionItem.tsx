import { View, Text } from 'react-native';

interface Props {
  mensaje: string;
  leida: boolean;
  fecha: string;
}

const formatRelativa = (fecha: string) => {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return 'Hace unos minutos';
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  return 'Ayer';
};

export default function NotificacionItem({ mensaje, leida, fecha }: Props) {
  return (
    <View className="flex-row items-start px-4 py-3 border-b border-mist">
      <Text className="text-lg mr-3 mt-0.5">🔔</Text>
      <View className="flex-1">
        <Text className={`text-sm ${leida ? 'text-carbon' : 'text-night font-sans-medium'}`}>
          {mensaje}
        </Text>
        <Text className="text-carbon text-xs mt-1">{formatRelativa(fecha)}</Text>
      </View>
      {!leida && <View className="w-2 h-2 rounded-full bg-accent mt-1.5 ml-2" />}
    </View>
  );
}
