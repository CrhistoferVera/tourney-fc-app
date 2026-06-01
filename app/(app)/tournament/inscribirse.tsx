import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Info, MapPin, Users, Zap, Shield } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import RosterSelector from '../../../components/team/RosterSelector';
import ShieldDisplay from '../../../components/tournament/ShieldDisplay';
import { useAlert } from '../../../hooks/useAlert';
import { useAuthStore } from '../../../store/authStore';
import { solicitarInscripcion } from '../../../services/inscriptionService';
import {
  getMyTeams,
  getTeamById,
  MyTeam,
  MyTeamSummary,
} from '../../../services/teamsService';
import { getTournamentById } from '../../../services/tournamentService';

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
  const { usuario } = useAuthStore();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [fetchedTournament, setFetchedTournament] = useState<any>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);

  const [myTeams, setMyTeams] = useState<MyTeamSummary[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<MyTeam | null>(null);
  const [loadingTeamDetail, setLoadingTeamDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Cargar torneo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!torneoId) return;
    if (torneoNombre && torneoModalidad && maxJugadoresPorEquipo) {
      setLoadingTournament(false);
      return;
    }
    getTournamentById(torneoId)
      .then(setFetchedTournament)
      .catch((e) => console.error('Error cargando torneo en inscribirse:', e))
      .finally(() => setLoadingTournament(false));
  }, [torneoId, torneoNombre, torneoModalidad, maxJugadoresPorEquipo]);

  // ── Cargar mis equipos (solo donde soy capitán) ────────────────────────────
  useEffect(() => {
    getMyTeams()
      .then((teams) =>
        setMyTeams(
          teams.filter((t) => t.esCapitan || t.capitanId === usuario?.id),
        ),
      )
      .catch((e: any) => showError('Error', e.message ?? 'No se pudieron cargar tus equipos.'))
      .finally(() => setLoadingTeams(false));
  }, []);

  // ── Derived info del torneo ────────────────────────────────────────────────
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

  // ── Al seleccionar equipo, cargar detalle ──────────────────────────────────
  useEffect(() => {
    if (!selectedTeamId) {
      setSelectedTeam(null);
      setSelectedIds([]);
      return;
    }
    setLoadingTeamDetail(true);
    getTeamById(selectedTeamId)
      .then((team) => {
        setSelectedTeam(team);
        // Pre-marcar capitán + el resto hasta llenar (o todo si entra en el max)
        const allIds = team.jugadores.map((r) => r.usuario.id);
        const capId = team.capitanId;
        const others = allIds.filter((x) => x !== capId);
        const preSelected = capId ? [capId, ...others] : others;
        setSelectedIds(preSelected.slice(0, jugadoresMax));
      })
      .catch((e: any) => showError('Error', e.message ?? 'No se pudo cargar el equipo.'))
      .finally(() => setLoadingTeamDetail(false));
  }, [selectedTeamId, jugadoresMax]);

  const jugadoresForSelector = useMemo(
    () => (selectedTeam?.jugadores ?? []).map((row) => row.usuario),
    [selectedTeam?.jugadores],
  );

  const goToCreateTeam = () => {
    router.push({
      pathname: '/team/create',
      params: {
        returnTo: '/tournament/inscribirse',
        returnParams: JSON.stringify({
          id: torneoId ?? '',
          nombre: torneoNombre ?? '',
          descripcion: torneoDescripcion ?? '',
          modalidad: torneoModalidad ?? '',
          maxEquipos: maxEquipos ?? '',
          equiposInscritos: equiposInscritos ?? '',
          maxJugadoresPorEquipo: maxJugadoresPorEquipo ?? '',
          zona: zona ?? '',
        }),
      },
    } as never);
  };

  const handleSubmit = async () => {
    if (!torneoId || !selectedTeamId) {
      showError('Selecciona un equipo', 'Elige uno de tus equipos para inscribir.');
      return;
    }
    if (selectedIds.length < jugadoresMin) {
      showError(
        'Faltan jugadores',
        `Debes seleccionar al menos ${jugadoresMin} jugadores para esta modalidad.`,
      );
      return;
    }
    if (selectedIds.length > jugadoresMax) {
      showError('Demasiados jugadores', `El máximo permitido es ${jugadoresMax}.`);
      return;
    }
    setSaving(true);
    try {
      await solicitarInscripcion(torneoId, selectedTeamId, selectedIds);
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

  const renderTorneoCard = () => {
    if (!finalNombre) return null;
    return (
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ backgroundColor: '#D4F5E2', borderRadius: 8, padding: 6 }}>
            <Info size={14} color="#0D7A3E" />
          </View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#0F1A14', flex: 1 }}>
            {finalNombre}
          </Text>
        </View>

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

        <View style={{ height: 1, backgroundColor: '#EBF0EC', marginBottom: 10 }} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
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
    );
  };

  const renderEmptyTeams = () => (
    <View
      className="bg-white rounded-2xl px-6 py-8 items-center"
      style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6 }}
    >
      <View className="w-14 h-14 rounded-full bg-primary-light items-center justify-center mb-3">
        <Feather name="shield" size={24} color="#0D7A3E" />
      </View>
      <Text className="text-night font-sans-medium text-base text-center mb-1">
        No tienes equipos
      </Text>
      <Text className="text-carbon text-sm text-center mb-5">
        Crea un equipo primero para poder inscribirte a este torneo.
      </Text>
      <TouchableOpacity
        onPress={goToCreateTeam}
        activeOpacity={0.85}
        className="bg-primary rounded-xl px-5 py-3 flex-row items-center gap-2"
      >
        <Feather name="plus" size={16} color="white" />
        <Text className="text-white font-sans-medium text-sm">Crear equipo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTeamSelector = () => (
    <View>
      <Text className="text-night font-sans-medium text-base mb-3">Selecciona tu equipo</Text>
      {myTeams.map((t) => {
        const selected = selectedTeamId === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => setSelectedTeamId(t.id)}
            activeOpacity={0.85}
            className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center"
            style={{
              borderWidth: 2,
              borderColor: selected ? '#0D7A3E' : 'transparent',
              elevation: 1,
              shadowColor: '#0F1A14',
              shadowOpacity: 0.04,
              shadowRadius: 4,
            }}
          >
            <ShieldDisplay escudo={t.escudo} size={42} />
            <View className="flex-1 ml-3">
              <Text className="text-night font-sans-medium text-sm" numberOfLines={1}>
                {t.nombre}
              </Text>
              <Text className="text-carbon text-xs">
                {t.cantidadJugadores} jugador{t.cantidadJugadores === 1 ? '' : 'es'}
              </Text>
            </View>
            <View
              style={{
                width: 22, height: 22, borderRadius: 11,
                borderWidth: 2,
                borderColor: selected ? '#0D7A3E' : '#A8B5AE',
                backgroundColor: selected ? '#0D7A3E' : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {selected && <Feather name="check" size={12} color="white" />}
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={goToCreateTeam}
        activeOpacity={0.7}
        className="mt-2 py-2 flex-row items-center justify-center gap-1"
      >
        <Feather name="plus" size={14} color="#0D7A3E" />
        <Text className="text-primary text-xs font-sans-medium">Crear otro equipo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRoster = () => {
    if (!selectedTeamId) return null;
    if (loadingTeamDetail) {
      return (
        <View className="py-6 items-center">
          <ActivityIndicator color="#0D7A3E" />
        </View>
      );
    }
    if (!selectedTeam) return null;
    return (
      <View className="mt-6">
        <Text className="text-night font-sans-medium text-base mb-3">
          Jugadores que participarán
        </Text>
        <RosterSelector
          jugadores={jugadoresForSelector}
          capitanId={selectedTeam.capitanId}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          min={jugadoresMin}
          max={jugadoresMax}
          onLockedToggle={() =>
            showError('Capitán bloqueado', 'El capitán siempre va en el roster del torneo.')
          }
        />
      </View>
    );
  };

  if (loadingTournament || loadingTeams) {
    return (
      <View className="flex-1 bg-mist">
        <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1">Inscribir equipo</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      </View>
    );
  }

  const canSubmit =
    !!selectedTeamId &&
    selectedIds.length >= jugadoresMin &&
    selectedIds.length <= jugadoresMax &&
    !saving;

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

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
        {renderTorneoCard()}

        {myTeams.length === 0 ? renderEmptyTeams() : renderTeamSelector()}

        {renderRoster()}

        {myTeams.length > 0 && (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-2 mt-6"
            style={{ opacity: canSubmit ? 1 : 0.5 }}
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
        )}
      </ScrollView>
    </View>
  );
}
