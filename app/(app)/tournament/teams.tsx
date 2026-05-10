import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { getTeamsByTournament, createTeam, deleteTeam, Team } from '../../../services/teamsService';
import { useAuthStore } from '../../../store/authStore';
import TeamCard from '../../../components/tournament/TeamCard';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function TeamsScreen() {
  const {
    id: torneoId,
    rol,
    maxEquipos: maxEquiposParam,
    estado,
  } = useLocalSearchParams<{ id: string; rol: string; maxEquipos: string; estado: string }>();
  console.log('ROL:', rol, 'ESTADO:', estado, 'MAX:', maxEquiposParam);

  const router = useRouter();
  const { usuario } = useAuthStore();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();
  const maxEquipos = maxEquiposParam ? parseInt(maxEquiposParam, 10) : null;
  const [cantidadJugadores, setCantidadJugadores] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);

  const enCursoOFinalizado = estado === 'EN_CURSO' || estado === 'FINALIZADO';
  const isOrganizadorOStaff = rol === 'ORGANIZADOR' || rol === 'STAFF';
  const puedeEliminar = isOrganizadorOStaff && !enCursoOFinalizado;
  const cupoLleno = maxEquipos !== null && teams.length >= maxEquipos;

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
    if (cupoLleno) {
      showError('Cupo lleno', `El torneo ya tiene el máximo de ${maxEquipos} equipos inscritos`);
      return;
    }
    const jugadoresNum = cantidadJugadores.trim() ? parseInt(cantidadJugadores, 10) : undefined;
    if (cantidadJugadores.trim() && (isNaN(jugadoresNum!) || jugadoresNum! < 1)) {
      showError('Cantidad inválida', 'Ingresa un número de jugadores válido');
      return;
    }
    if (!torneoId) return;
    setSaving(true);
    try {
      const team = await createTeam(torneoId, {
        nombre: nombre.trim(),
        telefonoCapitan: telefono.trim() || undefined,
        cantidadJugadores: jugadoresNum,
      });
      setTeams((prev) => [...prev, team]);
      setShowForm(false);
      setNombre('');
      setTelefono('');
      setCantidadJugadores('');
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
        <Text className="text-white text-xl font-sans-medium flex-1">
          Equipos{maxEquipos ? ` (${teams.length}/${maxEquipos})` : ''}
        </Text>
        {!isOrganizadorOStaff && !cupoLleno && !enCursoOFinalizado && (
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Feather name={showForm ? 'x' : 'plus'} size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>
      {cupoLleno && !isOrganizadorOStaff && (
        <View className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex-row items-center gap-2">
          <Feather name="alert-circle" size={15} color="#D97706" />
          <Text className="text-amber-700 text-xs flex-1">
            El torneo alcanzó el máximo de {maxEquipos} equipos. No se aceptan más inscripciones.
          </Text>
        </View>
      )}
      {isOrganizadorOStaff && maxEquipos !== null && (
        <View
          className={`px-4 py-2 flex-row items-center gap-2 border-b ${
            cupoLleno ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <Feather
            name={cupoLleno ? 'check-circle' : 'users'}
            size={14}
            color={cupoLleno ? '#16A34A' : '#D97706'}
          />
          <Text className={`text-xs flex-1 ${cupoLleno ? 'text-green-700' : 'text-amber-700'}`}>
            {cupoLleno
              ? `Cupo completo: ${teams.length}/${maxEquipos} equipos inscritos.`
              : `${teams.length}/${maxEquipos} equipos. Faltan ${maxEquipos - teams.length} para completar el cupo.`}
          </Text>
        </View>
      )}

      {/* Formulario inscribir equipo */}
      {showForm && !cupoLleno && !enCursoOFinalizado && (
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
          <TextInput
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-1"
            placeholder="Cantidad de jugadores"
            placeholderTextColor="#3D4F44"
            keyboardType="number-pad"
            value={cantidadJugadores}
            onChangeText={setCantidadJugadores}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D7A3E"
            colors={['#0D7A3E']}
          />
        }
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
              canDelete={puedeEliminar}
              onDelete={(teamId) => handleDelete(teamId, team.nombre)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
