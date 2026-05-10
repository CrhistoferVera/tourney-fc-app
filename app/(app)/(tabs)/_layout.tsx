import { Pressable, View, Text, Image } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Trophy } from 'lucide-react-native';
import BottomTabBar from '../../../components/DrawerMenu';
import { useAuthStore } from '../../../store/authStore';

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

const HeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
    <Pressable onPress={() => {}} style={{ padding: 4 }}>
      <Feather name="bell" size={24} color="#FFFFFF" />
    </Pressable>
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
      <Tabs.Screen name="mis-torneos" options={{ title: 'Mis torneos' }} />
    </Tabs>
  );
}
