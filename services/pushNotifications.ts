import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const PUSH_TOKEN_STORAGE_KEY = 'push-device-token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

/**
 * Solicita permiso (si hace falta), obtiene el token FCM nativo y lo registra en el backend.
 * Si el usuario deniega el permiso, la app sigue funcionando sin push.
 */
export async function registerPushDevice(authToken: string): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    await ensureAndroidChannel();

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return;

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    await api.post(
      '/auth/register-device',
      {
        token,
        dispositivo: Device.modelName ?? Device.deviceName ?? undefined,
      },
      authToken,
    );
  } catch {
    // Push es opcional: no bloquear login ni navegación
  }
}

/**
 * Desvincula el token del usuario en el backend (logout en este dispositivo).
 */
export async function unregisterPushDevice(authToken?: string | null): Promise<void> {
  const token = await getStoredPushToken();
  if (!token) return;

  if (authToken) {
    try {
      await api.post('/auth/unregister-device', { token }, authToken);
    } catch {
      // Si el JWT ya expiró, igual limpiamos el almacenamiento local
    }
  }

  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}
