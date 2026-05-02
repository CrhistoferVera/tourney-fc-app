import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import { Feather } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, codigo } = useLocalSearchParams<{
    email: string;
    codigo: string;
  }>();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validatePassword = (v: string) => {
    if (v.length < 8) setPasswordError('La contraseña debe contener al menos 8 caracteres');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v))
      setPasswordError('Debe contener una mayúscula, una minúscula y un número');
    else setPasswordError('');
  };

  const validateConfirm = (v: string) => {
    if (v !== nuevaPassword) setConfirmError('Las contraseñas no coinciden');
    else setConfirmError('');
  };

  const handleReset = async () => {
    if (!nuevaPassword || !confirmarPassword) {
      showError('Campos requeridos', 'Completa todos los campos');
      return;
    }
    if (passwordError || confirmError) {
      showError('Datos inválidos', 'Corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, codigo, nuevaPassword });
      showSuccess('Contraseña actualizada', 'Tu contraseña fue cambiada exitosamente', () =>
        router.replace('/(auth)/login'),
      );
    } catch (error: any) {
      showError('Error', error.message ?? 'No se pudo restablecer la contraseña');
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

        <Text className="text-night text-3xl font-sans-medium mb-1">Nueva contraseña</Text>
        <Text className="text-carbon text-sm mb-8">Ingresa y confirma tu nueva contraseña</Text>

        {/* Nueva contraseña */}
        <View className="mb-4">
          <Text className="text-night text-sm font-sans-medium mb-2">Nueva contraseña</Text>
          <View className="bg-mist rounded-xl px-4 py-4 flex-row items-center">
            <TextInput
              className="flex-1 text-night text-base"
              placeholder="••••••••"
              placeholderTextColor="#3D4F44"
              secureTextEntry={!showPassword}
              value={nuevaPassword}
              onChangeText={(v) => {
                setNuevaPassword(v);
                validatePassword(v);
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="#3D4F44" />
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
              value={confirmarPassword}
              onChangeText={(v) => {
                setConfirmarPassword(v);
                validateConfirm(v);
              }}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Feather name={showConfirm ? 'eye-off' : 'eye'} size={24} color="#3D4F44" />
            </TouchableOpacity>
          </View>
          {confirmError ? <Text className="text-danger text-xs mt-1">{confirmError}</Text> : null}
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-4"
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Confirmar cambio</Text>
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
