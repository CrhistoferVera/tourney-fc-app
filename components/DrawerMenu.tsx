import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Feather } from '@expo/vector-icons';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

export type DrawerSection = 'explorar' | 'dashboard';

interface Props {
  visible: boolean;
  onClose: () => void;
  activeSection: DrawerSection;
  onSelectSection: (section: DrawerSection) => void;
}

const SECTIONS: { key: DrawerSection; label: string; icon: string }[] = [
  { key: 'explorar', label: 'Explorar', icon: 'compass' },
  { key: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
];

export default function DrawerMenu({ visible, onClose, activeSection, onSelectSection }: Props) {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,26,20,0.55)',
            opacity,
          }}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          transform: [{ translateX }],
          backgroundColor: '#FFFFFF',
          shadowColor: '#0F1A14',
          shadowOpacity: 0.22,
          shadowRadius: 20,
          shadowOffset: { width: 4, height: 0 },
          elevation: 16,
        }}
      >
        {/* Perfil */}
        <TouchableOpacity
          onPress={() => {
            onClose();
            setTimeout(() => router.push('/(profile)'), 250);
          }}
          activeOpacity={0.85}
        >
          <View className="bg-primary pt-14 pb-5 px-5 flex-row items-center">
            {usuario?.fotoPerfil ? (
              <Image
                source={{ uri: usuario.fotoPerfil }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_500Medium' }}>
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
            <Feather name="chevron-right" size={18} color="rgba(212,245,226,0.7)" />
          </View>
        </TouchableOpacity>

        {/* Secciones */}
        <View className="px-3 pt-5">
          <Text
            style={{
              color: '#3D4F44',
              fontSize: 11,
              fontFamily: 'Inter_500Medium',
              letterSpacing: 1,
              textTransform: 'uppercase',
              paddingHorizontal: 8,
              marginBottom: 6,
            }}
          >
            Menú
          </Text>
          {SECTIONS.map((s, i) => {
            const active = activeSection === s.key;
            return (
              <SectionItem
                key={s.key}
                section={s}
                active={active}
                onPress={() => {
                  onSelectSection(s.key);
                  onClose();
                }}
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

function SectionItem({
  section,
  active,
  onPress,
}: {
  section: { key: string; label: string; icon: string };
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          backgroundColor: active ? '#D4F5E2' : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 14,
          borderRadius: 12,
          marginBottom: 4,
        }}
      >
        <Feather
          name={section.icon as any}
          size={18}
          color={active ? '#0D7A3E' : '#3D4F44'}
          style={{ marginRight: 12 }}
        />
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: active ? '#0D7A3E' : '#0F1A14',
            flex: 1,
          }}
        >
          {section.label}
        </Text>
        {active && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0D7A3E' }} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
