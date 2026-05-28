import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import InviteLinkSection from '../../../components/team/InviteLinkSection';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import { useAlert } from '../../../hooks/useAlert';
import { useAuthStore } from '../../../store/authStore';
import {
  deleteTeam,
  getTeamById,
  invitePlayer,
  leaveTeam,
  MyTeam,
} from '../../../services/teamsService';

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuthStore();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();

  const [team, setTeam] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailInvitar, setEmailInvitar] = useState('');
  const [invitando, setInvitando] = useState(false);
  const [actuando, setActuando] = useState(false);

  const esCapitan = !!team && !!usuario && team.capitanId === usuario.id;

  const fetchTeam = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTeamById(id);
      setTeam(data);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el equipo.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTeam().finally(() => setLoading(false));
    }, [fetchTeam]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeam();
    setRefreshing(false);
  }, [fetchTeam]);

  const handleInvitar = async () => {
    const email = emailInvitar.trim().toLowerCase();
    if (!email) {
      showError('Campo requerido', 'Ingresa el correo del jugador.');
      return;
    }
    if (!team) return;
    setInvitando(true);
    try {
      await invitePlayer(team.id, email);
      setEmailInvitar('');
      await fetchTeam();
      showSuccess('Invitación enviada', `Se envió una invitación a ${email}.`);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo enviar la invitación.');
    } finally {
      setInvitando(false);
    }
  };

  const handleDelete = () => {
    if (!team) return;
    showConfirm(
      'Eliminar equipo',
      `¿Seguro que quieres eliminar "${team.nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        setActuando(true);
        try {
          await deleteTeam(team.id);
          showSuccess('Equipo eliminado', 'El equipo fue eliminado correctamente.', () => router.back());
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo eliminar el equipo.');
        } finally {
          setActuando(false);
        }
      },
    );
  };

  const handleLeave = () => {
    if (!team) return;
    showConfirm(
      'Salir del equipo',
      `¿Seguro que quieres salir de "${team.nombre}"?`,
      async () => {
        setActuando(true);
        try {
          await leaveTeam(team.id);
          showSuccess('Saliste del equipo', 'Ya no formas parte de este equipo.', () => router.back());
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo salir del equipo.');
        } finally {
          setActuando(false);
        }
      },
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-mist items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  }

  if (!team) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="shield-off" size={40} color="#3D4F44" />
          <Text className="text-carbon text-base text-center mt-4">No se encontró el equipo.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
          {team.nombre}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D7A3E"
            colors={['#0D7A3E']}
          />
        }
      >
        {/* Team card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 mb-4 flex-row items-center"
          style={{ gap: 16, elevation: 2, shadowColor: '#0F1A14', shadowOpacity: 0.06, shadowRadius: 8 }}
        >
          <ShieldDisplay escudo={team.escudo} size={64} />
          <View className="flex-1">
            <Text className="text-night font-sans-medium text-lg" numberOfLines={1}>
              {team.nombre}
            </Text>
            {!!team.telefonoCapitan && (
              <Text className="text-carbon text-xs mt-0.5">📞 {team.telefonoCapitan}</Text>
            )}
            <View className="flex-row items-center gap-1 mt-1.5">
              <Feather name={esCapitan ? 'star' : 'user'} size={11} color="#0D7A3E" />
              <Text className="text-primary text-xs font-sans-medium">
                {esCapitan ? 'Eres el capitán' : 'Eres jugador'}
              </Text>
            </View>
          </View>
        </View>

        {/* Jugadores */}
        <View className="flex-row items-center mb-3">
          <Text className="text-night font-sans-medium text-base flex-1">Jugadores</Text>
          <View className="bg-primary-light px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs font-sans-medium">{team.jugadores.length}</Text>
          </View>
        </View>

        <View
          className="bg-white rounded-2xl px-3 py-2 mb-6"
          style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
        >
          {team.jugadores.length === 0 ? (
            <Text className="text-carbon text-sm text-center py-6">
              Sin jugadores aún. Invita por correo o comparte el enlace.
            </Text>
          ) : (
            team.jugadores.map((row, idx) => {
              const isLast = idx === team.jugadores.length - 1;
              const j = row.usuario;
              const isCap = team.capitanId === j.id;
              return (
                <View
                  key={row.id}
                  className={`flex-row items-center px-2 py-2.5 ${isLast ? '' : 'border-b border-mist'}`}
                >
                  {j.fotoPerfil ? (
                    <Image
                      source={{ uri: j.fotoPerfil }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    />
                  ) : (
                    <View className="w-9 h-9 rounded-full bg-mist items-center justify-center">
                      <Text className="text-carbon text-sm font-sans-medium">
                        {j.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-night text-sm font-sans-medium" numberOfLines={1}>
                        {j.nombre}
                      </Text>
                      {isCap && <Feather name="star" size={12} color="#F5820D" />}
                    </View>
                    {!!j.email && (
                      <Text className="text-carbon text-xs" numberOfLines={1}>
                        {j.email}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {esCapitan && (
          <>
            {/* Invitar por correo */}
            <Text className="text-night font-sans-medium text-base mb-3">Invitar jugador</Text>
            <View
              className="bg-white rounded-2xl px-4 py-4 mb-5"
              style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
            >
              <View className="flex-row gap-2 mb-1">
                <TextInput
                  className="bg-mist rounded-xl px-4 py-3 text-night text-sm flex-1"
                  placeholder="Correo del jugador"
                  placeholderTextColor="#3D4F44"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailInvitar}
                  onChangeText={setEmailInvitar}
                  editable={!invitando}
                  returnKeyType="send"
                  onSubmitEditing={handleInvitar}
                />
                <TouchableOpacity
                  onPress={handleInvitar}
                  disabled={invitando}
                  activeOpacity={0.85}
                  className="bg-primary rounded-xl px-4 items-center justify-center"
                  style={{ minWidth: 80 }}
                >
                  {invitando ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-sans-medium text-sm">Invitar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {team.invitaciones.length > 0 && (
                <View className="mt-3">
                  <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
                    Pendientes de aceptar ({team.invitaciones.length})
                  </Text>
                  {team.invitaciones.map((inv, idx) => {
                    const isLast = idx === team.invitaciones.length - 1;
                    return (
                      <View
                        key={inv.id}
                        className={`flex-row items-center py-2.5 ${isLast ? '' : 'border-b border-mist'}`}
                      >
                        <View className="w-8 h-8 rounded-full bg-accent-soft items-center justify-center mr-3">
                          <Feather name="mail" size={14} color="#F5820D" />
                        </View>
                        <Text className="text-carbon text-sm flex-1" numberOfLines={1}>
                          {inv.email}
                        </Text>
                        <View className="bg-accent-soft px-2 py-0.5 rounded-full">
                          <Text className="text-accent text-xs">Pendiente</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Enlace de invitación */}
            <Text className="text-night font-sans-medium text-base mb-3">Enlace de invitación</Text>
            <View className="mb-6">
              <InviteLinkSection
                teamId={team.id}
                inviteLink={team.inviteLink ?? null}
                onChange={(link) => setTeam((prev) => (prev ? { ...prev, inviteLink: link } : prev))}
                onError={showError}
                onSuccess={showSuccess}
              />
            </View>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={actuando}
              activeOpacity={0.85}
              className="bg-white border border-red-200 rounded-2xl py-3 flex-row items-center justify-center gap-2"
            >
              {actuando ? (
                <ActivityIndicator color="#E53935" />
              ) : (
                <>
                  <Feather name="trash-2" size={16} color="#E53935" />
                  <Text className="text-red-600 font-sans-medium text-sm">Eliminar equipo</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {!esCapitan && (
          <TouchableOpacity
            onPress={handleLeave}
            disabled={actuando}
            activeOpacity={0.85}
            className="bg-white border border-red-200 rounded-2xl py-3 flex-row items-center justify-center gap-2 mt-2"
          >
            {actuando ? (
              <ActivityIndicator color="#E53935" />
            ) : (
              <>
                <Feather name="log-out" size={16} color="#E53935" />
                <Text className="text-red-600 font-sans-medium text-sm">Salir del equipo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
