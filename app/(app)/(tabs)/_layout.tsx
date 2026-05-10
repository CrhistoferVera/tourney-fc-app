import { Tabs } from 'expo-router';
import BottomTabBar from '../../../components/DrawerMenu';

export default function TabsLayout() {
  return (
    <Tabs tabBar={() => <BottomTabBar />}>
      <Tabs.Screen name="home" options={{ headerShown: false }} />
      <Tabs.Screen name="explorar" options={{ headerShown: false }} />
      <Tabs.Screen name="mis-torneos" options={{ headerShown: false }} />
    </Tabs>
  );
}
