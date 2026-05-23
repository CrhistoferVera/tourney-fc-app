/**
 * URL del backend deployado (producción / APK).
 *
 * Pon aquí tu link público, por ejemplo:
 *   'https://tourney-fc-api.onrender.com'
 *
 * Déjalo en '' para desarrollo local: se usará EXPO_PUBLIC_API_URL del .env
 */
export const DEPLOYED_API_URL = 'https://backend-tourneyfc-backend.b5lsqc.easypanel.host/';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  const deployed = DEPLOYED_API_URL.trim();
  if (deployed) return normalizeBaseUrl(deployed);

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  return 'http://localhost:3000';
}
