import { useState, useCallback } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getMyTeam, invitePlayer, MyTeam, UsuarioEquipoRow } from '../../../services/teamsService';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({
  row,
  isCapitan,
  isLast,
}: {
  readonly row: UsuarioEquipoRow;
  readonly isCapitan: boolean;
  readonly isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${isLast ? '' : 'border-b border-mist'}`}
    >
      {row.usuario.fotoPerfil ? (
        <Image
          source={{ uri: row.usuario.fotoPerfil }}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
        />
      ) : (
        <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center mr-3">
          <Feather name="user" size={16} color="#0D7A3E" />
        </View>
      )}
      <Text className="text-night font-sans-medium text-sm flex-1" numberOfLines={1}>
        {row.usuario.nombre}
      </Text>
      {isCapitan && (
        <View className="flex-row items-center gap-1 bg-primary-light px-2 py-0.5 rounded-full">
          <Feather name="star" size={10} color="#0D7A3E" />
          <Text className="text-primary text-xs font-sans-medium">Capitán</Text>
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MiEquipoScreen() {
  const { id: torneoId, rol } = useLocalSearchParams<{ id: string; rol: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [equipo, setEquipo] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailInvitar, setEmailInvitar] = useState('');
  const [invitando, setInvitando] = useState(false);

  const esCapitan = rol === 'CAPITAN';

  const fetchEquipo = useCallback(async () => {
    if (!torneoId) return;
    try {
      const data = await getMyTeam(torneoId);
      setEquipo(data);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el equipo');
    }
  }, [torneoId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEquipo().finally(() => setLoading(false));
    }, [fetchEquipo]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEquipo();
    setRefreshing(false);
  }, [fetchEquipo]);

  const handleInvitar = async () => {
    const email = emailInvitar.trim().toLowerCase();
    if (!email) {
      showError('Campo requerido', 'Ingresa el correo del jugador');
      return;
    }
    if (!equipo) return;
    setInvitando(true);
    try {
      await invitePlayer(equipo.id, email);
      setEmailInvitar('');
      await fetchEquipo();
      showSuccess('Invitación enviada', `Se envió una invitación a ${email}.`);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo enviar la invitación');
    } finally {
      setInvitando(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      </View>
    );
  }

  if (!equipo) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="shield-off" size={40} color="#3D4F44" />
          <Text className="text-carbon text-base text-center mt-4">
            No tienes un equipo en este torneo.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Mi equipo</Text>
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
          <ShieldDisplay escudo={equipo.escudo} size={64} />
          <View className="flex-1">
            <Text className="text-night font-sans-medium text-lg" numberOfLines={1}>
              {equipo.nombre}
            </Text>
            {!!equipo.telefonoCapitan && (
              <Text className="text-carbon text-xs mt-0.5">📞 {equipo.telefonoCapitan}</Text>
            )}
            <View className="flex-row items-center gap-1 mt-1.5">
              <Feather name={esCapitan ? 'star' : 'user'} size={11} color="#0D7A3E" />
              <Text className="text-primary text-xs font-sans-medium">
                {esCapitan ? 'Eres el capitán' : 'Eres jugador'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Jugadores ── */}
        <View className="flex-row items-center mb-3">
          <Text className="text-night font-sans-medium text-base flex-1">
            Jugadores
          </Text>
          <View className="bg-primary-light px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs font-sans-medium">{equipo.jugadores.length}</Text>
          </View>
        </View>

        <View
          className="bg-white rounded-2xl mb-5 overflow-hidden"
          style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
        >
          {equipo.jugadores.length === 0 ? (
            <View className="px-4 py-8 items-center">
              <Text className="text-carbon text-sm">Sin jugadores registrados aún.</Text>
            </View>
          ) : (
            equipo.jugadores.map((row, index) => (
              <PlayerRow
                key={row.id}
                row={row}
                isCapitan={row.usuario.id === equipo.capitanId}
                isLast={index === equipo.jugadores.length - 1}
              />
            ))
          )}
        </View>

        {/* ── CAPITAN ONLY ── */}
        {esCapitan && (
          <>
            {/* ── Invitar por correo ── */}
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

              {/* Pending invitations */}
              {equipo.invitaciones.length > 0 && (
                <View className="mt-3">
                  <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
                    Pendientes de aceptar ({equipo.invitaciones.length})
                  </Text>
                  {equipo.invitaciones.map((inv, idx) => {
                    const isLast = idx === equipo.invitaciones.length - 1;
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

            {/* ── Enlace de invitación (placeholder) ── */}
            <Text className="text-night font-sans-medium text-base mb-3">Enlace de invitación</Text>
            <View
              className="bg-white rounded-2xl px-4 py-4 mb-4"
              style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
            >
              <Text className="text-carbon text-xs mb-3 leading-5">
                Genera un enlace para que cualquier jugador pueda unirse a tu equipo sin necesidad de invitación por correo.
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                className="bg-mist rounded-xl px-4 py-3 flex-row items-center gap-3"
              >
                <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
                  <Feather name="link-2" size={16} color="#0D7A3E" />
                </View>
                <Text className="text-night font-sans-medium text-sm flex-1">Generar enlace</Text>
                <Feather name="chevron-right" size={16} color="#3D4F44" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                className="bg-mist rounded-xl px-4 py-3 flex-row items-center gap-3 mt-2"
              >
                <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center">
                  <Feather name="share-2" size={16} color="#0D7A3E" />
                </View>
                <Text className="text-night font-sans-medium text-sm flex-1">Compartir enlace</Text>
                <Feather name="chevron-right" size={16} color="#3D4F44" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
