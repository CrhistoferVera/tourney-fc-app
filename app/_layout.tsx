import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import '../global.css';

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
      router.replace('/(app)/home');
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