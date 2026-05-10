import { Tabs } from 'expo-router';
import BottomTabBar from '../../../components/DrawerMenu';

const renderTabBar = () => <BottomTabBar />;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerStyle: { backgroundColor: '#0D7A3E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontFamily: 'Inter_500Medium', fontSize: 20 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="mis-torneos" options={{ title: 'Mis torneos' }} />
    </Tabs>
  );
}
