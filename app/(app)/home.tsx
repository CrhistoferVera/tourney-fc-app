import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { usuario } = useAuthStore();

  return (
    <View className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row justify-between items-center">
        <Text className="text-white text-xl font-sans-medium">TourneyFC</Text>
        <TouchableOpacity onPress={() => router.push('/(profile)')}>
          {usuario?.fotoPerfil ? (
            <Image
              source={{ uri: usuario.fotoPerfil }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary-dark items-center justify-center">
              <Text className="text-white text-sm font-sans-medium">
                {usuario?.nombre?.slice(0, 2).toUpperCase() ?? 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-carbon text-base">Bienvenido, {usuario?.nombre}</Text>
      </View>
    </View>
  );
}