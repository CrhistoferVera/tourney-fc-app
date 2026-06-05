import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { MapPin, Navigation } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { getCamposByTournament, CampoDetalle } from '../../../services/tournamentService';
import { useAlert } from '../../../hooks/useAlert';
import CustomAlert from '../../../components/CustomAlert';

function hasCoords(c: CampoDetalle): c is CampoDetalle & { latitud: number; longitud: number } {
  return typeof c.latitud === 'number' && typeof c.longitud === 'number';
}

function openInMaps(lat: number, lng: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodedLabel}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`),
  );
}

function openAddressInMaps(address: string, label: string) {
  const query = encodeURIComponent(`${label} ${address}`);
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${query}`,
    android: `geo:0,0?q=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`),
  );
}

export default function CanchasScreen() {
  const { id: torneoId, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlert();

  const [campos, setCampos] = useState<CampoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampos = useCallback(async () => {
    if (!torneoId) return;
    try {
      const data = await getCamposByTournament(torneoId);
      setCampos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudieron cargar las canchas');
    }
  }, [torneoId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCampos().finally(() => setLoading(false));
    }, [fetchCampos]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCampos();
    setRefreshing(false);
  }, [fetchCampos]);

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-sans-medium" numberOfLines={1}>
            Canchas
          </Text>
          {!!nombre && (
            <Text className="text-primary-light text-xs" numberOfLines={1}>
              {nombre}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7A3E" />
          }
        >
          {campos.length === 0 ? (
            <View className="bg-white rounded-2xl px-4 py-8 items-center mt-4">
              <View style={{ backgroundColor: '#D4F5E2', borderRadius: 16, padding: 12, marginBottom: 12 }}>
                <MapPin size={24} color="#0D7A3E" />
              </View>
              <Text className="text-carbon text-sm text-center">
                Este torneo no tiene canchas registradas.
              </Text>
            </View>
          ) : (
            campos.map((campo) => (
              <View
                key={campo.id}
                className="bg-white rounded-2xl mb-4 overflow-hidden"
                style={{ shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
              >
                {/* Encabezado de la cancha */}
                <View className="px-4 pt-4 pb-3 flex-row items-start">
                  <View style={{ backgroundColor: '#D4F5E2', borderRadius: 10, padding: 6, marginRight: 10 }}>
                    <MapPin size={16} color="#0D7A3E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-night font-sans-medium text-base">{campo.nombre}</Text>
                    {!!campo.direccion && (
                      <Text className="text-carbon text-xs mt-0.5">{campo.direccion}</Text>
                    )}
                  </View>
                </View>

                {/* Mapa + acción */}
                {hasCoords(campo) ? (
                  <>
                    <MapView
                      style={{ width: '100%', height: 160 }}
                      pointerEvents="none"
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                      initialRegion={{
                        latitude: campo.latitud,
                        longitude: campo.longitud,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                    >
                      <Marker
                        coordinate={{ latitude: campo.latitud, longitude: campo.longitud }}
                        pinColor="#0D7A3E"
                      />
                    </MapView>
                    <TouchableOpacity
                      onPress={() => openInMaps(campo.latitud, campo.longitud, campo.nombre)}
                      activeOpacity={0.85}
                      className="flex-row items-center justify-center gap-2 py-3 border-t border-mist"
                    >
                      <Navigation size={15} color="#0D7A3E" />
                      <Text className="text-primary font-sans-medium text-sm">Abrir en Maps</Text>
                    </TouchableOpacity>
                  </>
                ) : !!campo.direccion && (
                  <TouchableOpacity
                    onPress={() => openAddressInMaps(campo.direccion!, campo.nombre)}
                    activeOpacity={0.85}
                    className="flex-row items-center justify-center gap-2 py-3 border-t border-mist"
                  >
                    <Navigation size={15} color="#0D7A3E" />
                    <Text className="text-primary font-sans-medium text-sm">Abrir en Maps</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
