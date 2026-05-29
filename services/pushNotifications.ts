import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const PUSH_TOKEN_STORAGE_KEY = 'push-device-token';

/** Temporal: mostrar token FCM en pantalla tras conceder permisos */
export const SHOW_PUSH_TOKEN_DEBUG = true;

export type RegisterPushResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'denied' | 'no_device' | 'no_token' | 'error'; message?: string };

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

/** Obtiene el token FCM del dispositivo (almacenado o en vivo). */
export async function resolveDevicePushToken(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (stored) return stored;

  if (!Device.isDevice) return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const { data } = await Notifications.getDevicePushTokenAsync();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

export async function registerPushDevice(authToken: string): Promise<RegisterPushResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'no_device', message: 'No es un dispositivo físico' };
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Permisos denegados' };
    }

    await ensureAndroidChannel();

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) {
      return { ok: false, reason: 'no_token', message: 'No se obtuvo token FCM' };
    }

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    await api.post(
      '/auth/register-device',
      {
        token,
        dispositivo: Device.modelName ?? Device.deviceName ?? undefined,
      },
      authToken,
    );

    return { ok: true, token };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return { ok: false, reason: 'error', message };
  }
}

/**
 * Desvincula el token en el backend al cerrar sesión.
 * Usa el token guardado o lo pide al dispositivo si aún existe.
 */
export async function unregisterPushDevice(authToken?: string | null): Promise<void> {
  let token = await resolveDevicePushToken();

  if (!token) return;

  if (authToken) {
    try {
      await api.post('/auth/unregister-device', { token }, authToken);
    } catch {
      // JWT expirado u otro error: igual limpiamos local
    }
  }

  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}
