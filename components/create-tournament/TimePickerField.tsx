import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface Props {
  label: string;
  value: string; // "HH:MM" o ""
  onChange: (time: string) => void;
  editable?: boolean;
  error?: string;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5; // filas visibles (impar para tener una central)
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD = Math.floor(VISIBLE_ITEMS / 2);

const pad2 = (n: number) => n.toString().padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseTime(value: string): { h: number; m: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value ?? '');
  if (match) return { h: Number(match[1]), m: Number(match[2]) };
  return { h: 12, m: 0 }; // valor por defecto razonable
}

const clampIndex = (idx: number, len: number) => Math.max(0, Math.min(len - 1, idx));

/**
 * Rueda scrollable estilo reloj de alarma. Mantiene su propio índice resaltado
 * (no se controla desde fuera para no pelear con el gesto del usuario) y solo
 * informa la selección al soltar el scroll o al tocar un número.
 */
function Wheel({
  data,
  initialValue,
  onSelect,
}: {
  data: number[];
  initialValue: number;
  onSelect: (val: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const didInit = useRef(false);
  const [selectedIdx, setSelectedIdx] = useState(() =>
    clampIndex(data.indexOf(initialValue), data.length),
  );

  // Posicionar en el valor inicial una sola vez, cuando el contenido ya está medido.
  const handleContentSize = () => {
    if (didInit.current) return;
    didInit.current = true;
    const idx = clampIndex(data.indexOf(initialValue), data.length);
    ref.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
  };

  // Resaltado en vivo mientras se desplaza.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clampIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT), data.length);
    if (idx !== selectedIdx) setSelectedIdx(idx);
  };

  // Confirmar selección al detenerse.
  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clampIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT), data.length);
    setSelectedIdx(idx);
    onSelect(data[idx]);
  };

  const selectByTap = (idx: number) => {
    setSelectedIdx(idx);
    onSelect(data[idx]);
    ref.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ height: PICKER_HEIGHT, width: 72 }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        onScroll={handleScroll}
        onMomentumScrollEnd={handleEnd}
        onContentSizeChange={handleContentSize}
        contentContainerStyle={{ paddingVertical: PAD * ITEM_HEIGHT }}
      >
        {data.map((val, i) => {
          const isSel = i === selectedIdx;
          return (
            <TouchableOpacity
              key={val}
              activeOpacity={0.7}
              onPress={() => selectByTap(i)}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  fontSize: isSel ? 26 : 20,
                  fontFamily: isSel ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: isSel ? '#0D7A3E' : '#9CA3AF',
                }}
              >
                {pad2(val)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function TimePickerField({
  label,
  value,
  onChange,
  editable = true,
  error,
  visible,
  onOpen,
  onClose,
}: Props) {
  // El borrador se mantiene en refs vivos mediante las ruedas; aquí guardamos
  // el valor confirmado al vuelo a partir de cada rueda.
  const draftRef = useRef(parseTime(value));

  // Al abrir, reiniciar el borrador al valor actual (importante en modo edición o reapertura).
  useEffect(() => {
    if (visible) draftRef.current = parseTime(value);
  }, [visible, value]);

  const confirm = () => {
    const { h, m } = draftRef.current;
    onChange(`${pad2(h)}:${pad2(m)}`);
    onClose();
  };

  const initial = parseTime(value);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#3D4F44', fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={editable ? onOpen : undefined}
        disabled={!editable}
        style={{
          backgroundColor: editable ? 'white' : '#F3F4F6',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#EBF0EC',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: value ? (editable ? '#0F1A14' : '#9CA3AF') : '#9CA3AF',
          }}
        >
          {value || 'HH:MM'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3 }}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 28,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#E5E7EB',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#0F1A14',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {label}
            </Text>

            {/* Las ruedas se montan frescas en cada apertura para posicionarse bien */}
            {visible && (
              <View style={{ height: PICKER_HEIGHT, justifyContent: 'center' }}>
                {/* Banda central que resalta la selección */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 32,
                    right: 32,
                    top: PAD * ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    borderRadius: 12,
                    backgroundColor: '#D4F5E2',
                  }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Wheel
                    data={HOURS}
                    initialValue={initial.h}
                    onSelect={(h) => {
                      draftRef.current = { ...draftRef.current, h };
                    }}
                  />
                  <Text style={{ fontSize: 26, fontWeight: '700', color: '#0F1A14' }}>:</Text>
                  <Wheel
                    data={MINUTES}
                    initialValue={initial.m}
                    onSelect={(m) => {
                      draftRef.current = { ...draftRef.current, m };
                    }}
                  />
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#EBF0EC',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#3D4F44', fontWeight: '500', fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirm}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#0D7A3E',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
