import { Text, View } from "react-native";
import { Redirect } from 'expo-router';


export default function HomeScreen() {
  /*return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-800">Tourney FC</Text>
      <Text className="mt-2 text-base text-primary ">
        BIENVENIDOS A TOURNEYFC BROU
      </Text>
    </View>
  );*/
  return <Redirect href="/(profile)" />;
}

