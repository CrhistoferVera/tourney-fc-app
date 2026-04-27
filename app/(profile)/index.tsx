import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { usuario, loading, fetchProfile } = useProfile();
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            clearAuth();
            router.replace('/(auth)/login');
          },
        },
      ]
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
      {/* Header verde */}
      <View className="bg-primary px-6 pt-16 pb-8 items-center">
        {usuario?.fotoPerfil ? (
          <Image
            source={{ uri: usuario.fotoPerfil }}
            className="w-24 h-24 rounded-full mb-3"
          />
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

      {/* Datos */}
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
          <Text className="text-night text-base font-sans-medium">{usuario?.zona ?? 'No especificada'}</Text>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          className="items-center py-4 mt-2"
          onPress={handleLogout}
        >
          <Text className="text-danger text-base font-sans-medium">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}