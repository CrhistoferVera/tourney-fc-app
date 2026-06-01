import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../store/authStore';
import { KeyboardProvider } from 'react-native-keyboard-controller';

SplashScreen.preventAutoHideAsync();

// Extrae el código de invitación de un deep link entrante
// (tourneyfcapp://team/join?code=XXX  o  .../join/XXX).
function extractInviteCode(url: string): string | null {
  const { queryParams, path } = Linking.parse(url);
  const fromQuery = queryParams?.code;
  if (fromQuery) return String(fromQuery);
  if (path) {
    const match = /join\/([^/?#]+)/.exec(path);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

function AuthGuard() {
  const {
    token,
    pendingInviteCode,
    setPendingInviteCode,
    clearPendingInviteCode,
  } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const url = Linking.useURL();

  // Captura el código del deep link y lo guarda hasta que haya sesión.
  useEffect(() => {
    if (!url) return;
    const code = extractInviteCode(url);
    if (code) setPendingInviteCode(code);
  }, [url]);

  useEffect(() => {
    const inApp = segments[0] === '(app)';
    const inAuth = segments[0] === '(auth)';

    if (!token && inApp) {
      router.replace('/welcome');
      return;
    }

    if (token) {
      // Si hay una invitación pendiente, llevar directo a unirse al equipo.
      if (pendingInviteCode) {
        const code = pendingInviteCode;
        clearPendingInviteCode();
        router.replace({ pathname: '/(app)/team/join', params: { code } } as never);
        return;
      }
      if (inAuth || segments[0] === undefined) {
        router.replace('/(app)/(tabs)/home');
      }
    }
  }, [token, segments, pendingInviteCode]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <KeyboardProvider>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </KeyboardProvider>
  );
}
