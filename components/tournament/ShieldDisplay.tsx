import { Image, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface Preset {
  readonly id: string;
  readonly color: string;
  readonly icon: string;
}

export const PRESETS: ReadonlyArray<Preset> = [
  { id: 'preset_1', color: '#B91C1C', icon: 'shield' },    // Crimson — classic
  { id: 'preset_2', color: '#1D4ED8', icon: 'star' },      // Royal blue — star
  { id: 'preset_3', color: '#166534', icon: 'award' },     // Forest green — trophy
  { id: 'preset_4', color: '#C2410C', icon: 'zap' },       // Burnt orange — lightning
  { id: 'preset_5', color: '#6D28D9', icon: 'target' },    // Deep purple — bullseye
  { id: 'preset_6', color: '#92400E', icon: 'anchor' },    // Amber — anchor
  { id: 'preset_7', color: '#9D174D', icon: 'compass' },   // Crimson rose — compass
  { id: 'preset_8', color: '#0F766E', icon: 'aperture' },  // Dark teal — aperture
];

const PRESET_MAP = new Map(PRESETS.map((p) => [p.id, p]));

interface Props {
  readonly escudo?: string | null;
  readonly size?: number;
}

export default function ShieldDisplay({ escudo, size = 40 }: Props) {
  const radius = Math.round(size * 0.25);
  const iconSize = Math.round(size * 0.46);

  if (escudo?.startsWith('preset_')) {
    const preset = PRESET_MAP.get(escudo);
    const color = preset?.color ?? '#3D4F44';
    const icon = (preset?.icon ?? 'shield') as any;
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: color,
        }}
      >
        {/* Top stripe — lighter band like a classic football badge */}
        <View
          style={{
            height: size * 0.36,
            backgroundColor: 'rgba(255,255,255,0.18)',
          }}
        />
        {/* Icon centered over the whole badge */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name={icon} size={iconSize} color="rgba(255,255,255,0.95)" />
        </View>
      </View>
    );
  }

  if (escudo) {
    return (
      <Image
        source={{ uri: escudo }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name="shield" size={iconSize} color="#0D7A3E" />
    </View>
  );
}
