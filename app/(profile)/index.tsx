import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Feather name={icon as any} size={16} color="#0D7A3E" />
      </View>
      <View className="flex-1">
        <Text className="text-carbon text-xs mb-0.5">{label}</Text>
        <Text className="text-night text-sm font-sans-medium">{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F0F4F1', marginLeft: 56 }} />;
}

export default function ProfileScreen() {
  const { usuario, loading, fetchProfile } = useProfile();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const { alertState, hideAlert, showConfirm } = useAlert();

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    showConfirm(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      () => {
        clearAuth();
        router.replace('/(auth)/login');
      },
      'Cerrar sesión',
      'Cancelar',
    );
  };

  const initials = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-mist">
        <ActivityIndicator size="large" color="#0D7A3E" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-mist" showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View
        style={{ paddingTop: 56, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center', position: 'relative', backgroundColor: '#0D7A3E' }}
      >
        {/* Botón back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 52, left: 20 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Título */}
        <Text style={{ position: 'absolute', top: 56, alignSelf: 'center', color: 'white', fontSize: 17, fontWeight: '600' }}>
          Mi perfil
        </Text>

        {/* Círculos decorativos de fondo */}
        <View
          style={{
            position: 'absolute', top: -30, right: -30,
            width: 130, height: 130, borderRadius: 65,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <View
          style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Avatar */}
        <View style={{ marginTop: 24, marginBottom: 14 }}>
          {usuario?.fotoPerfil ? (
            <Image
              source={{ uri: usuario.fotoPerfil }}
              style={{
                width: 96, height: 96, borderRadius: 48,
                borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
              }}
            />
          ) : (
            <View
              style={{
                width: 96, height: 96, borderRadius: 48,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
          {usuario?.nombre ?? 'Usuario'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16 }}>
          {usuario?.email ?? ''}
        </Text>

        {/* Botón editar perfil */}
        <TouchableOpacity
          onPress={() => router.push('/(profile)/edit')}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 20, paddingVertical: 8,
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
          }}
        >
          <Feather name="edit-2" size={13} color="white" />
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta principal de información */}
      <View style={{ paddingHorizontal: 16, marginTop: -20 }}>
        <View
          style={{
            backgroundColor: 'white', borderRadius: 20,
            shadowColor: '#0F1A14', shadowOpacity: 0.07,
            shadowRadius: 12, elevation: 4, overflow: 'hidden',
          }}
        >
          <Text style={{ color: '#3D4F44', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            Información personal
          </Text>
          <InfoRow icon="user" label="Nombre completo" value={usuario?.nombre ?? '—'} />
          <Divider />
          <InfoRow icon="mail" label="Correo electrónico" value={usuario?.email ?? '—'} />
          <Divider />
          <InfoRow icon="map-pin" label="Zona / Ciudad" value={usuario?.zona ?? 'No especificada'} />
        </View>
      </View>

      {/* Sección de acciones */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <View
          style={{
            backgroundColor: 'white', borderRadius: 20,
            shadowColor: '#0F1A14', shadowOpacity: 0.07,
            shadowRadius: 12, elevation: 4, overflow: 'hidden',
          }}
        >
          <Text style={{ color: '#3D4F44', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            Cuenta
          </Text>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-4 py-4"
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(220,38,38,0.08)' }}>
              <Feather name="log-out" size={16} color="#DC2626" />
            </View>
            <Text className="flex-1 text-sm font-sans-medium" style={{ color: '#DC2626' }}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer decorativo */}
      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0D7A3E' }} />
          <Text style={{ color: '#0D7A3E', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>TourneyFC</Text>
        </View>
        <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Tu plataforma de torneos</Text>
      </View>
    </ScrollView>
  );
}
