import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';

export default function EditProfileScreen() {
  const { usuario, loading, updateProfile } = useProfile();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [nombreError, setNombreError] = useState('');

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre ?? '');
      setZona(usuario.zona ?? '');
    }
  }, [usuario]);

  const validateNombre = (value: string) => {
    if (value.length < 3) {
      setNombreError('El nombre debe tener al menos 3 caracteres');
    } else if (value.length > 50) {
      setNombreError('El nombre no puede exceder 50 caracteres');
    } else {
      setNombreError('');
    }
  };

  const handleNombreChange = (value: string) => {
    if (value.length <= 50) {
      setNombre(value);
      validateNombre(value);
    }
  };

  const handleSave = async () => {
    if (nombreError || nombre.length < 3) {
      Alert.alert('Error', 'Corrige los errores antes de guardar');
      return;
    }

    const success = await updateProfile({ nombre, zona });
    if (success) {
      router.back();
    } else {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  return (
    <ScrollView className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-16 pb-8 items-center">
        <View className="w-24 h-24 rounded-full bg-primary-dark items-center justify-center mb-3">
          <Text className="text-white text-3xl font-sans-medium">
            {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <Text className="text-white text-lg font-sans-medium">{usuario?.nombre}</Text>
      </View>

      {/* Formulario */}
      <View className="px-6 py-6 gap-4">

        {/* Nombre */}
        <View className="bg-white rounded-2xl p-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-carbon text-xs">Nombre</Text>
            <Text className="text-carbon text-xs">{nombre.length}/50</Text>
          </View>
          <TextInput
            className="text-night text-base font-sans-medium"
            value={nombre}
            onChangeText={handleNombreChange}
            placeholder="Tu nombre"
            placeholderTextColor="#3D4F44"
            maxLength={50}
          />
          {nombreError ? (
            <Text className="text-danger text-xs mt-1">{nombreError}</Text>
          ) : null}
          <Text className="text-carbon text-xs mt-1">Mínimo 3 caracteres</Text>
        </View>

        {/* Zona */}
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-carbon text-xs mb-1">Zona</Text>
          <TextInput
            className="text-night text-base font-sans-medium"
            value={zona}
            onChangeText={setZona}
            placeholder="Tu ciudad o zona"
            placeholderTextColor="#3D4F44"
          />
        </View>

        {/* Botones */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center mt-2"
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.back()}
        >
          <Text className="text-carbon text-base">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}