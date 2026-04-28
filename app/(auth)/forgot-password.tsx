import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) setEmailError('El formato del correo electrónico no es válido');
    else setEmailError('');
  };

  const handleSend = async () => {
    if (!email) {
      showError('Campo requerido', 'Ingresa tu correo electrónico');
      return;
    }
    if (emailError) {
      showError('Correo inválido', 'Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      router.push({ pathname: '/(auth)/verify-code', params: { email } });
    } catch {
      showError('Error', 'No se pudo enviar el código. Intenta nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
            <Text className="text-white text-4xl">🏆</Text>
          </View>
          <Text className="text-primary text-2xl font-sans-medium">TourneyFC</Text>
        </View>

        <Text className="text-night text-3xl font-sans-medium mb-1">¿Olvidaste tu contraseña?</Text>
        <Text className="text-carbon text-sm mb-8">Ingresa tu correo y te enviaremos un código de verificación</Text>

        <View className="mb-6">
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

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-4"
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Enviar código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-carbon text-base">Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}