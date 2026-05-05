import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = 'dsbpxnoat';
const CLOUDINARY_UPLOAD_PRESET = 'tourney_fc';

export const useProfile = () => {
  const { token, usuario, setUsuario } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.get('/users/me', token);
      setUsuario(data);
    } catch {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    nombre?: string;
    zona?: string;
    fotoPerfil?: string;
  }) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.patch('/users/me', updates, token);
      setUsuario(data);
      return true;
    } catch {
      setError('Error al actualizar el perfil');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadPhoto = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Se necesita permiso para acceder a la galería');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return null;

    const image = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      type: 'image/jpeg',
      name: 'foto_perfil.jpg',
    } as any);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      );
      const data = await response.json();
      return data.secure_url as string;
    } catch {
      setError('Error al subir la imagen');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { usuario, loading, error, fetchProfile, updateProfile, pickAndUploadPhoto };
};
