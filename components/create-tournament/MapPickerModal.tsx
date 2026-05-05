import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
}

const DEFAULT_REGION: Region = {
  latitude: -17.3895,
  longitude: -66.1568,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapPickerModal({ visible, onClose, onConfirm }: Props) {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [markerCoords, setMarkerCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (visible) {
      locateUser();
    }
  }, [visible]);

  const locateUser = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const r: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(r);
        mapRef.current?.animateToRegion(r, 500);
      }
    } catch {
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setMarkerCoords(coords);
    setLoadingAddress(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.streetNumber, r.district, r.city].filter(Boolean);
        setResolvedAddress(parts.join(', '));
      }
    } catch {
      setResolvedAddress('');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(resolvedAddress);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={onClose} className="mr-3">
            <Text className="text-white text-base">✕</Text>
          </TouchableOpacity>
          <Text className="text-white font-sans-medium text-base flex-1">
            Seleccionar ubicación
          </Text>
          {loadingLocation && <ActivityIndicator color="white" size="small" />}
        </View>

        <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} onPress={handleMapPress}>
          {markerCoords && <Marker coordinate={markerCoords} pinColor="#0D7A3E" />}
        </MapView>

        <View className="bg-white px-5 pt-4 pb-8">
          {markerCoords ? (
            <>
              <Text className="text-carbon text-xs font-sans-medium mb-1">
                Dirección seleccionada
              </Text>
              {loadingAddress ? (
                <ActivityIndicator color="#0D7A3E" size="small" />
              ) : (
                <TextInput
                  value={resolvedAddress}
                  onChangeText={setResolvedAddress}
                  className="bg-mist rounded-xl px-4 py-3 text-night font-sans text-sm border border-mist mb-4"
                  placeholder="Escribe o edita la dirección..."
                  placeholderTextColor="#3D4F44"
                />
              )}
              <TouchableOpacity
                onPress={handleConfirm}
                className="bg-primary rounded-2xl py-3 items-center"
                activeOpacity={0.85}
              >
                <Text className="text-white font-sans-medium text-sm">Confirmar ubicación</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-carbon text-sm text-center py-2">
              Toca el mapa para seleccionar la ubicación de la cancha
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
