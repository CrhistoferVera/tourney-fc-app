import { Pressable, Text, View } from "react-native";
import { Trophy } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (

    <View className="flex-1 items-center justify-center bg-white">
      <View className="rounded-full bg-primary p-8">
        <Trophy color={Colors.white} size={48}/>
      </View>
      
      <Text className="text-5xl font-sans-medium text-primary m-5">TourneyFC</Text>
      <Text className="mt-3 text-base px-8 text-night font-sans text-center">
        Gestiona tus torneos de futbol amateur de forma simple y profesional
      </Text>
      <Link href="/sign-up" asChild>
        <Pressable className="bg-primary py-4 rounded-md self-stretch mt-36 mx-4 items-center">
          <Text className="text-white font-sans-bold">Crear Cuenta</Text>
        </Pressable>
      </Link>
      <Link href="/sign-in" asChild>
        <Pressable className="bg-white py-4 rounded-md self-stretch mt-3  mx-4 items-center border-2 border-primary">
          <Text className="text-night font-sans-bold">Iniciar Sesion</Text>
        </Pressable>
      </Link>
      
    </View>
  );
}
