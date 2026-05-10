import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

export default function ProfileScreen() {
  const { usuario, loading, fetchProfile } = useProfile();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const { alertState, hideAlert, showConfirm } = useAlert();

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    showConfirm(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      () => {
        clearAuth();
        router.replace('/(auth)/login');
      },
      'Cerrar sesión',
      'Cancelar',
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-mist">
        <ActivityIndicator size="large" color="#0D7A3E" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-8 items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 52, left: 20 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        {usuario?.fotoPerfil ? (
          <Image source={{ uri: usuario.fotoPerfil }} className="w-24 h-24 rounded-full mb-3" />
        ) : (
          <View className="w-24 h-24 rounded-full bg-primary-dark items-center justify-center mb-3">
            <Text className="text-white text-3xl font-sans-medium">
              {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
            </Text>
          </View>
        )}
        <Text className="text-white text-xl font-sans-medium">{usuario?.nombre}</Text>
        <Text className="text-primary-light text-sm mt-1">{usuario?.email}</Text>
        <TouchableOpacity
          className="mt-4 flex-row items-center bg-primary-dark px-5 py-2 rounded-full"
          onPress={() => router.push('/(profile)/edit')}
        >
          <Text className="text-white text-sm font-sans-medium">Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 py-6 gap-4">
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-carbon text-xs mb-1">Nombre</Text>
          <Text className="text-night text-base font-sans-medium">{usuario?.nombre ?? '—'}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-carbon text-xs mb-1">Correo electrónico</Text>
          <Text className="text-night text-base font-sans-medium">{usuario?.email ?? '—'}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-carbon text-xs mb-1">Zona</Text>
          <Text className="text-night text-base font-sans-medium">
            {usuario?.zona ?? 'No especificada'}
          </Text>
        </View>

        <TouchableOpacity className="items-center py-4 mt-2 bg-danger rounded-full" onPress={handleLogout}>
          <Text className="text-white  text-base font-sans-medium">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
