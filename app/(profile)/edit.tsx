import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1 bg-mist" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{ paddingTop: 56, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center', position: 'relative', backgroundColor: '#0D7A3E' }}
        >
          {/* Botón back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: 'absolute', top: 52, left: 20 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Título */}
          <Text style={{ position: 'absolute', top: 56, alignSelf: 'center', color: 'white', fontSize: 17, fontWeight: '600' }}>
            Editar perfil
          </Text>

          {/* Círculos decorativos de fondo */}
          <View
            style={{
              position: 'absolute', top: -30, right: -30,
              width: 130, height: 130, borderRadius: 65,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />
          <View
            style={{
              position: 'absolute', bottom: -20, left: -20,
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />

          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={{ marginTop: 24, marginBottom: 14 }}>
            {fotoPerfil ? (
              <Image
                source={{ uri: fotoPerfil }}
                style={{
                  width: 96, height: 96, borderRadius: 48,
                  borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
                }}
              />
            ) : (
              <View
                style={{
                  width: 96, height: 96, borderRadius: 48,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>
                  {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
                </Text>
              </View>
            )}
            
            {uploadingPhoto ? (
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0D7A3E', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' }}>
                <Feather name="camera" size={14} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <View style={{ paddingHorizontal: 16, marginTop: -20, paddingBottom: 40 }}>
          <View
            style={{
              backgroundColor: 'white', borderRadius: 20,
              shadowColor: '#0F1A14', shadowOpacity: 0.07,
              shadowRadius: 12, elevation: 4, overflow: 'hidden',
              paddingBottom: 8
            }}
          >
            <Text style={{ color: '#3D4F44', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
              Información personal
            </Text>

            {/* Nombre */}
            <View className="px-4 py-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-carbon text-xs">Nombre completo</Text>
                <Text className="text-carbon text-xs">{getCharCount(nombre)}/50</Text>
              </View>
              <TextInput
                className="text-night text-base font-sans-medium py-1"
                value={nombre}
                onChangeText={handleNombreChange}
                placeholder="Tu nombre"
                placeholderTextColor="#3D4F44"
              />
              {nombreError ? <Text className="text-danger text-xs mt-1">{nombreError}</Text> : null}
              {!nombreError && <Text className="text-carbon text-xs mt-1">Mínimo 3 caracteres</Text>}
            </View>

            <View style={{ height: 1, backgroundColor: '#F0F4F1', marginLeft: 16, marginRight: 16, marginVertical: 4 }} />

            {/* Zona */}
            <View className="px-4 py-2 mb-2">
              <Text className="text-carbon text-xs mb-1">Zona / Ciudad</Text>
              <TextInput
                className="text-night text-base font-sans-medium py-1"
                value={zona}
                onChangeText={handleZonaChange}
                placeholder="Tu ciudad o zona"
                placeholderTextColor="#3D4F44"
              />
              {zonaError ? <Text className="text-danger text-xs mt-1">{zonaError}</Text> : null}
            </View>
          </View>

          {/* Botones */}
          <View className="mt-6 gap-2">
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center"
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
        </View>
      </ScrollView>
    </>
  );
}
