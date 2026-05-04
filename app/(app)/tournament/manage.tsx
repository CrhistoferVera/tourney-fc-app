import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { updateTournament } from '../../../services/tournamentService';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function ManageScreen() {
  const { id: torneoId, nombre: nombreInicial, descripcion: descInicial,
    fechaInicio: fechaInicioInicial, fechaFin: fechaFinInicial } =
    useLocalSearchParams<{
      id: string; nombre: string; descripcion: string;
      fechaInicio: string; fechaFin: string;
    }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [nombre, setNombre] = useState(nombreInicial ?? '');
  const [descripcion, setDescripcion] = useState(descInicial ?? '');
  const [fechaInicio, setFechaInicio] = useState(fechaInicioInicial?.slice(0, 10) ?? '');
  const [fechaFin, setFechaFin] = useState(fechaFinInicial?.slice(0, 10) ?? '');
  const [staffEmail, setStaffEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      showError('Campo requerido', 'El nombre del torneo es obligatorio');
      return;
    }
    if (!torneoId) return;
    setSaving(true);
    try {
      await updateTournament(torneoId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaInicio,
        fechaFin,
      });
      showSuccess('Torneo actualizado', 'Los cambios fueron guardados exitosamente', () => router.back());
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo actualizar el torneo');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffEmail)) {
      showError('Correo inválido', 'Ingresa un correo electrónico válido');
      return;
    }
    if (!torneoId) return;
    setAddingStaff(true);
    try {
      const token = (await import('../../../store/authStore')).useAuthStore.getState().token;
      const { api } = await import('../../../services/api');
      await api.post(`/tournaments/${torneoId}/staff`, { email: staffEmail }, token ?? undefined);
      setStaffEmail('');
      showSuccess('Staff agregado', 'El staff será notificado al publicar el torneo');
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo agregar el staff');
    } finally {
      setAddingStaff(false);
    }
  };

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Gestionar torneo</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Datos generales */}
        <Text className="text-night font-sans-medium text-base mb-3">Datos generales</Text>

        <View className="bg-white rounded-2xl px-4 py-4 mb-4">
          <Text className="text-carbon text-xs mb-1">Nombre del torneo *</Text>
          <TextInput
            className="text-night text-sm font-sans-medium border-b border-mist pb-2"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del torneo"
            placeholderTextColor="#3D4F44"
          />
          <Text className="text-carbon text-xs mt-4 mb-1">Descripción</Text>
          <TextInput
            className="text-night text-sm"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción opcional"
            placeholderTextColor="#3D4F44"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Fechas */}
        <Text className="text-night font-sans-medium text-base mb-3">Fechas</Text>
        <View className="bg-white rounded-2xl px-4 py-4 mb-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-carbon text-xs mb-1">Fecha inicio</Text>
              <TextInput
                className="bg-mist rounded-xl px-3 py-2 text-night text-sm"
                value={fechaInicio}
                onChangeText={setFechaInicio}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#3D4F44"
              />
            </View>
            <View className="flex-1">
              <Text className="text-carbon text-xs mb-1">Fecha fin</Text>
              <TextInput
                className="bg-mist rounded-xl px-3 py-2 text-night text-sm"
                value={fechaFin}
                onChangeText={setFechaFin}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#3D4F44"
              />
            </View>
          </View>
        </View>

        {/* Staff */}
        <Text className="text-night font-sans-medium text-base mb-3">Agregar staff</Text>
        <View className="bg-white rounded-2xl px-4 py-4 mb-6">
          <Text className="text-carbon text-xs mb-3">
            El staff será notificado por correo cuando el torneo se publique.
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-mist rounded-xl px-4 py-3 text-night text-sm"
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#3D4F44"
              keyboardType="email-address"
              autoCapitalize="none"
              value={staffEmail}
              onChangeText={setStaffEmail}
            />
            <TouchableOpacity
              className="bg-primary rounded-xl px-4 items-center justify-center"
              onPress={handleAddStaff}
              disabled={addingStaff}
            >
              {addingStaff ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Feather name="plus" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Guardar */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}