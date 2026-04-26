import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setToken, setUsuario } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('El formato del correo electrónico no es válido');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('La contraseña debe contener al menos 8 caracteres');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (emailError || passwordError) {
      Alert.alert('Error', 'Corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.accessToken) {
        setToken(data.accessToken);
        setUsuario({
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          fotoPerfil: data.fotoPerfil,
          zona: data.zona,
        });
        router.replace('/(app)/home');
      } else {
        Alert.alert('Error', data.message ?? 'Correo electrónico o contraseña incorrectos. Por favor, intente nuevamente');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
            <Text className="text-white text-4xl">🏆</Text>
          </View>
          <Text className="text-primary text-2xl font-sans-medium">TourneyFC</Text>
        </View>

        {/* Título */}
        <Text className="text-night text-3xl font-sans-medium mb-1">Iniciar sesión</Text>
        <Text className="text-carbon text-sm mb-8">Ingresa tus credenciales para continuar</Text>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-night text-sm font-sans-medium mb-2">Correo electrónico</Text>
          <TextInput
            className="bg-mist rounded-xl px-4 py-4 text-night text-base"
            placeholder="tu@email.com"
            placeholderTextColor="#3D4F44"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => { setEmail(v); validateEmail(v); }}
          />
          {emailError ? <Text className="text-danger text-xs mt-1">{emailError}</Text> : null}
        </View>

        {/* Contraseña */}
        <View className="mb-2">
          <Text className="text-night text-sm font-sans-medium mb-2">Contraseña</Text>
          <View className="bg-mist rounded-xl px-4 py-4 flex-row items-center">
            <TextInput
              className="flex-1 text-night text-base"
              placeholder="••••••••"
              placeholderTextColor="#3D4F44"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); validatePassword(v); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text className="text-carbon text-lg">{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {passwordError ? <Text className="text-danger text-xs mt-1">{passwordError}</Text> : null}
        </View>

        {/* Olvidaste contraseña */}
        <TouchableOpacity className="items-end mb-8">
          <Text className="text-primary text-sm font-sans-medium">¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Botón login */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-6"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        {/* Crear cuenta */}
        <View className="flex-row justify-center">
          <Text className="text-carbon text-sm">¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-primary text-sm font-sans-medium">Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}