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
import {
  getInscripciones,
  actualizarEstadoInscripcion,
  Inscripcion,
} from '../../../services/inscriptionService';
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

  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();
  const maxEquipos = maxEquiposParam ? parseInt(maxEquiposParam, 10) : null;

  const [teams, setTeams] = useState<Team[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cantidadJugadores, setCantidadJugadores] = useState('');
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

  const fetchInscripciones = useCallback(async () => {
    if (!torneoId || !isOrganizadorOStaff) return;
    try {
      const data = await getInscripciones(torneoId);
      setInscripciones(Array.isArray(data) ? data.filter((i) => i.estado === 'PENDIENTE') : []);
    } catch {
      setInscripciones([]);
    }
  }, [torneoId, isOrganizadorOStaff]);

  useEffect(() => {
    Promise.all([fetchTeams(), fetchInscripciones()]).finally(() => setLoading(false));
  }, [fetchTeams, fetchInscripciones]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTeams(), fetchInscripciones()]);
    setRefreshing(false);
  }, [fetchTeams, fetchInscripciones]);

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

  const handleAprobar = (inscripcion: Inscripcion) => {
    showConfirm(
      'Aprobar solicitud',
      `¿Aprobar la inscripción de "${inscripcion.equipo.nombre}"?`,
      async () => {
        try {
          await actualizarEstadoInscripcion(inscripcion.id, 'APROBADA');
          setInscripciones((prev) => prev.filter((i) => i.id !== inscripcion.id));
          await fetchTeams();
          showSuccess('Aprobado', `"${inscripcion.equipo.nombre}" fue aprobado.`);
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo aprobar la inscripción');
        }
      },
      'Aprobar',
      'Cancelar',
    );
  };

  const handleRechazar = (inscripcion: Inscripcion) => {
    showConfirm(
      'Rechazar solicitud',
      `¿Rechazar la inscripción de "${inscripcion.equipo.nombre}"?`,
      async () => {
        try {
          await actualizarEstadoInscripcion(inscripcion.id, 'RECHAZADA');
          setInscripciones((prev) => prev.filter((i) => i.id !== inscripcion.id));
          showSuccess('Rechazado', `La solicitud de "${inscripcion.equipo.nombre}" fue rechazada.`);
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo rechazar la inscripción');
        }
      },
      'Rechazar',
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
        <View className="bg-accent-soft border-b border-accent px-4 py-3 flex-row items-center gap-2">
          <Feather name="alert-circle" size={15} color="#F5820D" />
          <Text className="text-accent text-xs flex-1">
            El torneo alcanzó el máximo de {maxEquipos} equipos.
          </Text>
        </View>
      )}

      {isOrganizadorOStaff && maxEquipos !== null && (
        <View
          className={`px-4 py-2 flex-row items-center gap-2 border-b ${cupoLleno ? 'bg-primary-light border-primary' : 'bg-accent-soft border-accent'}`}
        >
          <Feather
            name={cupoLleno ? 'check-circle' : 'users'}
            size={14}
            color={cupoLleno ? '#0D7A3E' : '#F5820D'}
          />
          <Text className={`text-xs flex-1 ${cupoLleno ? 'text-primary' : 'text-accent'}`}>
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
            className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-3"
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
        ) : (
          <>
            {/* Solicitudes pendientes — solo para organizador y staff */}
            {isOrganizadorOStaff && inscripciones.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center mb-3">
                  <Text className="text-night font-sans-medium text-base flex-1">
                    Solicitudes pendientes
                  </Text>
                  <View className="bg-accent-soft px-2 py-0.5 rounded-full">
                    <Text className="text-accent text-xs font-sans-medium">
                      {inscripciones.length}
                    </Text>
                  </View>
                </View>
                {inscripciones.map((insc) => (
                  <View
                    key={insc.id}
                    className="bg-white rounded-2xl px-4 py-3 mb-3 border border-accent-soft"
                    style={{
                      elevation: 1,
                      shadowColor: '#0F1A14',
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                    }}
                  >
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-accent-soft items-center justify-center mr-3">
                        <Feather name="shield" size={18} color="#F5820D" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-night font-sans-medium text-sm">
                          {insc.equipo.nombre}
                        </Text>
                        {insc.equipo.cantidadJugadores ? (
                          <Text className="text-carbon text-xs mt-0.5">
                            {insc.equipo.cantidadJugadores} jugador
                            {insc.equipo.cantidadJugadores !== 1 ? 'es' : ''}
                          </Text>
                        ) : null}
                        {insc.equipo.telefonoCapitan ? (
                          <Text className="text-carbon text-xs">
                            📞 {insc.equipo.telefonoCapitan}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleRechazar(insc)}
                        className="flex-1 border border-danger rounded-xl py-2 items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-danger text-xs font-sans-medium">Rechazar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAprobar(insc)}
                        className="flex-1 bg-primary rounded-xl py-2 items-center"
                        activeOpacity={0.85}
                      >
                        <Text className="text-white text-xs font-sans-medium">Aprobar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Equipos inscritos */}
            {isOrganizadorOStaff && (
              <View className="flex-row items-center mb-3">
                <Text className="text-night font-sans-medium text-base flex-1">
                  Equipos inscritos
                </Text>
                <View className="bg-primary-light px-2 py-0.5 rounded-full">
                  <Text className="text-primary text-xs font-sans-medium">{teams.length}</Text>
                </View>
              </View>
            )}

            {teams.length === 0 ? (
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
          </>
        )}
      </ScrollView>
    </View>
  );
}
