import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home', href: '/(app)/(tabs)/home' },
  { key: 'explorar', label: 'Explorar', icon: 'search', href: '/(app)/(tabs)/explorar' },
  { key: 'mis-torneos', label: 'Mis torneos', icon: 'award', href: '/(app)/(tabs)/mis-torneos' },
  { key: 'perfil', label: 'Perfil', icon: 'user', href: '/(profile)' },
] as const;

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8F0EC',
        paddingTop: 10,
        paddingBottom: bottom + 8,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
        elevation: 8,
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.key === 'home'
            ? pathname === '/home' || pathname === '/'
            : pathname.includes(`/${tab.key}`);

        return (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, alignItems: 'center' }}
            onPress={() => router.navigate(tab.href as never)}
            activeOpacity={0.7}
          >
            <Feather name={tab.icon as any} size={22} color={isActive ? '#0D7A3E' : '#8A9E92'} />
            <Text
              style={{
                fontSize: 11,
                marginTop: 4,
                fontFamily: isActive ? 'Inter_500Medium' : undefined,
                color: isActive ? '#0D7A3E' : '#8A9E92',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
