import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFixture, generateFixture, RondaFixture } from '../../../services/fixtureService';
import { confirmAllMatches } from '../../../services/matchService';
import { getTeamsByTournament } from '../../../services/teamsService';
import MatchCard from '../../../components/tournament/MatchCard';
import BracketView from '../../../components/tournament/BracketView';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';

type ScheduleMode = 'programar' | 'editar';

export default function FixtureScreen() {
  const { id: torneoId, rol, maxEquipos: maxEquiposParam, estado, formato, fechaInicio, fechaFin } =
    useLocalSearchParams<{
      id: string;
      rol: string;
      maxEquipos: string;
      estado: string;
      formato: string;
      fechaInicio: string;
      fechaFin: string;
    }>();

  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();
  const maxEquipos = maxEquiposParam ? Number.parseInt(maxEquiposParam, 10) : null;

  const [estadoLocal, setEstadoLocal] = useState(estado ?? '');
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [rondas, setRondas] = useState<RondaFixture[]>([]);
  const [equiposInscritos, setEquiposInscritos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rondaActual, setRondaActual] = useState(0);

  const isBracket = formato === 'COPA' || formato === 'ELIMINATORIA';
  const isOrganizadorOStaff = rol === 'ORGANIZADOR' || rol === 'STAFF';
  const enCursoOFinalizado = estadoLocal === 'EN_CURSO' || estadoLocal === 'FINALIZADO';
  const cupoCompleto = maxEquipos !== null && equiposInscritos >= maxEquipos;
  const puedeGenerar =
    rol === 'ORGANIZADOR'
      ? !enCursoOFinalizado
      : (maxEquipos === null || cupoCompleto) && !enCursoOFinalizado;
  const showFloatingConfirm = isOrganizadorOStaff && !enCursoOFinalizado && rondas.length > 0;

  // Determine the schedule button type for the currently viewed Liga round
  const floatingScheduleBtn = (() => {
    if (isBracket || !isOrganizadorOStaff || !enCursoOFinalizado) return null;
    const current = rondas[rondaActual];
    if (!current) return null;
    const allScheduled = current.partidos.every((p) => p.fecha !== null);
    if (allScheduled) return { mode: 'editar' as ScheduleMode, ronda: current };
    const prev = rondaActual > 0 ? rondas[rondaActual - 1] : null;
    const prevDone = !prev || prev.partidos.every((p) => p.fecha !== null);
    if (prevDone) return { mode: 'programar' as ScheduleMode, ronda: current };
    return null;
  })();

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

  const isFirstLoad = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        Promise.all([fetchFixture(), fetchEquipos()]).finally(() => setLoading(false));
      } else {
        Promise.all([fetchFixture(), fetchEquipos()]);
      }
    }, [fetchFixture, fetchEquipos]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFixture(), fetchEquipos()]);
    setRefreshing(false);
  }, [fetchFixture, fetchEquipos]);

  const handleGenerate = () => {
    if (!puedeGenerar) {
      showError(
        'Equipos insuficientes',
        `Se necesitan ${maxEquipos} equipos para generar el fixture. Actualmente hay ${equiposInscritos} inscrito${equiposInscritos !== 1 ? 's' : ''}.`,
      );
      return;
    }
    showConfirm(
      'Generar fixture',
      rondas.length > 0
        ? 'Esto eliminará el fixture actual y generará uno nuevo. ¿Continuar?'
        : '¿Generar el fixture automáticamente con los equipos inscritos?',
      async () => {
        setGenerating(true);
        try {
          const data = await generateFixture(torneoId);
          setRondas(data);
          setRondaActual(0);
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

  const handleConfirmAll = () => {
    showConfirm(
      'Confirmar todos los partidos',
      'Se confirmarán todos los partidos y el torneo pasará a "En curso". Ya no se podrán agregar ni quitar equipos.',
      async () => {
        setConfirmingAll(true);
        try {
          await confirmAllMatches(torneoId);
          setEstadoLocal('EN_CURSO');
          showSuccess('¡Torneo iniciado!', 'Todos los partidos fueron confirmados.');
          await fetchFixture();
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo confirmar los partidos');
        } finally {
          setConfirmingAll(false);
        }
      },
      'Confirmar todo',
      'Cancelar',
    );
  };

  const goToScheduleRound = (ronda: RondaFixture, mode: ScheduleMode) =>
    router.push({
      pathname: '/(app)/tournament/schedule-round',
      params: {
        torneoId,
        ronda: String(ronda.ronda),
        label: ronda.label,
        fechaInicio: fechaInicio ?? '',
        fechaFin: fechaFin ?? '',
        mode,
      },
    } as never);

  // ── Empty state ───────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View className="bg-white rounded-2xl px-4 py-8 items-center mx-4 mt-4">
      <Feather name="calendar" size={32} color="#3D4F44" />
      <Text className="text-carbon text-sm text-center mt-3">No hay fixture generado aún.</Text>
      {isOrganizadorOStaff && !enCursoOFinalizado && (
        <TouchableOpacity
          className={`rounded-xl px-6 py-3 mt-4 ${puedeGenerar ? 'bg-primary' : 'bg-gray-200'}`}
          onPress={handleGenerate}
          disabled={generating}
        >
          <Text className={`font-sans-medium text-sm ${puedeGenerar ? 'text-white' : 'text-gray-400'}`}>
            {puedeGenerar
              ? 'Generar fixture'
              : `Faltan ${maxEquipos !== null ? maxEquipos - equiposInscritos : '?'} equipos`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Regenerate button ─────────────────────────────────────────────────────
  const renderRegenBtn = (extraClass = '') => (
    <TouchableOpacity
      className={`flex-row items-center justify-center gap-2 bg-white border border-carbon/20 rounded-2xl py-3 ${extraClass}`}
      onPress={handleGenerate}
      disabled={generating}
    >
      {generating ? (
        <ActivityIndicator color="#3D4F44" size="small" />
      ) : (
        <>
          <Feather name="refresh-cw" size={15} color="#3D4F44" />
          <Text className="text-carbon font-sans-medium text-sm">Volver a generar fixture</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const hasFloatingBtn = showFloatingConfirm || floatingScheduleBtn !== null;

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Fixture</Text>
      </View>

      {/* Cupo info bar */}
      {isOrganizadorOStaff && maxEquipos !== null && !enCursoOFinalizado && (
        <View
          className={`px-4 py-2 flex-row items-center gap-2 border-b ${
            cupoCompleto ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <Feather
            name={cupoCompleto ? 'check-circle' : 'alert-circle'}
            size={14}
            color={cupoCompleto ? '#16A34A' : '#D97706'}
          />
          <Text className={`text-xs flex-1 ${cupoCompleto ? 'text-green-700' : 'text-amber-700'}`}>
            {cupoCompleto
              ? `Cupo completo (${equiposInscritos}/${maxEquipos}). Puedes generar el fixture.`
              : `Equipos inscritos: ${equiposInscritos}/${maxEquipos}. Faltan ${maxEquipos - equiposInscritos} para poder generar el fixture.`}
          </Text>
        </View>
      )}

      {/* Liga: round navigation bar */}
      {!isBracket && !loading && rondas.length > 1 && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-mist">
          <TouchableOpacity
            onPress={() => setRondaActual((r) => Math.max(0, r - 1))}
            disabled={rondaActual === 0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={22} color={rondaActual === 0 ? '#CBD5CB' : '#0F1A14'} />
          </TouchableOpacity>
          <Text className="text-night font-sans-medium text-sm">
            {rondas[rondaActual]?.label}
            {'  '}
            <Text className="text-carbon font-sans text-xs">
              {rondaActual + 1} / {rondas.length}
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => setRondaActual((r) => Math.min(rondas.length - 1, r + 1))}
            disabled={rondaActual === rondas.length - 1}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="chevron-right"
              size={22}
              color={rondaActual === rondas.length - 1 ? '#CBD5CB' : '#0F1A14'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Main content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : isBracket ? (
        rondas.length === 0 ? (
          renderEmpty()
        ) : (
          <View className="flex-1">
            {isOrganizadorOStaff && !enCursoOFinalizado && (
              <View className="mx-4 mt-4">{renderRegenBtn()}</View>
            )}
            <View className="flex-1 mt-4">
              <BracketView
                rondas={rondas}
                maxEquipos={maxEquipos ?? 8}
                isOrganizador={isOrganizadorOStaff}
                estadoTorneo={estadoLocal}
                onScheduleRound={(rondaNum, label, mode) => {
                  const r = rondas.find((x) => x.ronda === rondaNum);
                  goToScheduleRound(
                    r ?? { ronda: rondaNum, label, partidos: [] },
                    mode,
                  );
                }}
              />
            </View>
          </View>
        )
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: hasFloatingBtn ? bottom + 88 : 32,
          }}
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
          {rondas.length === 0 ? (
            renderEmpty()
          ) : (
            <>
              {isOrganizadorOStaff && !enCursoOFinalizado && (
                <View className="mb-4">{renderRegenBtn()}</View>
              )}
              {rondas[rondaActual]?.partidos.map((partido) => (
                <MatchCard key={partido.id} partido={partido} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Floating confirm button */}
      {showFloatingConfirm && (
        <View style={{ position: 'absolute', bottom: bottom + 16, left: 16, right: 16 }}>
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 6 }}
            onPress={handleConfirmAll}
            disabled={confirmingAll}
          >
            {confirmingAll ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="white" />
                <Text className="text-white font-sans-medium text-base">Confirmar fixture</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating schedule/edit button — tracks the currently viewed round */}
      {floatingScheduleBtn && (
        <View style={{ position: 'absolute', bottom: bottom + 16, left: 16, right: 16 }}>
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 6 }}
            onPress={() => goToScheduleRound(floatingScheduleBtn.ronda, floatingScheduleBtn.mode)}
          >
            <Feather
              name={floatingScheduleBtn.mode === 'editar' ? 'edit-2' : 'clock'}
              size={18}
              color="white"
            />
            <Text className="text-white font-sans-medium text-base">
              {floatingScheduleBtn.mode === 'editar'
                ? `Editar Horarios ${floatingScheduleBtn.ronda.label}`
                : `Programar ${floatingScheduleBtn.ronda.label}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
