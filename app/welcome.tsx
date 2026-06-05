import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const pendingInviteCode = useAuthStore((s) => s.pendingInviteCode);

  return (
    <View className="flex-1 bg-white px-6">
      {/* Logo centrado */}
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-6">
          <Trophy color="white" size={48} />
        </View>
        <Text className="text-primary text-3xl font-sans-medium mb-3">TourneyFC</Text>
        <Text className="text-carbon text-base text-center leading-6">
          Gestiona tus torneos de fútbol amateur{'\n'}de forma simple y profesional
        </Text>

        {pendingInviteCode ? (
          <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mt-6">
            <Text className="text-primary font-sans-medium text-sm text-center">
              Te invitaron a un equipo. Inicia sesión o regístrate para unirte a tu equipo.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Botones abajo */}
      <View className="pb-32 gap-3">
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
