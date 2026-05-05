import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { getFixture, generateFixture, RondaFixture, Partido } from '../../../services/fixtureService';
import { updateMatch, confirmMatch } from '../../../services/matchService';
import { getTeamsByTournament } from '../../../services/teamsService';
import MatchCard from '../../../components/tournament/MatchCard';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

export default function FixtureScreen() {
  const { id: torneoId, rol, fechaInicio, fechaFin, maxEquipos: maxEquiposParam } =
    useLocalSearchParams<{
      id: string;
      rol: string;
      fechaInicio: string;
      fechaFin: string;
      maxEquipos: string;
    }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();
  const maxEquipos = maxEquiposParam ? parseInt(maxEquiposParam, 10) : null;

  const [rondas, setRondas] = useState<RondaFixture[]>([]);
  const [equiposInscritos, setEquiposInscritos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedPartido, setSelectedPartido] = useState<Partido | null>(null);
  const [editFecha, setEditFecha] = useState('');
  const [saving, setSaving] = useState(false);

  const isOrganizadorOStaff = rol === 'ORGANIZADOR' || rol === 'STAFF';
  const isCapitan = rol === 'CAPITAN';
  const canEdit = isOrganizadorOStaff || isCapitan;
  const cupoCompleto = maxEquipos !== null && equiposInscritos >= maxEquipos;
  const puedeGenerar = maxEquipos === null || cupoCompleto;

  const fetchFixture = useCallback(async () => {
    if (!torneoId) return;
    try {
      const data = await getFixture(torneoId);
      setRondas(Array.isArray(data) ? data : []);
    } catch {
      setRondas([]);
    }
  }, [torneoId]);
  const fetchEquipos = useCallback(async () => {
    if (!torneoId) return;
    try {
      const teams = await getTeamsByTournament(torneoId);
      setEquiposInscritos(Array.isArray(teams) ? teams.length : 0);
    } catch {
      setEquiposInscritos(0);
    }
  }, [torneoId]);

  useEffect(() => {
    Promise.all([fetchFixture(), fetchEquipos()]).finally(() => setLoading(false));
  }, [fetchFixture, fetchEquipos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFixture(), fetchEquipos()]);
    setRefreshing(false);
  }, [fetchFixture, fetchEquipos]);

  const handleGenerate = () => {
    if (!puedeGenerar) {
      showError('Equipos insuficientes',`Se necesitan ${maxEquipos} equipos para generar el fixture. Actualmente hay ${equiposInscritos} inscrito${equiposInscritos !== 1 ? 's' : ''}.`,);
      return;}
    showConfirm(
      'Generar fixture',
      rondas.length > 0
        ? 'Esto eliminará el fixture actual y generará uno nuevo. ¿Continuar?'
        : '¿Generar el fixture automáticamente con los equipos inscritos?',
      async () => {
        setGenerating(true);
        try {
          const data = await generateFixture(torneoId!);
          setRondas(data);
          showSuccess('Fixture generado', 'El fixture fue generado exitosamente');
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo generar el fixture');
        } finally {
          setGenerating(false);
        }
      },
      'Generar',
      'Cancelar',
    );
  };

  const handleEditPartido = (partido: Partido) => {
    if (!canEdit) return;
    setSelectedPartido(partido);
    setEditFecha(partido.fecha ? new Date(partido.fecha).toISOString().slice(0, 16) : '');
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPartido) return;
    setSaving(true);
    try {
      await updateMatch(selectedPartido.id, {
        fecha: editFecha ? new Date(editFecha).toISOString() : undefined,
      });
      setEditModal(false);
      await fetchFixture();
      showSuccess('Partido actualizado', 'Los cambios fueron guardados');
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo actualizar el partido');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = (partido: Partido) => {
    showConfirm(
      'Confirmar partido',
      `¿Confirmar el partido ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}?`,
      async () => {
        try {
          await confirmMatch(partido.id);
          await fetchFixture();
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo confirmar el partido');
        }
      },
      'Confirmar',
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
        <Text className="text-white text-xl font-sans-medium flex-1">Fixture</Text>
        {isOrganizadorOStaff && (
          <TouchableOpacity onPress={handleGenerate} disabled={generating}>
            {generating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Feather name="refresh-cw" size={20} color={puedeGenerar ? 'white' : 'rgba(255,255,255,0.35)'} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {isOrganizadorOStaff && maxEquipos !== null && (
        <View className={`px-4 py-2 flex-row items-center gap-2 border-b ${cupoCompleto ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <Feather name={cupoCompleto ? 'check-circle' : 'alert-circle'} size={14} color={cupoCompleto ? '#16A34A' : '#D97706'} />
          <Text className={`text-xs flex-1 ${cupoCompleto ? 'text-green-700' : 'text-amber-700'}`}>
            {cupoCompleto
              ? `Cupo completo (${equiposInscritos}/${maxEquipos}). Puedes generar el fixture.`
              : `Equipos inscritos: ${equiposInscritos}/${maxEquipos}. Faltan ${maxEquipos - equiposInscritos} para poder generar el fixture.`}
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7A3E" colors={['#0D7A3E']} />}
      >
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#0D7A3E" size="large" />
          </View>
        ) : rondas.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-8 items-center">
            <Feather name="calendar" size={32} color="#3D4F44" />
            <Text className="text-carbon text-sm text-center mt-3">
              No hay fixture generado aún.
            </Text>
            {isOrganizadorOStaff && (
              <TouchableOpacity className={`rounded-xl px-6 py-3 mt-4 ${puedeGenerar ? 'bg-primary' : 'bg-gray-200'}`} onPress={handleGenerate} disabled={generating}>
                <Text className={`font-sans-medium text-sm ${puedeGenerar ? 'text-white' : 'text-gray-400'}`}>
                  {puedeGenerar
                    ? 'Generar fixture'
                    : `Faltan ${maxEquipos !== null ? maxEquipos - equiposInscritos : '?'} equipos`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          rondas.map((ronda) => (
            <View key={ronda.ronda} className="mb-4">
              <Text className="text-night font-sans-medium text-base mb-2">{ronda.label}</Text>
              {ronda.partidos.map((partido) => (
                <View key={partido.id}>
                  <MatchCard
                    partido={partido}
                    canEdit={canEdit && partido.estado === 'PENDIENTE'}
                    onPress={canEdit ? handleEditPartido : undefined}
                  />
                  {isOrganizadorOStaff && partido.estado === 'PENDIENTE' && (
                    <TouchableOpacity
                      className="bg-primary-light rounded-xl py-2 items-center mb-3 -mt-1"
                      onPress={() => handleConfirm(partido)}
                    >
                      <Text className="text-primary text-xs font-sans-medium">Confirmar partido</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal editar fecha */}
      <Modal visible={editModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 py-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-night font-sans-medium text-base">Editar partido</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={20} color="#3D4F44" />
              </TouchableOpacity>
            </View>

            {selectedPartido && (
              <Text className="text-carbon text-sm mb-4">
                {selectedPartido.equipoLocal.nombre} vs {selectedPartido.equipoVisitante.nombre}
              </Text>
            )}

            <Text className="text-night text-sm font-sans-medium mb-2">Fecha y hora</Text>
            <TextInput
              className="bg-mist rounded-xl px-4 py-3 text-night text-sm mb-4"
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#3D4F44"
              value={editFecha}
              onChangeText={setEditFecha}
            />

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={handleSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}