import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
  removePlayer,
  MyTeam,
} from '../../../services/teamsService';
import { userService, User } from '../../../services/userService';

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
  const [jugadorQuery, setJugadorQuery] = useState('');
  const [jugadorResults, setJugadorResults] = useState<User[]>([]);
  const [searching, setSearchinging] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const esCapitan = !!team && !!usuario && team.capitanId === usuario.id;

  // Vuelve atrás si hay historial; si se llegó por deep link (sin stack
  // previo), cae a la lista de equipos.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/mis-equipos' as never);
  };

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

  const handleInvitar = async (emailArg?: string) => {
    const email = (emailArg ?? emailInvitar).trim().toLowerCase();
    if (!email) {
      showError('Campo requerido', 'Ingresa el correo del jugador.');
      return;
    }
    if (!team) return;
    setInvitando(true);
    try {
      await invitePlayer(team.id, email);
      setEmailInvitar('');
      setJugadorQuery('');
      setJugadorResults([]);
      await fetchTeam();
      showSuccess('Invitación enviada', `Se envió una invitación a ${email}.`);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo enviar la invitación.');
    } finally {
      setInvitando(false);
    }
  };

  const handleSearch = useCallback((text: string) => {
    setJugadorQuery(text);
    setJugadorResults([]);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim() || text.length < 2) return;
    searchTimeout.current = setTimeout(async () => {
      setSearchinging(true);
      try {
        const yaInvitados = new Set(team?.invitaciones.map((i) => i.email) ?? []);
        const yaMiembros = new Set(team?.jugadores.map((j) => j.usuario.email) ?? []);
        const results = await userService.searchUsers(text.trim());
        setJugadorResults(results.filter((u) => !yaInvitados.has(u.email) && !yaMiembros.has(u.email)));
      } catch { setJugadorResults([]); }
      finally { setSearchinging(false); }
    }, 350);
  }, [team]);

  const handleDelete = () => {
    if (!team) return;
    showConfirm(
      'Eliminar equipo',
      `¿Seguro que quieres eliminar "${team.nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        setActuando(true);
        try {
          await deleteTeam(team.id);
          showSuccess('Equipo eliminado', 'El equipo fue eliminado correctamente.', () => goBack());
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
          showSuccess('Saliste del equipo', 'Ya no formas parte de este equipo.', () => goBack());
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo salir del equipo.');
        } finally {
          setActuando(false);
        }
      },
    );
  };

  const handleRemovePlayer = (targetUserId: string, nombreJugador: string) => {
    if (!team) return;
    showConfirm(
      'Eliminar jugador',
      `¿Seguro que quieres eliminar a ${nombreJugador} del equipo?`,
      async () => {
        setActuando(true);
        try {
          await removePlayer(team.id, targetUserId);
          showSuccess('Jugador eliminado', `${nombreJugador} ya no forma parte del equipo.`);
          await fetchTeam();
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo eliminar al jugador.');
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
          <TouchableOpacity onPress={() => goBack()} className="mr-3">
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
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => goBack()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
          {team.nombre}
        </Text>
        {esCapitan && (
          <TouchableOpacity onPress={() => router.push(`/team/edit?id=${team.id}` as never)}>
            <Feather name="edit-2" size={20} color="white" />
          </TouchableOpacity>
        )}
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
                    {esCapitan && !isCap && (
                      <TouchableOpacity
                        onPress={() => handleRemovePlayer(j.id, j.nombre)}
                        className="ml-2 p-2 bg-mist rounded-full"
                        activeOpacity={0.7}
                      >
                        <Feather name="user-x" size={16} color="#E53935" />
                      </TouchableOpacity>
                    )}
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
              <Text className="text-carbon text-xs mb-3">
                Busca por nombre o correo para invitar jugadores al equipo.
              </Text>
              <View className="flex-row items-center bg-mist rounded-xl px-3 py-3 mb-1">
                <Feather name="search" size={15} color="#3D4F44" style={{ marginRight: 8 }} />
                <TextInput
                  className="flex-1 text-night text-sm"
                  placeholder="Buscar por nombre o correo..."
                  placeholderTextColor="#3D4F44"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={jugadorQuery}
                  onChangeText={handleSearch}
                />
                {searching && <ActivityIndicator size="small" color="#0D7A3E" />}
                {!searching && jugadorQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setJugadorQuery(''); setJugadorResults([]); }}>
                    <Feather name="x" size={15} color="#3D4F44" />
                  </TouchableOpacity>
                )}
              </View>
              {jugadorResults.length > 0 && (
                <View className="border border-mist rounded-xl overflow-hidden mt-1">
                  {jugadorResults.map((user, index) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => {
                        setJugadorQuery('');
                        setJugadorResults([]);
                        handleInvitar(user.email);
                      }}
                      activeOpacity={0.75}
                      className={`flex-row items-center px-3 py-3 ${index < jugadorResults.length - 1 ? 'border-b border-mist' : ''}`}
                    >
                      <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-3">
                        <Text className="text-primary text-xs font-sans-medium">
                          {user.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-night text-sm font-sans-medium">{user.nombre}</Text>
                        <Text className="text-carbon text-xs">{user.email}</Text>
                      </View>
                      <Feather name="plus-circle" size={18} color="#0D7A3E" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {jugadorQuery.length >= 2 && !searching && jugadorResults.length === 0 && (
                <View className="py-3 items-center">
                  <Text className="text-carbon text-xs">No se encontraron usuarios.</Text>
                </View>
              )}

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
    </KeyboardAvoidingView>
  );
}
