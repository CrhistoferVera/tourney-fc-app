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

/** Rueda scrollable que ajusta (snap) al valor central, estilo reloj de alarma. */
function Wheel({
  data,
  selected,
  onSelect,
}: {
  data: number[];
  selected: number;
  onSelect: (val: number) => void;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = data.indexOf(selected);
    if (idx >= 0) {
      // Posicionar sin animación al abrir
      requestAnimationFrame(() => {
        ref.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
      });
    }
  }, [selected, data]);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const val = data[clamped];
    if (val !== selected) onSelect(val);
    ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ height: PICKER_HEIGHT, width: 72 }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingVertical: PAD * ITEM_HEIGHT }}
      >
        {data.map((val) => {
          const isSel = val === selected;
          return (
            <View
              key={val}
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
            </View>
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
  const [draft, setDraft] = useState(() => parseTime(value));

  // Al abrir, sincronizar el borrador con el valor actual
  useEffect(() => {
    if (visible) setDraft(parseTime(value));
  }, [visible, value]);

  const confirm = () => {
    onChange(`${pad2(draft.h)}:${pad2(draft.m)}`);
    onClose();
  };

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
                  selected={draft.h}
                  onSelect={(h) => setDraft((d) => ({ ...d, h }))}
                />
                <Text style={{ fontSize: 26, fontWeight: '700', color: '#0F1A14' }}>:</Text>
                <Wheel
                  data={MINUTES}
                  selected={draft.m}
                  onSelect={(m) => setDraft((d) => ({ ...d, m }))}
                />
              </View>
            </View>

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
