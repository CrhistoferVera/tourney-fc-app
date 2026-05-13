import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createTeam, uploadEscudo } from '../../../services/teamsService';
import ShieldDisplay, { PRESETS } from '../../../components/tournament/ShieldDisplay';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function InscribirseScreen() {
  const { id: torneoId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cantidadJugadores, setCantidadJugadores] = useState('');
  const [escudo, setEscudo] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Permiso requerido', 'Necesitas dar acceso a la galería para subir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: asset.uri, name: 'escudo.jpg', type: 'image/jpeg' } as any);
      const { url } = await uploadEscudo(formData);
      setEscudo(url);
      setLocalPreviewUri(asset.uri);
    } catch {
      showError('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      showError('Campo requerido', 'Ingresa el nombre del equipo.');
      return;
    }
    const jugadoresNum = cantidadJugadores.trim()
      ? Number.parseInt(cantidadJugadores, 10)
      : undefined;
    if (cantidadJugadores.trim() && (Number.isNaN(jugadoresNum) || jugadoresNum < 1)) {
      showError('Cantidad inválida', 'Ingresa un número de jugadores válido.');
      return;
    }
    if (!torneoId) return;
    setSaving(true);
    try {
      await createTeam(torneoId, {
        nombre: nombre.trim(),
        telefonoCapitan: telefono.trim() || undefined,
        cantidadJugadores: jugadoresNum,
        escudo: escudo ?? undefined,
      });
      showSuccess(
        'Solicitud enviada',
        'Tu solicitud fue enviada. El organizador la revisará pronto.',
        () => router.back(),
      );
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo enviar la solicitud.');
    } finally {
      setSaving(false);
    }
  };

  const isCustomImage = !!localPreviewUri;
  let escudoLabel = 'Sin escudo — se usará el predeterminado';
  if (isCustomImage) escudoLabel = 'Imagen personalizada';
  else if (escudo?.startsWith('preset_')) escudoLabel = 'Escudo genérico seleccionado';

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Inscribir equipo</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Escudo ── */}
        <Text className="text-night font-sans-medium text-base mb-3">Escudo del equipo</Text>

        {/* Preview */}
        <View
          className="bg-white rounded-2xl p-5 mb-4 items-center"
          style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
        >
          {isCustomImage ? (
            <Image
              source={{ uri: localPreviewUri }}
              style={{ width: 88, height: 88, borderRadius: 18 }}
              resizeMode="cover"
            />
          ) : (
            <ShieldDisplay escudo={escudo} size={88} />
          )}
          <Text className="text-carbon text-xs mt-3 text-center">{escudoLabel}</Text>
        </View>

        {/* Presets */}
        <Text className="text-carbon text-xs font-sans-medium mb-2 uppercase tracking-wide">
          Escudos genéricos
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {PRESETS.map((preset) => {
            const selected = escudo === preset.id && !localPreviewUri;
            return (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.8}
                onPress={() => {
                  setEscudo(preset.id);
                  setLocalPreviewUri(null);
                }}
                style={{
                  borderWidth: 3,
                  borderColor: selected ? '#0F1A14' : 'transparent',
                  borderRadius: 17,
                  padding: 2,
                }}
              >
                <ShieldDisplay escudo={preset.id} size={52} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gallery picker */}
        <TouchableOpacity
          onPress={handlePickGallery}
          disabled={uploading}
          activeOpacity={0.8}
          className="bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 mb-6 border border-mist"
          style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}
        >
          {uploading ? (
            <ActivityIndicator color="#0D7A3E" size="small" />
          ) : (
            <Feather name="image" size={20} color="#0D7A3E" />
          )}
          <Text className="text-night font-sans-medium text-sm flex-1">
            {uploading ? 'Subiendo imagen...' : 'Elegir de galería'}
          </Text>
          {!uploading && <Feather name="chevron-right" size={16} color="#3D4F44" />}
        </TouchableOpacity>

        {/* ── Datos del equipo ── */}
        <Text className="text-night font-sans-medium text-base mb-3">Datos del equipo</Text>
        <View
          className="bg-white rounded-2xl px-4 py-4 mb-6"
          style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
        >
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-3"
            placeholder="Nombre del equipo *"
            placeholderTextColor="#3D4F44"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-3"
            placeholder="Teléfono del capitán (opcional)"
            placeholderTextColor="#3D4F44"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm"
            placeholder="Cantidad de jugadores (opcional)"
            placeholderTextColor="#3D4F44"
            keyboardType="number-pad"
            value={cantidadJugadores}
            onChangeText={setCantidadJugadores}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving || uploading}
          activeOpacity={0.85}
          className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Feather name="send" size={18} color="white" />
              <Text className="text-white font-sans-medium text-base">Enviar solicitud</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
