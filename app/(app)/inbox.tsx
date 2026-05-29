import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Feather from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  inboxService,
  Invitacion,
  NotificacionBandeja,
} from '../../services/inboxService';

const formatRelativa = (fecha: string) => {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return 'Hace unos minutos';
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
};

type InboxItem =
  | { kind: 'invitacion'; data: Invitacion }
  | { kind: 'notificacion'; data: NotificacionBandeja };

type InboxSection = { title: string; data: InboxItem[] };

function InvitacionCard({
  item,
  onResponder,
}: {
  readonly item: Invitacion;
  readonly onResponder: (id: string, accion: 'aceptar' | 'rechazar') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const esStaff = item.tipo === 'STAFF';

  const handleResponder = async (accion: 'aceptar' | 'rechazar') => {
    setLoading(true);
    await onResponder(item.id, accion);
    setLoading(false);
  };

  return (
    <View className="bg-white mx-4 my-2 rounded-2xl p-4 shadow-sm border border-mist">
      <View className="flex-row items-center gap-3 mb-3">
        {item.invitador.fotoPerfil ? (
          <Image source={{ uri: item.invitador.fotoPerfil }} className="w-10 h-10 rounded-full" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
            <Text className="text-white font-sans-medium text-sm">
              {item.invitador.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>
            {item.invitador.nombre}
          </Text>
          <Text className="text-carbon text-xs">{formatRelativa(item.createdAt)}</Text>
        </View>
        <View
          className={`px-2 py-0.5 rounded-full ${esStaff ? 'bg-accent/10' : 'bg-primary/10'}`}
        >
          <Text className={`text-xs font-sans-medium ${esStaff ? 'text-accent' : 'text-primary'}`}>
            {esStaff ? 'Staff' : 'Jugador'}
          </Text>
        </View>
      </View>

      <Text className="text-night text-sm mb-1">
        Te invitó a participar en{' '}
        <Text className="font-sans-medium">{item.torneo.nombre}</Text>
        {item.equipo ? (
          <>
            {' '}
            como jugador del equipo <Text className="font-sans-medium">{item.equipo.nombre}</Text>
          </>
        ) : (
          ' como miembro del staff'
        )}
      </Text>

      {loading ? (
        <View className="items-center py-2">
          <ActivityIndicator size="small" color="#0D7A3E" />
        </View>
      ) : (
        <View className="flex-row gap-3 mt-3">
          <TouchableOpacity
            onPress={() => handleResponder('rechazar')}
            className="flex-1 py-2 rounded-xl border border-mist items-center"
          >
            <Text className="text-carbon font-sans-medium text-sm">Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleResponder('aceptar')}
            className="flex-1 py-2 rounded-xl bg-primary items-center"
          >
            <Text className="text-white font-sans-medium text-sm">Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function NotificacionCard({
  item,
  onMarcarLeida,
}: {
  readonly item: NotificacionBandeja;
  readonly onMarcarLeida: (id: string) => Promise<void>;
}) {
  return (
    <TouchableOpacity
      className={`bg-white mx-4 my-2 rounded-2xl p-4 border ${item.leida ? 'border-mist' : 'border-primary/30'}`}
      onPress={() => !item.leida && onMarcarLeida(item.id)}
      activeOpacity={item.leida ? 1 : 0.7}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-night text-sm flex-1">{item.mensaje}</Text>
        {!item.leida && <View className="w-2 h-2 rounded-full bg-primary mt-1" />}
      </View>
      {item.torneo && (
        <Text className="text-primary text-xs font-sans-medium mt-2">{item.torneo.nombre}</Text>
      )}
      <Text className="text-carbon text-xs mt-2">{formatRelativa(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

export default function Inbox() {
  const router = useRouter();
  const [sections, setSections] = useState<InboxSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const buildSections = (invitaciones: Invitacion[], notificaciones: NotificacionBandeja[]) => {
    const result: InboxSection[] = [];

    if (invitaciones.length > 0) {
      result.push({
        title: 'Invitaciones pendientes',
        data: invitaciones.map((data) => ({ kind: 'invitacion' as const, data })),
      });
    }

    if (notificaciones.length > 0) {
      result.push({
        title: 'Notificaciones',
        data: notificaciones.map((data) => ({ kind: 'notificacion' as const, data })),
      });
    }

    return result;
  };

  const cargar = async () => {
    try {
      const [invitaciones, notificaciones] = await Promise.all([
        inboxService.getInvitaciones(),
        inboxService.getNotificaciones(),
      ]);
      setSections(buildSections(invitaciones ?? [], notificaciones ?? []));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo cargar la bandeja';
      Alert.alert('Error', msg);
      setSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, []),
  );

  const handleResponder = async (id: string, accion: 'aceptar' | 'rechazar'): Promise<void> => {
    try {
      await (accion === 'aceptar' ? inboxService.aceptar(id) : inboxService.rechazar(id));
      await cargar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo procesar la invitación';
      Alert.alert('Error', msg);
    }
  };

  const handleMarcarLeida = async (id: string) => {
    try {
      await inboxService.marcarLeida(id);
      await cargar();
    } catch {
      // silencioso
    }
  };

  const totalItems = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <View className="flex-1 bg-mist">
      <View className="bg-primary px-6 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium">Bandeja de entrada</Text>
          {totalItems > 0 && (
            <View className="ml-auto bg-accent rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-sans-medium">{totalItems}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D7A3E" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.data.id}`}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                cargar();
              }}
              colors={['#0D7A3E']}
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-carbon text-xs font-sans-medium uppercase px-5 py-2">
              {title}
            </Text>
          )}
          renderItem={({ item }) =>
            item.kind === 'invitacion' ? (
              <InvitacionCard item={item.data} onResponder={handleResponder} />
            ) : (
              <NotificacionCard item={item.data} onMarcarLeida={handleMarcarLeida} />
            )
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-16">
              <Feather name="inbox" size={48} color="#9CA3AF" />
              <Text className="text-carbon text-base mt-4 text-center">
                No tienes invitaciones ni notificaciones
              </Text>
              <Text className="text-carbon text-sm mt-2 text-center">
                Las invitaciones a torneos y avisos del sistema aparecerán aquí
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
