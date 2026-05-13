// services/api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (response.status === 401) {
    const { useAuthStore } = await import('../store/authStore');
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      useAuthStore.getState().clearAuth();
      throw new Error('Sesión expirada');
    }
    throw new Error(data.message || data.error || 'Correo electrónico o contraseña incorrectos');
  }
  if (!response.ok) {
    const errorMessage = data.message || data.error || 'Error en la petición';
    throw new Error(errorMessage);
  }
  return data;
};

export const api = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },

  patch: async (endpoint: string, body: object, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, body: object, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patchMultipart: async (endpoint: string, formData: FormData, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return handleResponse(response);
  },

  postMultipart: async (endpoint: string, formData: FormData, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },

  getWithParams: async (endpoint: string, params?: Record<string, string>, token?: string) => {
    // Construir query string manualmente — new URL() no es confiable en React Native
    let url = `${BASE_URL}${endpoint}`;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (queryString) url = `${url}?${queryString}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },
};