const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.json();
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
    return response.json();
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
    return response.json();
  },

  delete: async (endpoint: string, token?: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.json();
  },

  getWithParams: async (endpoint: string, params?: Record<string, string>, token?: string) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.json();
  },
};