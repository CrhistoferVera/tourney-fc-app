import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  registerPushDevice,
  SHOW_PUSH_TOKEN_DEBUG,
} from '../services/pushNotifications';

/**
 * Tras login o al reabrir la app con sesión persistida, sincroniza el token FCM con el backend.
 */
export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    registerPushDevice(token).then((result) => {
      if (!SHOW_PUSH_TOKEN_DEBUG) return;

      if (result.ok) {
        Alert.alert('Token FCM (debug)', result.token, [{ text: 'OK' }]);
        return;
      }

      Alert.alert(
        'Push (debug)',
        `${result.reason}${result.message ? `\n${result.message}` : ''}`,
        [{ text: 'OK' }],
      );
    });
  }, [token]);
}
