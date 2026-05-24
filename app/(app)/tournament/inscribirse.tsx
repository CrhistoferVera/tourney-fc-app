import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Info, MapPin, Users, Zap, Shield } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import ShieldDisplay, { PRESETS } from '../../../components/tournament/ShieldDisplay';
import { useAlert } from '../../../hooks/useAlert';
import { createTeam, uploadEscudo } from '../../../services/teamsService';
import { getTournamentById } from '../../../services/tournamentService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODALIDAD_INFO: Record<string, { label: string; min: number; max: number; Icon: any }> = {
  FUTBOL_5:  { label: 'Fútbol 5',  min: 5,  max: 10, Icon: Zap },
  FUTBOL_7:  { label: 'Fútbol 7',  min: 7,  max: 14, Icon: Shield },
  FUTBOL_11: { label: 'Fútbol 11', min: 11, max: 22, Icon: Users },
};

export default function InscribirseScreen() {
  const {
    id: torneoId,
    nombre: torneoNombre,
    descripcion: torneoDescripcion,
    modalidad: torneoModalidad,
    maxEquipos,
    equiposInscritos,
    maxJugadoresPorEquipo,
    zona,
  } = useLocalSearchParams<{
    id: string;
    nombre?: string;
    descripcion?: string;
    modalidad?: string;
    maxEquipos?: string;
    equiposInscritos?: string;
    maxJugadoresPorEquipo?: string;
    zona?: string;
  }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [fetchedTournament, setFetchedTournament] = useState<any>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);

  useEffect(() => {
    if (!torneoId) return;
    if (torneoNombre && torneoModalidad && maxJugadoresPorEquipo) {
      setLoadingTournament(false);
      return;
    }
    const loadTournament = async () => {
      try {
        const data = await getTournamentById(torneoId);
        setFetchedTournament(data);
      } catch (e) {
        console.error('Error cargando torneo en inscribirse:', e);
      } finally {
        setLoadingTournament(false);
      }
    };
    loadTournament();
  }, [torneoId, torneoNombre, torneoModalidad, maxJugadoresPorEquipo]);

  // ── Derived info ────────────────────────────────────────────────────────────
  const finalNombre = torneoNombre || fetchedTournament?.nombre;
  const finalDescripcion = torneoDescripcion || fetchedTournament?.descripcion;
  const finalModalidad = torneoModalidad || fetchedTournament?.modalidad;
  const finalMaxEquipos = maxEquipos || fetchedTournament?.maxEquipos;
  const finalEquiposInscritos = equiposInscritos || fetchedTournament?.equiposInscritos;
  const finalMaxJugadores = maxJugadoresPorEquipo || fetchedTournament?.maxJugadoresPorEquipo;
  const finalZona = zona || fetchedTournament?.zona;

  const modalidadInfo = finalModalidad ? MODALIDAD_INFO[finalModalidad] : null;
  const maxEquiposNum = Number(finalMaxEquipos ?? 0);
  const equiposInscritosNum = Number(finalEquiposInscritos ?? 0);
  const maxJugadoresNum = Number(finalMaxJugadores ?? 0);
  const jugadoresMin = modalidadInfo?.min ?? 1;
  const jugadoresMax = maxJugadoresNum > 0 ? maxJugadoresNum : (modalidadInfo?.max ?? 30);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    if (!torneoId) return;
    setSaving(true);
    try {
      await createTeam(torneoId, {
        nombre: nombre.trim(),
        telefonoCapitan: telefono.trim() || undefined,
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

      {loadingTournament ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Info del torneo ── */}
        {finalNombre ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              marginBottom: 20,
              elevation: 2,
              shadowColor: '#0F1A14',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: '#EBF0EC',
            }}
          >
            {/* Título */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ backgroundColor: '#D4F5E2', borderRadius: 8, padding: 6 }}>
                <Info size={14} color="#0D7A3E" />
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#0F1A14', flex: 1 }}>
                {finalNombre}
              </Text>
            </View>

            {/* Descripción */}
            {!!finalDescripcion && (
              <Text
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: '#3D4F44',
                  lineHeight: 18,
                  marginBottom: 12,
                }}
              >
                {finalDescripcion}
              </Text>
            )}

            {/* Separador */}
            <View style={{ height: 1, backgroundColor: '#EBF0EC', marginBottom: 10 }} />

            {/* Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {/* Equipos */}
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: '#EBF0EC', borderRadius: 8,
                  paddingHorizontal: 9, paddingVertical: 5,
                }}
              >
                <Users size={12} color="#3D4F44" />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#3D4F44' }}>
                  {equiposInscritosNum}/{maxEquiposNum} equipos
                </Text>
              </View>

              {/* Jugadores */}
              {modalidadInfo && (
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#D4F5E2', borderRadius: 8,
                    paddingHorizontal: 9, paddingVertical: 5,
                  }}
                >
                  <modalidadInfo.Icon size={12} color="#0D7A3E" />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#0D7A3E' }}>
                    {modalidadInfo.label}
                  </Text>
                </View>
              )}

              {/* Zona */}
              {!!finalZona && (
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#EAF2FB', borderRadius: 8,
                    paddingHorizontal: 9, paddingVertical: 5,
                  }}
                >
                  <MapPin size={12} color="#1A73E8" />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#1A73E8' }}>
                    {finalZona}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

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

          {/* ── Requisito de jugadores (solo informativo) ── */}
          <View
            style={{
              backgroundColor: '#F4FAF6',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#D4F5E2',
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Users size={13} color="#0D7A3E" />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#0D7A3E' }}>
                Requisito de jugadores por equipo
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Mínimo */}
              <View
                style={{
                  flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10,
                  borderWidth: 1, borderColor: '#D4F5E2',
                  paddingVertical: 8, alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#3D4F44', marginBottom: 2 }}>
                  Mínimo
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#0D7A3E', lineHeight: 26 }}>
                  {jugadoresMin}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#3D4F44' }}>
                  jugadores
                </Text>
              </View>

              {/* Separador */}
              <View style={{ justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#A8B5AE' }}>—</Text>
              </View>

              {/* Máximo */}
              <View
                style={{
                  flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10,
                  borderWidth: 1, borderColor: '#D4F5E2',
                  paddingVertical: 8, alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#3D4F44', marginBottom: 2 }}>
                  Máximo
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#0D7A3E', lineHeight: 26 }}>
                  {jugadoresMax}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#3D4F44' }}>
                  jugadores
                </Text>
              </View>
            </View>
          </View>
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
      )}
    </View>
  );
}
