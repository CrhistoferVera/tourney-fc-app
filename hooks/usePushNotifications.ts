import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { registerPushDevice } from '../services/pushNotifications';

/**
 * Tras login o al reabrir la app con sesión persistida, sincroniza el token FCM con el backend.
 */
export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    registerPushDevice(token);
  }, [token]);
}
