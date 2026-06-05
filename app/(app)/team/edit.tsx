import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomAlert from '../../../components/CustomAlert';
import EscudoPicker from '../../../components/team/EscudoPicker';
import { useAlert } from '../../../hooks/useAlert';
import { getTeamById, updateTeam, MyTeam } from '../../../services/teamsService';

export default function EditTeamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [escudo, setEscudo] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTeamById(id);
      setNombre(data.nombre);
      setTelefono(data.telefonoCapitan || '');
      setEscudo(data.escudo);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTeam();
    }, [fetchTeam]),
  );

  const handleSubmit = async () => {
    const trimmed = nombre.trim();
    if (trimmed.length < 3) {
      showError('Nombre inválido', 'El nombre del equipo debe tener al menos 3 caracteres.');
      return;
    }
    if (!id) return;
    
    setSaving(true);
    try {
      await updateTeam(id, {
        nombre: trimmed,
        telefonoCapitan: telefono.trim() || undefined,
        escudo: escudo ?? undefined,
      });
      showSuccess('Equipo actualizado', `Los datos de ${trimmed} se guardaron correctamente.`, () => {
        router.back();
      });
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo actualizar el equipo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-mist items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
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
        <Text className="text-white text-xl font-sans-medium flex-1">Editar equipo</Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={Platform.OS === 'ios' ? 20 : 150}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 150}
      >
        <Text className="text-night font-sans-medium text-base mb-3">Escudo del equipo</Text>
        <EscudoPicker
          escudo={escudo}
          localPreviewUri={localPreviewUri}
          uploading={uploading}
          onChange={(e, uri) => {
            setEscudo(e);
            setLocalPreviewUri(uri);
          }}
          onUploadingChange={setUploading}
          onError={showError}
        />

        <Text className="text-night font-sans-medium text-base mb-3 mt-4">Datos del equipo</Text>
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
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm"
            placeholder="Teléfono del capitán (opcional)"
            placeholderTextColor="#3D4F44"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />
        </View>

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
              <Feather name="save" size={18} color="white" />
              <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}
