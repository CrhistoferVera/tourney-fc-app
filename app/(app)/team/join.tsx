import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import { useAlert } from '../../../hooks/useAlert';
import {
  joinByCode,
  previewInviteLink,
  InviteLinkPreview,
} from '../../../services/teamsService';

function formatExpiresAt(iso: string | null): string {
  if (!iso) return 'No expira';
  try {
    return `Expira el ${new Date(iso).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;
  } catch {
    return '';
  }
}

export default function JoinTeamScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [preview, setPreview] = useState<InviteLinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Enlace inválido.');
      setLoading(false);
      return;
    }
    previewInviteLink(code)
      .then(setPreview)
      .catch((e: any) => setError(e.message ?? 'Enlace inválido o expirado.'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!code || !preview) return;
    setJoining(true);
    try {
      const { teamId } = await joinByCode(code);
      showSuccess(
        '¡Bienvenido!',
        `Ya formas parte de ${preview.nombre}.`,
        () => router.replace(`/team/${teamId}` as never),
      );
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo unir al equipo.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/home')
          }
          className="mr-3"
        >
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Unirse a un equipo</Text>
      </View>

      {(() => {
        if (loading) {
          return (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#0D7A3E" size="large" />
            </View>
          );
        }
        if (error || !preview) {
          return (
            <View className="flex-1 items-center justify-center px-8">
              <Feather name="alert-circle" size={40} color="#E53935" />
              <Text className="text-night font-sans-medium text-base text-center mt-4">
                Enlace no válido
              </Text>
              <Text className="text-carbon text-sm text-center mt-1">
                {error ?? 'Verifica que el enlace esté completo o solicita uno nuevo.'}
              </Text>
            </View>
          );
        }
        return (
          <View className="flex-1 px-4 pt-8">
            <View
              className="bg-white rounded-2xl px-5 py-6 items-center"
              style={{ elevation: 2, shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8 }}
            >
              <ShieldDisplay escudo={preview.escudo} size={96} />
              <Text className="text-night font-sans-medium text-xl text-center mt-4" numberOfLines={2}>
                {preview.nombre}
              </Text>
              <Text className="text-carbon text-sm text-center mt-1">
                Capitán: {preview.capitanNombre}
              </Text>
              <View className="flex-row items-center gap-1 mt-2">
                <Feather name="users" size={12} color="#3D4F44" />
                <Text className="text-carbon text-xs">
                  {preview.cantidadJugadores} jugador
                  {preview.cantidadJugadores === 1 ? '' : 'es'}
                </Text>
              </View>
              <Text className="text-carbon text-xs mt-3">
                {formatExpiresAt(preview.expiresAt)}
              </Text>
            </View>

            {preview.yaEsMiembro ? (
              <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mt-6 mb-3">
                <Text className="text-primary font-sans-medium text-sm text-center">
                  Ya formas parte de este equipo
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={preview.yaEsMiembro ? () => router.replace(`/team/${preview.teamId}` as never) : handleJoin}
              disabled={joining}
              activeOpacity={0.85}
              className="bg-primary rounded-2xl py-4 mt-4 flex-row items-center justify-center gap-2"
            >
              {joining ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Feather
                    name={preview.yaEsMiembro ? 'arrow-right' : 'user-plus'}
                    size={18}
                    color="white"
                  />
                  <Text className="text-white font-sans-medium text-base">
                    {preview.yaEsMiembro ? 'Ir al equipo' : 'Unirme al equipo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      })()}
    </View>
  );
}
