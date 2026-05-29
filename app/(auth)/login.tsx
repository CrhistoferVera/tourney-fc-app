import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import { Trophy, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { setToken, setUsuario } = useAuthStore();
  const { alertState, hideAlert, showError } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) setEmailError('El formato del correo electrónico no es válido');
    else setEmailError('');
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) setPasswordError('La contraseña debe contener al menos 8 caracteres');
    else setPasswordError('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Campos requeridos', 'Completa todos los campos para continuar');
      return;
    }
    if (emailError || passwordError) {
      showError('Datos inválidos', 'Corrige los errores antes de continuar');
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
        router.replace('/(app)/(tabs)/home');
      } else {
        showError(
          'Error al iniciar sesión',
          data.message ??
            'Correo electrónico o contraseña incorrectos. Por favor, intente nuevamente',
        );
      }
    } catch (error: any) {
      const mensaje = error?.message ?? 'No se pudo conectar al servidor';
      const esConexion =
        mensaje.includes('fetch') || mensaje.includes('network') || mensaje.includes('Network');
      showError(
        esConexion ? 'Error de conexión' : 'Error al iniciar sesión',
        esConexion ? 'No se pudo conectar al servidor' : mensaje,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mt-20">
          <View className="rounded-full bg-primary p-6">
            <Trophy color={Colors.white} size={38} />
          </View>
          <Text className="text-4xl font-sans-medium text-primary mt-4">TourneyFC</Text>
        </View>

        <Text className="mt-3 text-3xl pt-10 text-night font-sans text-center">Iniciar sesión</Text>
        <Text className="text-lg text-carbon font-sans text-center">
          Ingresa tus credenciales para continuar
        </Text>

        <View className="w-full px-8 mt-8">
          <Text className="text-night mb-2">Correo electrónico</Text>
          <TextInput
            className="w-full bg-mist rounded-md px-4 py-4 mb-1 text-night text-base"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={Colors.carbon}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              validateEmail(v);
            }}
          />
          {emailError ? (
            <Text className="text-danger text-xs mb-3">{emailError}</Text>
          ) : (
            <View className="mb-4" />
          )}

          <Text className="text-night mb-2">Contraseña</Text>
          <View className="w-full bg-mist rounded-md flex-row items-center mb-1">
            <TextInput
              className="flex-1 px-4 py-4 text-night text-base"
              placeholder="••••••••"
              placeholderTextColor={Colors.carbon}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                validatePassword(v);
              }}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="pr-4">
              {showPassword ? (
                <EyeOff color={Colors.carbon} size={20} />
              ) : (
                <Eye color={Colors.carbon} size={20} />
              )}
            </Pressable>
          </View>
          {passwordError ? (
            <Text className="text-danger text-xs mb-3">{passwordError}</Text>
          ) : (
            <View className="mb-4" />
          )}

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-primary text-right font-sans-bold mb-8">
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Pressable
            className={`py-4 rounded-md active:opacity-80 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text className="text-white text-center font-sans-bold">Iniciar sesión</Text>
            )}
          </Pressable>

          <Text className="text-night text-center mt-4">
            ¿No tienes cuenta?{' '}
            <Text
              className="text-primary font-sans-bold"
              onPress={() => router.push('/(auth)/register')}
            >
              Crear cuenta
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
