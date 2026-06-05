import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import { Trophy, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { setToken, setUsuario } = useAuthStore();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

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
    if (v.trim().length < 3) {
      setNombreError('El nombre debe tener al menos 3 caracteres');
    } else if (v.trim().length > 50) {
      setNombreError('El nombre no puede exceder 50 caracteres');
    } else if (/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛãõÃÕñÑüÜçÇ\s'.\-]/.test(v)) {
      setNombreError('El nombre solo puede contener letras');
    } else {
      setNombreError('');
    }
  };

  const validateEmail = (v: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(v)) setEmailError('El formato del correo electrónico no es válido');
    else setEmailError('');
  };

  const validatePassword = (v: string) => {
    if (v.length < 8) setPasswordError('La contraseña debe contener al menos 8 caracteres');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v))
      setPasswordError('Debe contener una mayúscula, una minúscula y un número');
    else setPasswordError('');
  };

  const validateConfirm = (v: string) => {
    if (v !== password) setConfirmError('Las contraseñas no coinciden');
    else setConfirmError('');
  };

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      showError('Campos requeridos', 'Completa todos los campos para continuar');
      return;
    }
    if (password !== confirmPassword) {
      showError('Datos inválidos', 'Las contraseñas no coinciden');
      return;
    }
    if (nombreError || emailError || passwordError || confirmError) {
      showError('Datos inválidos', 'Corrige los errores antes de continuar');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
      });
      if (data.accessToken) {
        showSuccess('Cuenta creada', 'Tu cuenta fue creada exitosamente', () => {
          // Al guardar el token, el AuthGuard redirige automáticamente
          // (a unirse al equipo si hay invitación pendiente, o a home).
          setToken(data.accessToken);
          setUsuario({
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            fotoPerfil: data.fotoPerfil,
            zona: data.zona,
          });
        });
      } else {
        showError('Error al registrarse', data.message ?? 'No se pudo crear la cuenta');
      }
    } catch (error: any) {
      const mensaje = error?.message ?? 'No se pudo conectar al servidor';
      const esConexion =
        mensaje.includes('fetch') || mensaje.includes('network') || mensaje.includes('Network');
      showError(
        esConexion ? 'Error de conexión' : 'Error al registrarse',
        esConexion ? 'No se pudo conectar al servidor' : mensaje,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="flex-1 bg-white">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />
        <View className="items-center mt-20">
          <View className="rounded-full bg-primary p-6">
            <Trophy color={Colors.white} size={38} />
          </View>
          <Text className="text-4xl font-sans-medium text-primary mt-4">TourneyFC</Text>
        </View>

        <Text className="mt-3 text-3xl pt-10 text-night font-sans text-center">Crear cuenta</Text>
        <Text className="text-lg text-carbon font-sans text-center">
          Completa el formulario para registrarte
        </Text>

        <View className="w-full px-8 mt-8">
          <Text className="text-night mb-2">Nombre completo</Text>
          <TextInput
            className="w-full bg-mist rounded-md px-4 py-4 mb-1 text-night text-base"
            placeholder="Juan Pérez"
            placeholderTextColor={Colors.carbon}
            value={nombre}
            onChangeText={(v) => {
              const filtered = v.replace(/\d/g, '');
              setNombre(filtered);
              validateNombre(filtered);
            }}
          />
          {nombreError ? (
            <Text className="text-danger text-xs mb-3">{nombreError}</Text>
          ) : (
            <View className="mb-4" />
          )}

          <Text className="text-night mb-2">Correo electrónico</Text>
          <TextInput
            className="w-full bg-mist rounded-md px-4 py-4 mb-1 text-night text-base"
            placeholder="correo@ejemplo.com"
            placeholderTextColor={Colors.carbon}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => {
              const normalized = v.toLowerCase();
              setEmail(normalized);
              validateEmail(normalized);
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
                if (confirmPassword) {
                  setConfirmError(confirmPassword !== v ? 'Las contraseñas no coinciden' : '');
                }
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

          <Text className="text-night mb-2">Confirmar contraseña</Text>
          <View className="w-full bg-mist rounded-md flex-row items-center mb-1">
            <TextInput
              className="flex-1 px-4 py-4 text-night text-base"
              placeholder="••••••••"
              placeholderTextColor={Colors.carbon}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                validateConfirm(v);
              }}
            />
            <Pressable onPress={() => setShowConfirm(!showConfirm)} className="pr-4">
              {showConfirm ? (
                <EyeOff color={Colors.carbon} size={20} />
              ) : (
                <Eye color={Colors.carbon} size={20} />
              )}
            </Pressable>
          </View>
          {confirmError ? (
            <Text className="text-danger text-xs mb-3">{confirmError}</Text>
          ) : (
            <View className="mb-8" />
          )}

          <Pressable
            className={`py-4 rounded-md active:opacity-80 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text className="text-white text-center font-sans-bold">Crear cuenta</Text>
            )}
          </Pressable>

          <Text className="text-night text-center mt-4 mb-4">
            ¿Ya tienes cuenta?{' '}
            <Text
              className="text-primary font-sans-bold"
              onPress={() => router.replace('/(auth)/login')}
            >
              Iniciar sesión
            </Text>
          </Text>

          <Text className="text-carbon text-xs text-center">
            Al crear una cuenta, aceptas nuestros{' '}
            <Text
              className="text-primary font-sans-bold"
              onPress={() => router.push('/(auth)/terms')}
            >
              Términos y Condiciones
            </Text>
          </Text>
        </View>
    </KeyboardAwareScrollView>
  );
}
