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

  // Paso 1: Email, Paso 2: OTP, Paso 3: Detalles (Nombre, Password)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Estados de los campos
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Errores
  const [emailError, setEmailError] = useState('');
  const [codigoError, setCodigoError] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Validadores
  const validateEmail = (v: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(v)) setEmailError('El formato del correo electrónico no es válido');
    else setEmailError('');
  };

  const validateCodigo = (v: string) => {
    if (v.length !== 6) setCodigoError('El código debe tener 6 dígitos');
    else setCodigoError('');
  };

  const validateNombre = (v: string) => {
    if (v.trim().length < 3) setNombreError('El nombre debe tener al menos 3 caracteres');
    else if (v.trim().length > 50) setNombreError('El nombre no puede exceder 50 caracteres');
    else if (/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛãõÃÕñÑüÜçÇ\s'.\-]/.test(v)) setNombreError('Solo puede contener letras');
    else setNombreError('');
  };

  const validatePassword = (v: string) => {
    if (v.length < 8) setPasswordError('Debe contener al menos 8 caracteres');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v)) setPasswordError('Debe contener mayúscula, minúscula y número');
    else setPasswordError('');
  };

  const validateConfirm = (v: string) => {
    if (v !== password) setConfirmError('Las contraseñas no coinciden');
    else setConfirmError('');
  };

  // Handlers de los pasos
  const handleRequestOtp = async () => {
    if (!email) {
      showError('Campo requerido', 'Ingresa tu correo para continuar');
      return;
    }
    if (emailError) return;

    setLoading(true);
    try {
      await api.post('/auth/register/request-otp', { email: email.trim() });
      setStep(2);
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error.message;
      showError('Error', typeof msg === 'object' ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!codigo || codigo.length !== 6) {
      showError('Código inválido', 'Ingresa el código de 6 dígitos enviado a tu correo');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register/verify-otp', { email: email.trim(), codigo });
      setStep(3);
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error.message;
      showError('Código incorrecto', typeof msg === 'object' ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFinal = async () => {
    if (!nombre || !password || !confirmPassword) {
      showError('Campos requeridos', 'Completa todos los campos');
      return;
    }
    if (nombreError || passwordError || confirmError) return;

    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        codigo,
      });

      if (data.accessToken) {
        showSuccess('Cuenta creada', '¡Bienvenido a TourneyFC!', () => {
          setToken(data.accessToken);
          setUsuario({
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            fotoPerfil: data.fotoPerfil,
            zona: data.zona,
          });
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error.message;
      showError('Error al crear cuenta', typeof msg === 'object' ? msg[0] : msg);
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

      <Text className="mt-3 text-3xl pt-8 text-night font-sans text-center">
        {step === 1 && 'Crear cuenta'}
        {step === 2 && 'Verificar correo'}
        {step === 3 && 'Completar perfil'}
      </Text>
      <Text className="text-base text-carbon font-sans text-center px-8 mt-2">
        {step === 1 && 'Ingresa tu correo electrónico. Te enviaremos un código de confirmación.'}
        {step === 2 && `Ingresa el código de 6 dígitos que enviamos a ${email}.`}
        {step === 3 && 'Ya casi terminamos. Establece tu nombre y contraseña.'}
      </Text>

      <View className="w-full px-8 mt-8">
        {step === 1 && (
          <>
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
            {emailError ? <Text className="text-danger text-xs mb-3">{emailError}</Text> : <View className="mb-4" />}

            <Pressable
              className={`py-4 mt-2 rounded-md active:opacity-80 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text className="text-white text-center font-sans-bold">Continuar</Text>}
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <Text className="text-night mb-2">Código de verificación</Text>
            <TextInput
              className="w-full bg-mist rounded-md px-4 py-4 mb-1 text-night text-center text-2xl tracking-widest"
              placeholder="123456"
              placeholderTextColor={Colors.carbon}
              keyboardType="number-pad"
              maxLength={6}
              value={codigo}
              onChangeText={(v) => {
                const filtered = v.replace(/[^0-9]/g, '');
                setCodigo(filtered);
                validateCodigo(filtered);
              }}
            />
            {codigoError ? <Text className="text-danger text-xs mb-3 text-center">{codigoError}</Text> : <View className="mb-4" />}

            <Pressable
              className={`py-4 mt-2 rounded-md active:opacity-80 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text className="text-white text-center font-sans-bold">Verificar</Text>}
            </Pressable>
            <Text className="text-carbon text-sm text-center mt-6">
              ¿No recibiste el código?{' '}
              <Text className="text-primary font-sans-medium" onPress={() => setStep(1)}>
                Volver a enviar
              </Text>
            </Text>
          </>
        )}

        {step === 3 && (
          <>
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
            {nombreError ? <Text className="text-danger text-xs mb-3">{nombreError}</Text> : <View className="mb-4" />}

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
                  if (confirmPassword) setConfirmError(confirmPassword !== v ? 'Las contraseñas no coinciden' : '');
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="pr-4">
                {showPassword ? <EyeOff color={Colors.carbon} size={20} /> : <Eye color={Colors.carbon} size={20} />}
              </Pressable>
            </View>
            {passwordError ? <Text className="text-danger text-xs mb-3">{passwordError}</Text> : <View className="mb-4" />}

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
                {showConfirm ? <EyeOff color={Colors.carbon} size={20} /> : <Eye color={Colors.carbon} size={20} />}
              </Pressable>
            </View>
            {confirmError ? <Text className="text-danger text-xs mb-3">{confirmError}</Text> : <View className="mb-6" />}

            <Pressable
              className={`py-4 rounded-md active:opacity-80 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
              onPress={handleRegisterFinal}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text className="text-white text-center font-sans-bold">Finalizar y Crear cuenta</Text>}
            </Pressable>
          </>
        )}

        {step === 1 && (
          <>
            <Text className="text-night text-center mt-6 mb-4">
              ¿Ya tienes cuenta?{' '}
              <Text className="text-primary font-sans-bold" onPress={() => router.replace('/(auth)/login')}>
                Iniciar sesión
              </Text>
            </Text>

            <Text className="text-carbon text-xs text-center mt-4">
              Al crear una cuenta, aceptas nuestros{' '}
              <Text className="text-primary font-sans-bold" onPress={() => router.push('/(auth)/terms')}>
                Términos y Condiciones
              </Text>
            </Text>
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
