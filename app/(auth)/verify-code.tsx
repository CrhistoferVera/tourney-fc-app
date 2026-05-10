import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import CodeInput from '../../components/CodeInput';
import { Trophy } from 'lucide-react-native';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { alertState, hideAlert, showError } = useAlert();

  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutos

  // Cuenta regresiva
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = async () => {
    if (codigo.length < 6) {
      showError('Código incompleto', 'Ingresa los 6 dígitos del código');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, codigo });
      router.push({ pathname: '/(auth)/reset-password', params: { email, codigo } });
    } catch (error: any) {
      showError('Código inválido', error.message ?? 'El código es incorrecto o ha expirado');
      setCodigo('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSecondsLeft(300);
      setCodigo('');
    } catch {
      showError('Error', 'No se pudo reenviar el código. Intenta nuevamente');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
            <Trophy color="white" size={38} />
          </View>
          <Text className="text-primary text-2xl font-sans-medium">TourneyFC</Text>
        </View>

        <Text className="text-night text-3xl font-sans-medium mb-1">Verificar código</Text>
        <Text className="text-carbon text-sm mb-2">Ingresa el código de 6 dígitos enviado a</Text>
        <Text className="text-primary text-sm font-sans-medium mb-8">{email}</Text>

        {/* Input de código */}
        <View className="mb-6">
          <CodeInput value={codigo} onChange={setCodigo} />
        </View>

        {/* Cuenta regresiva */}
        <View className="items-center mb-6">
          {secondsLeft > 0 ? (
            <Text className="text-carbon text-sm">
              El código expira en{' '}
              <Text className="text-primary font-sans-medium">{formatTime(secondsLeft)}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator color="#0D7A3E" />
              ) : (
                <Text className="text-primary text-sm font-sans-medium">Reenviar código</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-4"
          onPress={handleVerify}
          disabled={loading || codigo.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Verificar código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-carbon text-base">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
