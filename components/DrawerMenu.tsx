import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Tournament } from '../services/tournamentService';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

interface Section {
  key: string;
  title: string;
  content: () => React.ReactNode;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  publicTournaments: Tournament[];
  draftTournaments: Tournament[];
  onCreateTournament: () => void;
  onSelectTournament: (id: string) => void;
}

export default function DrawerMenu({
  visible,
  onClose,
  publicTournaments,
  draftTournaments,
  onCreateTournament,
  onSelectTournament,
}: Props) {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const sections: Section[] = [
    {
      key: 'torneos',
      title: 'Torneos',
      content: () => (
        <>
          <TouchableOpacity
            onPress={() => { onClose(); onCreateTournament(); }}
            className="bg-primary rounded-xl px-4 py-2.5 mb-3 flex-row items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-sans-medium text-sm">＋  Crear torneo</Text>
          </TouchableOpacity>
          {publicTournaments.length === 0 ? (
            <Text className="text-carbon text-xs px-1">No hay torneos disponibles.</Text>
          ) : (
            publicTournaments.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { onClose(); onSelectTournament(t.id); }}
                className="py-2.5 border-b border-mist"
                activeOpacity={0.7}
              >
                <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>{t.nombre}</Text>
                <Text className="text-carbon text-xs mt-0.5">{t.zona ?? ''}</Text>
              </TouchableOpacity>
            ))
          )}
        </>
      ),
    },
    {
      key: 'borradores',
      title: 'Mis borradores',
      content: () => (
        draftTournaments.length === 0 ? (
          <Text className="text-carbon text-xs px-1">No tienes borradores.</Text>
        ) : (
          draftTournaments.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => { onClose(); onSelectTournament(t.id); }}
              className="py-2.5 border-b border-mist"
              activeOpacity={0.7}
            >
              <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>{t.nombre}</Text>
              <Text className="text-carbon text-xs mt-0.5">Borrador</Text>
            </TouchableOpacity>
          ))
        )
      ),
    },
  ];

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,26,20,0.5)', opacity }}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
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
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {/* Profile section */}
        <View className="bg-primary pt-14 pb-5 px-5">
          <TouchableOpacity
            onPress={() => { onClose(); router.push('/(profile)'); }}
            className="flex-row items-center"
            activeOpacity={0.8}
          >
            {usuario?.fotoPerfil ? (
              <Image
                source={{ uri: usuario.fotoPerfil }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
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
        </View>

        {/* Sections */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.key} className="mb-5">
              <Text className="text-carbon text-xs font-sans-medium uppercase tracking-widest mb-3">
                {section.title}
              </Text>
              {section.content()}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}