import { Feather } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface JugadorRow {
  id: string;
  nombre: string;
  fotoPerfil: string | null;
  email?: string;
}

interface Props {
  readonly jugadores: JugadorRow[];
  readonly capitanId: string | null;
  readonly selectedIds: string[];
  readonly onChange: (ids: string[]) => void;
  readonly min: number;
  readonly max: number;
  readonly onLockedToggle?: () => void;
}

export default function RosterSelector({
  jugadores,
  capitanId,
  selectedIds,
  onChange,
  min,
  max,
  onLockedToggle,
}: Props) {
  const count = selectedIds.length;
  const outOfRange = count < min || count > max;
  const counterColor = outOfRange ? '#E53935' : '#0D7A3E';
  const counterBg = outOfRange ? '#FEE2E2' : '#D4F5E2';

  const toggle = (id: string) => {
    if (id === capitanId) {
      onLockedToggle?.();
      return;
    }
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (count >= max) return;
      onChange([...selectedIds, id]);
    }
  };

  return (
    <View>
      <View
        style={{
          backgroundColor: counterBg,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Feather name="users" size={16} color={counterColor} />
        <Text style={{ color: counterColor, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
          {count} seleccionado{count === 1 ? '' : 's'} — mín {min} / máx {max}
        </Text>
      </View>

      <View
        className="bg-white rounded-2xl overflow-hidden"
        style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
      >
        {jugadores.length === 0 ? (
          <Text className="text-carbon text-sm text-center py-6 px-4">
            Este equipo no tiene jugadores aún. Invita gente desde Mis equipos.
          </Text>
        ) : (
          jugadores.map((j, idx) => {
            const isLast = idx === jugadores.length - 1;
            const isCap = capitanId === j.id;
            const selected = selectedIds.includes(j.id);
            const canAdd = selected || count < max;
            return (
              <TouchableOpacity
                key={j.id}
                onPress={() => toggle(j.id)}
                activeOpacity={isCap ? 1 : 0.7}
                disabled={!canAdd && !isCap}
                className={`flex-row items-center px-3 py-3 ${isLast ? '' : 'border-b border-mist'}`}
                style={{ opacity: !canAdd && !isCap ? 0.45 : 1 }}
              >
                {/* Checkbox */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: selected ? '#0D7A3E' : '#A8B5AE',
                    backgroundColor: selected ? '#0D7A3E' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {selected && <Feather name="check" size={14} color="white" />}
                </View>

                {/* Avatar */}
                {j.fotoPerfil ? (
                  <Image
                    source={{ uri: j.fotoPerfil }}
                    style={{ width: 34, height: 34, borderRadius: 17 }}
                  />
                ) : (
                  <View className="w-9 h-9 rounded-full bg-mist items-center justify-center">
                    <Text className="text-carbon text-sm font-sans-medium">
                      {j.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-night text-sm font-sans-medium" numberOfLines={1}>
                      {j.nombre}
                    </Text>
                    {isCap && (
                      <View className="flex-row items-center gap-0.5 bg-accent-soft px-1.5 py-0.5 rounded-full">
                        <Feather name="star" size={9} color="#F5820D" />
                        <Text className="text-accent text-[10px] font-sans-medium">Capitán</Text>
                      </View>
                    )}
                  </View>
                  {!!j.email && (
                    <Text className="text-carbon text-xs" numberOfLines={1}>
                      {j.email}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}
