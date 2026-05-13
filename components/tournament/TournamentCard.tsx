import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tournament } from '../../services/tournamentService';
import StatusBadge from './StatusBadge';

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

const ROL_LABEL: Record<string, string> = {
  ORGANIZADOR: 'Organizador',
  STAFF:       'Staff',
  CAPITAN:     'Capitán',
  JUGADOR:     'Jugador',
};

const ROL_STYLE: Record<string, { bg: string; text: string }> = {
  ORGANIZADOR: { bg: 'bg-primary',      text: 'text-white' },
  STAFF:       { bg: 'bg-accent',       text: 'text-white' },
  CAPITAN:     { bg: 'bg-info',         text: 'text-white' },
  JUGADOR:     { bg: 'bg-primary-light', text: 'text-primary' },
};

// Color del placeholder cuando no hay imagen
const ESTADO_PLACEHOLDER: Record<string, string> = {
  EN_CURSO:      '#0D7A3E',
  EN_INSCRIPCION: '#F59E0B',
  BORRADOR:      '#3D4F44',
  FINALIZADO:    '#9CA3AF',
};

interface Props {
  readonly item: Tournament;
  readonly onPress: () => void;
  readonly onInscribirse?: () => void;
}

export default function TournamentCard({ item, onPress, onInscribirse }: Props) {
  const rol    = item.rolUsuario;
  const rolCfg = rol ? (ROL_STYLE[rol] ?? { bg: 'bg-mist', text: 'text-carbon' }) : null;
  const placeholderColor = ESTADO_PLACEHOLDER[item.estado] ?? '#3D4F44';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{ shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      {/* Portada */}
      {item.imagen ? (
        <Image
          source={{ uri: item.imagen }}
          className="w-full"
          style={{ height: 130 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full items-center justify-center"
          style={{ height: 90, backgroundColor: placeholderColor, opacity: 0.85 }}
        >
          <Feather name="award" size={36} color="rgba(255,255,255,0.6)" />
        </View>
      )}

      {/* Contenido */}
      <View className="px-4 pt-3 pb-4">
        {/* Nombre + estado */}
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-night font-sans-medium text-base flex-1 mr-2" numberOfLines={1}>
            {item.nombre}
          </Text>
          <StatusBadge estado={item.estado} />
        </View>

        {/* Meta */}
        <Text className="text-carbon text-xs mt-0.5">
          {FORMAT_LABEL[item.formato] ?? item.formato} · {item.maxEquipos} equipos
          {item.zona ? `  ·  ${item.zona}` : ''}
        </Text>

        {/* Badge de participación */}
        {!!rol && !!rolCfg && (
          <View className="flex-row mt-2">
            <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${rolCfg.bg}`}>
              <Feather name="user-check" size={11} color={rol === 'JUGADOR' ? '#0D7A3E' : 'white'} />
              <Text className={`text-xs font-sans-medium ${rolCfg.text}`}>
                {ROL_LABEL[rol] ?? rol}
              </Text>
            </View>
          </View>
        )}

        {/* Botón inscribirse — solo si no es miembro y el torneo acepta inscripciones */}
        {!rol && item.estado === 'EN_INSCRIPCION' && !!onInscribirse && (
          <TouchableOpacity
            onPress={onInscribirse}
            activeOpacity={0.85}
            className="bg-primary rounded-xl py-2 mt-3 flex-row items-center justify-center gap-2"
          >
            <Feather name="user-plus" size={14} color="white" />
            <Text className="text-white font-sans-medium text-sm">Inscribir mi equipo</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
