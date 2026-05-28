import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  createInviteLink,
  revokeInviteLink,
  InviteLink,
} from '../../services/teamsService';

interface Props {
  readonly teamId: string;
  readonly inviteLink: InviteLink | null;
  readonly onChange: (link: InviteLink | null) => void;
  readonly onError: (title: string, message: string) => void;
  readonly onSuccess: (title: string, message: string) => void;
}

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

export default function InviteLinkSection({
  teamId,
  inviteLink,
  onChange,
  onError,
  onSuccess,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const link = await createInviteLink(teamId);
      onChange(link);
      onSuccess('Enlace generado', 'Comparte el enlace con quien quieras invitar.');
    } catch (e: any) {
      onError('Error', e.message ?? 'No se pudo generar el enlace.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await revokeInviteLink(teamId);
      onChange(null);
      onSuccess('Enlace revocado', 'El enlace ya no es válido.');
    } catch (e: any) {
      onError('Error', e.message ?? 'No se pudo revocar el enlace.');
    } finally {
      setRevoking(false);
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: `Únete a mi equipo en Tourney FC: ${inviteLink.url}`,
        url: inviteLink.url,
      });
    } catch {
      onError('Error', 'No se pudo abrir el menú de compartir.');
    }
  };

  if (!inviteLink) {
    return (
      <View
        className="bg-white rounded-2xl px-4 py-4"
        style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
      >
        <Text className="text-carbon text-xs mb-3 leading-5">
          Genera un enlace para que cualquier jugador pueda unirse a tu equipo sin necesidad de invitación por correo.
        </Text>
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
          className="bg-mist rounded-xl px-4 py-3 flex-row items-center gap-3"
        >
          <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
            {generating ? (
              <ActivityIndicator color="#0D7A3E" size="small" />
            ) : (
              <Feather name="link-2" size={16} color="#0D7A3E" />
            )}
          </View>
          <Text className="text-night font-sans-medium text-sm flex-1">
            {generating ? 'Generando enlace...' : 'Generar enlace'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      className="bg-white rounded-2xl px-4 py-4"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
        Enlace activo
      </Text>
      <TextInput
        value={inviteLink.url}
        editable={false}
        selectTextOnFocus
        multiline
        className="bg-mist rounded-xl px-3 py-2 text-night text-xs mb-2"
      />
      <Text className="text-carbon text-xs mb-3">{formatExpiresAt(inviteLink.expiresAt)}</Text>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.85}
          className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2"
        >
          <Feather name="share-2" size={16} color="white" />
          <Text className="text-white font-sans-medium text-sm">Compartir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRevoke}
          disabled={revoking}
          activeOpacity={0.85}
          className="flex-1 bg-white border border-mist rounded-xl py-3 flex-row items-center justify-center gap-2"
        >
          {revoking ? (
            <ActivityIndicator color="#E53935" size="small" />
          ) : (
            <>
              <Feather name="x-circle" size={16} color="#E53935" />
              <Text className="text-red-600 font-sans-medium text-sm">Revocar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
