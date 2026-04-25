import { View, Text, TextInput, KeyboardAvoidingView, ScrollView, Pressable } from 'react-native'
import React, { useState } from 'react'
import { Colors } from '@/constants/Colors'
import { Trophy, Eye, EyeOff } from 'lucide-react-native'
import { Link } from 'expo-router'

const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mt-20">
          <View className="rounded-full bg-primary p-6">
            <Trophy color={Colors.white} size={38}/>
          </View>
          <Text className="text-4xl font-sans-medium text-primary mt-4">TourneyFC</Text>
        </View>
        <Text className="mt-3 text-3xl pt-10 text-night font-sans text-center">
          Iniciar Sesion
        </Text>
        <Text className="text-lg text-carbon font-sans text-center">
          Ingresa tus credenciales para continuar
        </Text>
        <View className='w-full px-8 mt-8'>
          <Text className='text-night'> Correo Electronico</Text>
          <TextInput
            placeholder='correo@ejemplo.com'
            keyboardType='email-address'
            autoCapitalize='none'
            className='w-full bg-mist rounded-md px-4 py-4 mb-4 focus:border-primary focus:border-2'
          />
          <Text className='text-night'> Contraseña</Text>
          <View className='w-full bg-mist rounded-md flex-row items-center mb-4 focus:border-primary focus:border-2'>
            <TextInput
              placeholder='********'
              secureTextEntry={!showPassword}
              className='flex-1 px-4 py-4'
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className='pr-4'>
              {showPassword
                ? <EyeOff color={Colors.carbon} size={20} />
                : <Eye color={Colors.carbon} size={20} />
              }
            </Pressable>
          </View>
          <Link href="/forgot-password" asChild>
            <Text className='text-primary text-right font-sans-bold mb-4'>¿Olvidaste tu contraseña?</Text> 
          </Link>
          <Pressable>
            <Text className={`bg-primary text-white py-4 rounded-md text-center font-sans-bold active:bg-primary-dark
            ${isLoading ? 'bg-primary-dark' : 'bg-primary'}`}
                disabled={isLoading}
            >Iniciar Sesion
            </Text>
          </Pressable>
          <Text className='text-night text-center mt-4'>
            ¿No tienes una cuenta?{' '}
            <Link href="/sign-up" asChild>
              <Text className='text-primary font-sans-bold'>Registrate</Text>
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default SignInForm