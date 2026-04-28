import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, TouchableWithoutFeedback, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

export type DrawerSection = 'inicio' | 'dashboard' | 'torneos' | 'borradores';

interface Props {
  visible: boolean;
  onClose: () => void;
  activeSection: DrawerSection;
  onSelectSection: (section: DrawerSection) => void;
}

const SECTIONS: { key: DrawerSection; label: string; icon: string }[] = [
  { key: 'inicio',      label: 'Inicio',      icon: '' },
  { key: 'dashboard',   label: 'Dashboard',   icon: '' },
  { key: 'torneos',     label: 'Torneos',     icon: '' },
  { key: 'borradores',  label: 'Borradores',  icon: '' },
];

export default function DrawerMenu({ visible, onClose, activeSection, onSelectSection }: Props) {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: visible ? 280 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 280 : 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,26,20,0.5)', opacity,
        }} />
      </TouchableWithoutFeedback>

      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: DRAWER_WIDTH, transform: [{ translateX }],
        backgroundColor: '#FFFFFF', shadowColor: '#0F1A14',
        shadowOpacity: 0.18, shadowRadius: 16, elevation: 12,
      }}>
        <TouchableOpacity
          onPress={() => { onClose(); router.push('/(profile)'); }}
          className="bg-primary pt-14 pb-5 px-5 flex-row items-center"
          activeOpacity={0.8}
        >
          {usuario?.fotoPerfil ? (
            <Image source={{ uri: usuario.fotoPerfil }} style={{ width: 48, height: 48, borderRadius: 24 }} />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary-dark items-center justify-center">
              <Text className="text-white font-sans-medium text-base">
                {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
              </Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-white font-sans-medium text-base" numberOfLines={1}>
              {usuario?.nombre ?? 'Usuario'}
            </Text>
            <Text className="text-primary-light text-xs mt-0.5" numberOfLines={1}>
              {usuario?.email ?? ''}
            </Text>
          </View>
          <Text className="text-primary-light text-base">›</Text>
        </TouchableOpacity>

        <View className="px-3 pt-4">
          <Text className="text-carbon text-xs font-sans-medium uppercase px-2 mb-2">Menú</Text>
          {SECTIONS.map((s) => {
            const active = activeSection === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => { onSelectSection(s.key); onClose(); }}
                activeOpacity={0.75}
                className={`flex-row items-center px-3 py-3.5 rounded-xl mb-1 ${active ? 'bg-primary-light' : ''}`}
              >
                <Text style={{ fontSize: 18, marginRight: 12 }}>{s.icon}</Text>
                <Text className={`font-sans-medium text-sm ${active ? 'text-primary' : 'text-night'}`}>
                  {s.label}
                </Text>
                {active && <View className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}