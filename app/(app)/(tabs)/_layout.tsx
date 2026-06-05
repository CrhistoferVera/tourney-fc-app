import { Pressable, View, Text, Image } from 'react-native';
import { router, Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Inbox, Link, Trophy } from 'lucide-react-native';
import BottomTabBar from '../../../components/DrawerMenu';
import { useAuthStore } from '../../../store/authStore';
import { inboxService } from '../../../services/inboxService';

const renderTabBar = () => <BottomTabBar />;

const HeaderLogo = () => (
  <Pressable onPress={() => {}} className="ml-4 mx-5 p-2 border border-white/50 rounded-full ">
    <Trophy size={36} color="#FFFFFF" />
  </Pressable>
);

const HeaderAvatar = () => {
  const { usuario } = useAuthStore();
  const router = useRouter();
  const initials = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Pressable onPress={() => router.push('/(profile)')} className='mr-8 ml-4 '>
      {usuario?.fotoPerfil ? (
        <Image
          source={{ uri: usuario.fotoPerfil }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.5)',
          }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_500Medium' }}>
            {initials}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const InboxButton = () => {
  const [hasNotifications, setHasNotifications] = useState(false);
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      setHasNotifications(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const data = await inboxService.getInvitaciones();
        if (!cancelled) setHasNotifications(data.length > 0);
      } catch {
        /* silencioso */
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // Revisa al montar, al navegar entre pantallas y cada 30s
  }, [pathname, token]);

  return (
    <Pressable onPress={() => router.push('/inbox')} style={{ padding: 4 }}>
      <Inbox size={24} color="#FFFFFF" />
      {hasNotifications && (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: '#FACC15',
            borderWidth: 1.5,
            borderColor: '#0D7A3E',
          }}
        />
      )}
    </Pressable>
  );
};

const HeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
    <InboxButton />
    <HeaderAvatar />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerStyle: { backgroundColor: '#0D7A3E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontFamily: 'Inter_500Medium', fontSize: 20 },
        headerShadowVisible: false,
        headerRight: HeaderRight,
        headerLeft: HeaderLogo,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="mis-equipos" options={{ title: 'Mis equipos' }} />
      <Tabs.Screen name="mis-torneos" options={{ title: 'Mis torneos' }} />
    </Tabs>
  );
}
