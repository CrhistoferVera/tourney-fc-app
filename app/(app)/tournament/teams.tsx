import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { getTeamsByTournament, createTeam, deleteTeam, Team } from '../../../services/teamsService';
import { useAuthStore } from '../../../store/authStore';
import TeamCard from '../../../components/tournament/TeamCard';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function TeamsScreen() {
  const { id: torneoId, rol } = useLocalSearchParams<{ id: string; rol: string }>();
  const router = useRouter();
  const { usuario } = useAuthStore();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);

  const isOrganizadorOStaff = rol === 'ORGANIZADOR' || rol === 'STAFF';

  const fetchTeams = useCallback(async () => {
    if (!torneoId) return;
    try {
      const data = await getTeamsByTournament(torneoId);
      setTeams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudieron cargar los equipos');
    }
  }, [torneoId]);

  useEffect(() => {
    fetchTeams().finally(() => setLoading(false));
  }, [fetchTeams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  }, [fetchTeams]);

  const handleCreate = async () => {
    if (!nombre.trim()) {
      showError('Campo requerido', 'Ingresa el nombre del equipo');
      return;
    }
    if (!torneoId) return;
    setSaving(true);
    try {
      const team = await createTeam(torneoId, {
        nombre: nombre.trim(),
        telefonoCapitan: telefono.trim() || undefined,
      });
      setTeams((prev) => [...prev, team]);
      setShowForm(false);
      setNombre('');
      setTelefono('');
      showSuccess('Equipo inscrito', 'Tu equipo fue inscrito exitosamente');
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo inscribir el equipo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (teamId: string, teamNombre: string) => {
    showConfirm(
      'Eliminar equipo',
      `¿Eliminar "${teamNombre}" del torneo?`,
      async () => {
        try {
          await deleteTeam(teamId);
          setTeams((prev) => prev.filter((t) => t.id !== teamId));
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo eliminar el equipo');
        }
      },
      'Eliminar',
      'Cancelar',
    );
  };

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Equipos</Text>
        {!isOrganizadorOStaff && (
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Feather name={showForm ? 'x' : 'plus'} size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Formulario inscribir equipo */}
      {showForm && (
        <View className="bg-white px-4 py-4 border-b border-mist">
          <Text className="text-night font-sans-medium text-sm mb-3">Inscribir mi equipo</Text>
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-3"
            placeholder="Nombre del equipo *"
            placeholderTextColor="#3D4F44"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-3"
            placeholder="Teléfono del capitán (opcional)"
            placeholderTextColor="#3D4F44"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center"
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-sans-medium text-sm">Inscribir equipo</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7A3E" colors={['#0D7A3E']} />}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator color="#0D7A3E" size="large" />
          </View>
        ) : teams.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-8 items-center">
            <Feather name="users" size={32} color="#3D4F44" />
            <Text className="text-carbon text-sm text-center mt-3">
              No hay equipos inscritos aún.
            </Text>
          </View>
        ) : (
          teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              canDelete={isOrganizadorOStaff}
              onDelete={(teamId) => handleDelete(teamId, team.nombre)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}