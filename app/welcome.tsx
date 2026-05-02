import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6">
      {/* Logo centrado */}
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-6">
          <Text className="text-white text-5xl">🏆</Text>
        </View>
        <Text className="text-primary text-3xl font-sans-medium mb-3">TourneyFC</Text>
        <Text className="text-carbon text-base text-center leading-6">
          Gestiona tus torneos de fútbol amateur{'\n'}de forma simple y profesional
        </Text>
      </View>

      {/* Botones abajo */}
      <View className="pb-12 gap-3">
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={() => router.push('/(auth)/register')}
        >
          <Text className="text-white font-sans-medium text-base">Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border-2 border-primary rounded-xl py-4 items-center"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-primary font-sans-medium text-base">Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
