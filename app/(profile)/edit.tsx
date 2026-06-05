import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

export default function EditProfileScreen() {
  const { alertState, hideAlert, showError } = useAlert();
  const { usuario, loading, updateProfile, pickAndUploadPhoto } = useProfile();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [nombreError, setNombreError] = useState('');
  const [zonaError, setZonaError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre ?? '');
      setZona(usuario.zona ?? '');
      setFotoPerfil(usuario.fotoPerfil ?? null);
    }
  }, [usuario]);

  const getCharCount = (text: string) => text.replace(/[\r\n]/g, '').length;

  const validateNombre = (value: string) => {
    const trimmed = value.trim();
    const len = getCharCount(trimmed);
    if (len < 3) {
      setNombreError('El nombre debe tener al menos 3 caracteres');
    } else if (len > 50) {
      setNombreError('El nombre no puede exceder 50 caracteres');
    } else {
      setNombreError('');
    }
  };

  const handleNombreChange = (value: string) => {
    if (getCharCount(value) <= 50) {
      setNombre(value);
      validateNombre(value);
    }
  };

  const validateZona = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      setZonaError('La zona debe tener al menos 3 caracteres');
    } else {
      setZonaError('');
    }
  };

  const handleZonaChange = (value: string) => {
    setZona(value);
    validateZona(value);
  };

  const handlePickPhoto = async () => {
    setUploadingPhoto(true);
    const url = await pickAndUploadPhoto();
    setUploadingPhoto(false);
    if (url) {
      setFotoPerfil(url);
    } else {
      showError('Error al subir foto', 'No se pudo subir la imagen. Intenta nuevamente');
    }
  };

  const handleSave = async () => {
    const nombreTrimmed = nombre.trim();
    const zonaTrimmed = zona.trim();
    if (nombreError || getCharCount(nombreTrimmed) < 3) {
      showError('Error de validación', 'Corrige los errores antes de guardar');
      return;
    }
    if (zonaError || (zonaTrimmed.length > 0 && zonaTrimmed.length < 3)) {
      showError('Error de validación', 'La zona debe tener al menos 3 caracteres');
      return;
    }

    const success = await updateProfile({
      nombre: nombreTrimmed,
      zona: zonaTrimmed,
      ...(fotoPerfil && { fotoPerfil }),
    });

    if (success) {
      router.back();
    } else {
      showError('Error al guardar', 'No se pudo actualizar el perfil. Intenta nuevamente');
    }
  };

  return (
    <>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />
      <ScrollView className="flex-1 bg-mist">
        {/* Header */}
        <View className="bg-primary px-6 pt-16 pb-8 items-center">
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} className="relative mb-3">
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary-dark items-center justify-center">
                <Text className="text-white text-3xl font-sans-medium">
                  {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
                </Text>
              </View>
            )}
            {uploadingPhoto ? (
              <View className="absolute inset-0 rounded-full bg-black/50 items-center justify-center">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 bg-accent rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-white text-xs">✎</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-white text-lg font-sans-medium">{usuario?.nombre}</Text>
        </View>

        {/* Formulario */}
        <View className="px-6 py-6 gap-4">
          {/* Nombre */}
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-carbon text-xs">Nombre</Text>
              <Text className="text-carbon text-xs">{getCharCount(nombre)}/50</Text>
            </View>
            <TextInput
              className="text-night text-base font-sans-medium"
              value={nombre}
              onChangeText={handleNombreChange}
              placeholder="Tu nombre"
              placeholderTextColor="#3D4F44"
            />
            {nombreError ? <Text className="text-danger text-xs mt-1">{nombreError}</Text> : null}
            <Text className="text-carbon text-xs mt-1">Mínimo 3 caracteres</Text>
          </View>

          {/* Zona */}
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-carbon text-xs mb-1">Zona</Text>
            <TextInput
              className="text-night text-base font-sans-medium"
              value={zona}
              onChangeText={handleZonaChange}
              placeholder="Tu ciudad o zona"
              placeholderTextColor="#3D4F44"
            />
            {zonaError ? <Text className="text-danger text-xs mt-1">{zonaError}</Text> : null}
          </View>

          {/* Botones */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-2"
            onPress={handleSave}
            disabled={loading || uploadingPhoto}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-3" onPress={() => router.back()}>
            <Text className="text-carbon text-base">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
