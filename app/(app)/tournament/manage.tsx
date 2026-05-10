import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState,useCallback, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { updateTournament } from '../../../services/tournamentService';
import { userService, User } from '../../../services/userService';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import DatePickerField from '../../../components/create-tournament/DatePickerField';

interface StaffAgregado {
  email: string;
  nombre?: string;
}
export default function ManageScreen() {
  const {
    id: torneoId,
    fechaInicio: fechaInicioInicial,
    fechaFin: fechaFinInicial,
  } = useLocalSearchParams<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
  }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [calendarOpen, setCalendarOpen] = useState<'inicio' | 'fin' | null>(null);
  const [fechaInicio, setFechaInicio] = useState(fechaInicioInicial?.slice(0, 10) ?? '');
  const [fechaFin, setFechaFin] = useState(fechaFinInicial?.slice(0, 10) ?? '');
  const [saving, setSaving] = useState(false);
  const [showStaffInput, setShowStaffInput] = useState(false);
  const [staffQuery, setStaffQuery] = useState('');
  const [staffResults, setStaffResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [staffAgregados, setStaffAgregados] = useState<StaffAgregado[]>([]);
  const [addingStaff, setAddingStaff] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);


  const handleStaffSearch = useCallback((text: string) => {
  setStaffQuery(text);
  if (searchTimeout.current) clearTimeout(searchTimeout.current);
  if (!text.trim() || text.length < 2) {
    setStaffResults([]);
    return;
  }
  searchTimeout.current = setTimeout(async () => {
    setSearching(true);
    try {
      const results = await userService.searchUsers(text.trim());
      console.log("Resultados de búsqueda:", results); 
      setStaffResults(results.filter((u) => !staffAgregados.some((s) => s.email === u.email)));
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setStaffResults([]);
    } finally {
      setSearching(false);
    }
  }, 400);
}, [staffAgregados]);
  const handleSelectUser = (user: User) => {
    if (staffAgregados.some((s) => s.email === user.email)) return;
    setStaffAgregados((prev) => [...prev, { email: user.email, nombre: user.nombre }]);
    setStaffQuery('');
    setStaffResults([]);
  };
  const handleRemoveStaff = (email: string) => {
    setStaffAgregados((prev) => prev.filter((s) => s.email !== email));
  };
  const handleSaveStaff = async () => {
    if (staffAgregados.length === 0) return;
    if (!torneoId) return;
    setAddingStaff(true);
    try {
      const token = (await import('../../../store/authStore')).useAuthStore.getState().token;
      const { api } = await import('../../../services/api');
      // Enviar cada staff al backend
      await Promise.all(
        staffAgregados.map((s) =>
          api.post(`/tournaments/${torneoId}/staff`, { email: s.email }, token ?? undefined),
        ),
      );
      setStaffAgregados([]);
      setShowStaffInput(false);
      showSuccess('Staff guardado', 'El staff será notificado al publicar el torneo');
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo agregar el staff');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleSave = async () => {
    if (!torneoId) return;
    setSaving(true);
    try {
      await updateTournament(torneoId, {
        fechaInicio,
        fechaFin,
      });
      showSuccess('Torneo actualizado', 'Las fechas fueron guardadas exitosamente', () =>
        router.back(),
      );
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo actualizar el torneo');
    } finally {
      setSaving(false);
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
        keyboardShouldPersistTaps="handled">
        {/* Fechas */}
        <Text className="text-night font-sans-medium text-base mb-3">Fechas</Text>
        <View className="bg-white rounded-2xl px-4 py-4 mb-6">
          <View className="flex-row gap-3">
            <DatePickerField
              label="Fecha inicio"
              value={fechaInicio}
              onChange={(v) => setFechaInicio(v)}
              visible={calendarOpen === 'inicio'}
              onOpen={() => setCalendarOpen('inicio')}
              onClose={() => setCalendarOpen(null)}
            />
            <DatePickerField
              label="Fecha fin"
              value={fechaFin}
              onChange={(v) => setFechaFin(v)}
              minDate={fechaInicio || undefined}
              visible={calendarOpen === 'fin'}
              onOpen={() => setCalendarOpen('fin')}
              onClose={() => setCalendarOpen(null)}
            />
          </View>
        </View>
        {/* Guardar fechas */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center mb-8"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
          )}
        </TouchableOpacity>
        {/* Staff */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-night font-sans-medium text-base">Staff</Text>
          <TouchableOpacity
            onPress={() => {
              setShowStaffInput((prev) => !prev);
              setStaffQuery('');
              setStaffResults([]);
            }}
            className="flex-row items-center gap-1 bg-primary rounded-xl px-3 py-2"
            activeOpacity={0.8}
          >
            <Feather name={showStaffInput ? 'x' : 'plus'} size={15} color="white" />
            <Text className="text-white text-xs font-sans-medium">
              {showStaffInput ? 'Cancelar' : 'Agregar'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Input de búsqueda de staff */}
        {showStaffInput && (
          <View className="bg-white rounded-2xl px-4 py-4 mb-3">
            <Text className="text-carbon text-xs mb-3">
              Busca por nombre o correo para agregar staff al torneo.
            </Text>
            {/* Search input */}
            <View className="flex-row items-center bg-mist rounded-xl px-3 py-3 mb-1">
              <Feather name="search" size={15} color="#3D4F44" style={{ marginRight: 8 }} />
              <TextInput
                className="flex-1 text-night text-sm"
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor="#3D4F44"
                autoCapitalize="none"
                keyboardType="email-address"
                value={staffQuery}
                onChangeText={handleStaffSearch}
              />
              {searching && <ActivityIndicator size="small" color="#0D7A3E" />}
              {!searching && staffQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setStaffQuery(''); setStaffResults([]); }}>
                  <Feather name="x" size={15} color="#3D4F44" />
                </TouchableOpacity>
              )}
            </View>
            {/* Resultados de búsqueda */}
            {staffResults.length > 0 && (
              <View className="border border-mist rounded-xl overflow-hidden mt-1">
                {staffResults.map((user, index) => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => handleSelectUser(user)}
                    activeOpacity={0.75}
                    className={`flex-row items-center px-3 py-3 ${
                      index < staffResults.length - 1 ? 'border-b border-mist' : ''
                    }`}
                  >
                    <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-3">
                      <Text className="text-primary text-xs font-sans-medium">
                        {user.nombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-night text-sm font-sans-medium">{user.nombre}</Text>
                      <Text className="text-carbon text-xs">{user.email}</Text>
                    </View>
                    <Feather name="plus-circle" size={18} color="#0D7A3E" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {/* Sin resultados */}
            {staffQuery.length >= 2 && !searching && staffResults.length === 0 && (
              <View className="py-3 items-center">
                <Text className="text-carbon text-xs">No se encontraron usuarios registrados.</Text>
              </View>
            )}
            {/* Staff seleccionados */}
            {staffAgregados.length > 0 && (
              <View className="mt-4">
                <Text className="text-carbon text-xs font-sans-medium mb-2">
                  Por agregar ({staffAgregados.length}):
                </Text>
                {staffAgregados.map((s) => (
                  <View
                    key={s.email}
                    className="flex-row items-center bg-mist rounded-xl px-3 py-2 mb-2"
                  >
                    <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center mr-2">
                      <Text className="text-primary text-xs font-sans-medium">
                        {(s.nombre ?? s.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      {s.nombre && (
                        <Text className="text-night text-xs font-sans-medium">{s.nombre}</Text>
                      )}
                      <Text className="text-carbon text-xs">{s.email}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveStaff(s.email)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={16} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                ))}
                {/* Confirmar agregar staff */}
                <TouchableOpacity
                  className="bg-primary rounded-xl py-3 items-center mt-1"
                  onPress={handleSaveStaff}
                  disabled={addingStaff}
                >
                  {addingStaff ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-sans-medium text-sm">
                      Confirmar staff ({staffAgregados.length})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}