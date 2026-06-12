import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import Feather from '@expo/vector-icons/build/Feather';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { inboxService, Invitacion } from '../../services/inboxService';
import BallLoader from '../../components/common/BallLoader';

const formatRelativa = (fecha: string) => {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return 'Hace unos minutos';
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
};


/* ─── Card de invitación ─── */
function InvitacionCard({
  item,
  onResponder,
  index,
}: {
  readonly item: Invitacion;
  readonly onResponder: (id: string, accion: 'aceptar' | 'rechazar') => Promise<void>;
  readonly index: number;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const handleResponder = async (accion: 'aceptar' | 'rechazar') => {
    setActionLoading(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.03, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    await onResponder(item.id, accion);
    setActionLoading(false);
  };

  const esStaff = item.tipo === 'STAFF';
  const badgeColor = esStaff ? '#F59E0B' : '#0D7A3E';
  const badgeBg = esStaff ? 'rgba(245,158,11,0.1)' : 'rgba(13,122,62,0.1)';
  const badgeLabel = esStaff ? 'Staff' : 'Jugador';
  const initials = item.invitador.nombre.charAt(0).toUpperCase();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        marginHorizontal: 16,
        marginVertical: 6,
      }}
    >
      <View
        style={{
          backgroundColor: 'white', borderRadius: 20, padding: 16,
          shadowColor: '#0F1A14', shadowOpacity: 0.08, shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 }, elevation: 4,
          borderLeftWidth: 4, borderLeftColor: badgeColor,
        }}
      >
        {/* Cabecera */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          {item.invitador.fotoPerfil ? (
            <Image
              source={{ uri: item.invitador.fotoPerfil }}
              style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: badgeColor + '40' }}
            />
          ) : (
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: badgeColor, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: badgeColor + '40' }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: '#0F1A14', fontWeight: '600', fontSize: 14, marginBottom: 2 }} numberOfLines={1}>
              {item.invitador.nombre}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="clock" size={11} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>{formatRelativa(item.createdAt)}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ color: badgeColor, fontSize: 11, fontWeight: '700' }}>{badgeLabel}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 }} />

        {/* Mensaje */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
          <View style={{ backgroundColor: badgeBg, borderRadius: 10, padding: 8, marginTop: 1 }}>
            <Feather name={esStaff ? 'shield' : 'users'} size={16} color={badgeColor} />
          </View>
          <Text style={{ flex: 1, color: '#3D4F44', fontSize: 13, lineHeight: 20 }}>
            {item.tipo === 'JUGADOR' && !item.torneo && item.equipo && (
              <>
                Te invitó a unirse al equipo{' '}
                <Text style={{ fontWeight: '700', color: '#0F1A14' }}>{item.equipo.nombre}</Text>
              </>
            )}
            {item.torneo && (
              <>
                Te invitó a participar en{' '}
                <Text style={{ fontWeight: '700', color: '#0F1A14' }}>{item.torneo.nombre}</Text>
                {item.equipo ? (
                  <> como jugador del equipo{' '}<Text style={{ fontWeight: '700', color: '#0F1A14' }}>{item.equipo.nombre}</Text></>
                ) : ' como miembro del staff'}
              </>
            )}
          </Text>
        </View>

        {/* Acciones */}
        {actionLoading ? (
          <View style={{ height: 80, justifyContent: 'center' }}>
            <BallLoader size={32} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => handleResponder('rechazar')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <Feather name="x" size={14} color="#6B7280" />
              <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 13 }}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleResponder('aceptar')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: badgeColor, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, shadowColor: badgeColor, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }}
            >
              <Feather name="check" size={14} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

/* ─── Empty state ─── */
function EmptyState() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, opacity: fadeAnim }}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }], marginBottom: 24 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(13,122,62,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="inbox" size={44} color="#0D7A3E" />
        </View>
      </Animated.View>
      <Text style={{ color: '#0F1A14', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Todo al día</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
        No tienes invitaciones pendientes. Cuando alguien te invite, aparecerá aquí.
      </Text>
    </Animated.View>
  );
}

/* ─── Pantalla principal ─── */
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
      await (accion === 'aceptar' ? inboxService.aceptar(id) : inboxService.rechazar(id));
      setInvitaciones((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo procesar la invitación');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F5F3' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ backgroundColor: '#0D7A3E', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, position: 'relative' }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <View style={{ position: 'absolute', bottom: -30, left: 30, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginRight: 12 }}>
            <Feather name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Bandeja de entrada</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
              {invitaciones.length > 0
                ? `${invitaciones.length} invitación${invitaciones.length > 1 ? 'es' : ''} pendiente${invitaciones.length > 1 ? 's' : ''}`
                : 'Sin invitaciones pendientes'}
            </Text>
          </View>
          {invitaciones.length > 0 && (
            <View style={{ backgroundColor: '#F59E0B', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#F59E0B', shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{invitaciones.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        {refreshing && (
          <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 10, alignItems: 'center' }}>
            <BallLoader size={38} />
          </View>
        )}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <BallLoader size={52} />
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 22, letterSpacing: 0.3 }}>
              Cargando invitaciones...
            </Text>
          </View>
        ) : (
          <FlatList
            data={invitaciones}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); cargar(); }}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
                progressViewOffset={-1000}
              />
            }
            renderItem={({ item, index }) => (
              <InvitacionCard item={item} onResponder={handleResponder} index={index} />
            )}
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>
    </View>
  );
}
