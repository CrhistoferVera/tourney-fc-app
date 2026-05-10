import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabSection = 'home' | 'explorar' | 'mis-torneos';

interface Props {
  readonly activeSection: TabSection;
  readonly onSelectSection: (section: TabSection) => void;
}

const TABS: { key: string; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'explorar', label: 'Explorar', icon: 'search' },
  { key: 'mis-torneos', label: 'Mis torneos', icon: 'award' },
  { key: 'perfil', label: 'Perfil', icon: 'user' },
];

export default function BottomTabBar({ activeSection, onSelectSection }: Props) {
  const router = useRouter();
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
        const isPerfil = tab.key === 'perfil';
        const isActive = !isPerfil && activeSection === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, alignItems: 'center' }}
            onPress={() => {
              if (isPerfil) {
                router.push('/(profile)');
              } else {
                onSelectSection(tab.key as TabSection);
              }
            }}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon as any}
              size={22}
              color={isActive ? '#0D7A3E' : '#8A9E92'}
            />
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
