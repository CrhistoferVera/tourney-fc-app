import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Feather from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { inboxService, Invitacion } from '../../services/inboxService';

const formatRelativa = (fecha: string) => {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return 'Hace unos minutos';
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
};

function InvitacionCard({
  item,
  onResponder,
}: {
  readonly item: Invitacion;
  readonly onResponder: (id: string, accion: 'aceptar' | 'rechazar') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleResponder = async (accion: 'aceptar' | 'rechazar') => {
    setLoading(true);
    await onResponder(item.id, accion);
    setLoading(false);
  };

  const esStaff = item.tipo === 'STAFF';

  return (
    <View className="bg-white mx-4 my-2 rounded-2xl p-4 shadow-sm border border-mist">
      {/* Cabecera */}
      <View className="flex-row items-center gap-3 mb-3">
        {item.invitador.fotoPerfil ? (
          <Image
            source={{ uri: item.invitador.fotoPerfil }}
            className="w-10 h-10 rounded-full"
          />
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
          <Text
            className={`text-xs font-sans-medium ${esStaff ? 'text-accent' : 'text-primary'}`}
          >
            {esStaff ? 'Staff' : 'Jugador'}
          </Text>
        </View>
      </View>

      {/* Mensaje */}
      <Text className="text-night text-sm mb-1">
        Te invitó a participar en{' '}
        <Text className="font-sans-medium">{item.torneo.nombre}</Text>
        {item.equipo ? (
          <>
            {' '}como jugador del equipo{' '}
            <Text className="font-sans-medium">{item.equipo.nombre}</Text>
          </>
        ) : (
          ' como miembro del staff'
        )}
      </Text>

      {/* Acciones */}
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

export default function Inbox() {
  const router = useRouter();
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    try {
      const data = await inboxService.getInvitaciones();
      setInvitaciones(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudieron cargar las invitaciones');
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
      await (accion === 'aceptar'
        ? inboxService.aceptar(id)
        : inboxService.rechazar(id));
      setInvitaciones((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo procesar la invitación');
    }
  };

  return (
    <View className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium">Bandeja de entrada</Text>
          {invitaciones.length > 0 && (
            <View className="ml-auto bg-accent rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-sans-medium">
                {invitaciones.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Contenido */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D7A3E" />
        </View>
      ) : (
        <FlatList
          data={invitaciones}
          keyExtractor={(item) => item.id}
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
          renderItem={({ item }) => (
            <InvitacionCard item={item} onResponder={handleResponder} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Feather name="inbox" size={48} color="#9CA3AF" />
              <Text className="text-carbon text-base mt-4 text-center">
                No tienes invitaciones pendientes
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
