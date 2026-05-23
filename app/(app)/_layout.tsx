import { Stack } from 'expo-router';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function AppLayout() {
  usePushNotifications();
  return <Stack screenOptions={{ headerShown: false }} />;
}
