import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombreError, setNombreError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validateNombre = (v: string) => {
    if (v.length < 3) setNombreError('El nombre debe tener al menos 3 caracteres');
    else if (v.length > 50) setNombreError('El nombre no puede exceder 50 caracteres');
    else setNombreError('');
  };

  const validateEmail = (v: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(v)) setEmailError('El formato del correo electrónico no es válido');
    else setEmailError('');
  };

  const validatePassword = (v: string) => {
    if (v.length < 8) setPasswordError('La contraseña debe contener al menos 8 caracteres');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v)) setPasswordError('Debe contener una mayúscula, una minúscula y un número');
    else setPasswordError('');
  };

  const validateConfirm = (v: string) => {
    if (v !== password) setConfirmError('Las contraseñas no coinciden');
    else setConfirmError('');
  };

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (nombreError || emailError || passwordError || confirmError) {
      Alert.alert('Error', 'Corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/register', { nombre, email, password });
      if (data.registrado) {
        Alert.alert('Éxito', 'Cuenta creada exitosamente', [
          { text: 'Iniciar sesión', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Error', data.message ?? 'No se pudo crear la cuenta');
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
        <Text className="text-night text-3xl font-sans-medium mb-1">Crear cuenta</Text>
        <Text className="text-carbon text-sm mb-8">Completa el formulario para registrarte</Text>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-night text-sm font-sans-medium mb-2">Nombre completo</Text>
          <TextInput
            className="bg-mist rounded-xl px-4 py-4 text-night text-base"
            placeholder="Juan Pérez"
            placeholderTextColor="#3D4F44"
            value={nombre}
            onChangeText={(v) => { setNombre(v); validateNombre(v); }}
          />
          {nombreError ? <Text className="text-danger text-xs mt-1">{nombreError}</Text> : null}
        </View>

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
        <View className="mb-4">
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

        {/* Confirmar contraseña */}
        <View className="mb-8">
          <Text className="text-night text-sm font-sans-medium mb-2">Confirmar contraseña</Text>
          <View className="bg-mist rounded-xl px-4 py-4 flex-row items-center">
            <TextInput
              className="flex-1 text-night text-base"
              placeholder="••••••••"
              placeholderTextColor="#3D4F44"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); validateConfirm(v); }}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Text className="text-carbon text-lg">{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {confirmError ? <Text className="text-danger text-xs mt-1">{confirmError}</Text> : null}
        </View>

        {/* Botón registro */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-6"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Crear cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Iniciar sesión */}
        <View className="flex-row justify-center mb-4">
          <Text className="text-carbon text-sm">¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-primary text-sm font-sans-medium">Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-carbon text-xs text-center">
          Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad
        </Text>
      </View>
    </ScrollView>
  );
}