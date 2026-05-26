import { type ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Jugador, EstadisticasTorneo } from '../../services/teamsService';

const STAT_COL = 36;

function CardIcon({ color }: { readonly color: string }) {
  return (
    <View
      style={{
        width: 9,
        height: 13,
        borderRadius: 1.5,
        backgroundColor: color,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.15)',
      }}
    />
  );
}

function StatHeaderIcon({ children }: { readonly children: ReactNode }) {
  return (
    <View style={{ width: STAT_COL, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function StatValue({ value }: { readonly value: number }) {
  return (
    <View style={{ width: STAT_COL, alignItems: 'center' }}>
      <Text className="text-night font-sans-medium text-sm">{value}</Text>
    </View>
  );
}

function JugadorAvatar({ fotoPerfil }: { readonly fotoPerfil: string | null }) {
  if (fotoPerfil) {
    return (
      <Image
        source={{ uri: fotoPerfil }}
        style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
      />
    );
  }
  return (
    <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-2">
      <Feather name="user" size={14} color="#0D7A3E" />
    </View>
  );
}

interface Props {
  readonly jugadores: Jugador[];
  readonly capitanId?: string | null;
}

export default function JugadoresStatsTable({ jugadores, capitanId }: Props) {
  const stats = (j: Jugador): EstadisticasTorneo =>
    j.estadisticas ?? {
      goles: 0,
      asistencias: 0,
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
    };

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View className="flex-row items-center px-3 py-2.5 bg-mist border-b border-mist">
        <Text className="text-carbon text-xs font-sans-medium flex-1">Jugador</Text>
        <StatHeaderIcon>
          <CardIcon color="#E53935" />
        </StatHeaderIcon>
        <StatHeaderIcon>
          <CardIcon color="#F5C518" />
        </StatHeaderIcon>
        <StatHeaderIcon>
          <MaterialCommunityIcons name="soccer" size={16} color="#0D7A3E" />
        </StatHeaderIcon>
        <StatHeaderIcon>
          <MaterialCommunityIcons name="shoe-print" size={16} color="#3D4F44" />
        </StatHeaderIcon>
      </View>

      {jugadores.map((jugador, index) => {
        const s = stats(jugador);
        const isCapitan = jugador.id === capitanId;
        const isLast = index === jugadores.length - 1;
        return (
          <View
            key={jugador.id}
            className={`flex-row items-center px-3 py-3 ${isLast ? '' : 'border-b border-mist'}`}
          >
            <View className="flex-1 flex-row items-center pr-2">
              <JugadorAvatar fotoPerfil={jugador.fotoPerfil} />
              <View className="flex-1">
                <Text className="text-night font-sans-medium text-sm" numberOfLines={2}>
                  {jugador.nombre}
                </Text>
                {isCapitan && (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Feather name="star" size={9} color="#0D7A3E" />
                    <Text className="text-primary text-xs">Capitán</Text>
                  </View>
                )}
              </View>
            </View>
            <StatValue value={s.tarjetasRojas} />
            <StatValue value={s.tarjetasAmarillas} />
            <StatValue value={s.goles} />
            <StatValue value={s.asistencias} />
          </View>
        );
      })}
    </View>
  );
}
