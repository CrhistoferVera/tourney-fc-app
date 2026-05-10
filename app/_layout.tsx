import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { token } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inApp = segments[0] === '(app)';
    const inAuth = segments[0] === '(auth)';

    if (!token && inApp) {
      router.replace('/welcome');
    }
    if (token && (inAuth || segments[0] === undefined)) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [token, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
