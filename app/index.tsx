import { Text, View } from "react-native";
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { token } = useAuthStore();
  return <Redirect href={token ? '/(app)/home' : '/(auth)/login'} />;
}

/*return (
  <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-2xl font-bold text-gray-800">Tourney FC</Text>
    <Text className="mt-2 text-base text-primary ">
      BIENVENIDOS A TOURNEYFC BROU
    </Text>
  </View>
);*/