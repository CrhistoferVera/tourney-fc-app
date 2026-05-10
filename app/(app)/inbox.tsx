import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import Feather from '@expo/vector-icons/build/Feather'
import { useRouter } from 'expo-router'

export default function Inbox() {
    const router = useRouter();
  return (
    <View className='flex-1 bg-white'>
        <View className="bg-primary px-6 pt-14 pb-4">
            <View className="flex-row items-center gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className='text-white text-xl font-sans-medium'>Bandeja de entrada</Text>
            </View>
        </View>
        <View className='flex-1 items-center justify-center'>
            <Text className='text-gray-500 text-base'>Aquí aparecerán tus mensajes y notificaciones.</Text>
        </View>
    </View>
  )
}