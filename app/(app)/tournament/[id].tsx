import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import {
  getTournamentById,
  publishTournament,
  startTournament,
  Tournament,
} from '../../../services/tournamentService';

// ─── Helpers (module-level, zero complexity cost) ────────────────────────────

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-BO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getEstadoLabel(estado: string) {
  if (estado === 'EN_CURSO') return 'En curso';
  if (estado === 'EN_INSCRIPCION') return 'Inscripción';
  if (estado === 'BORRADOR') return 'Borrador';
  return 'Finalizado';
}

// ─── QuickBtn ─────────────────────────────────────────────────────────────────

interface QuickBtnProps {
  readonly icon: string;
  readonly label: string;
  readonly color: string;
  readonly onPress?: () => void;
}

function QuickBtn({ icon, label, color, onPress }: QuickBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 0.6}
      className={`${color} rounded-2xl items-center justify-center py-4 ${onPress ? '' : 'opacity-40'}`}
      style={{ flex: 1, minHeight: 80 }}
    >
      <Feather name={icon as any} size={24} color="white" />
      <Text className="text-white text-xs font-sans-medium mt-1">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Banners (extracted to avoid inline conditional nesting) ──────────────────

function BannerBorrador({
  publishing,
  onPublish,
}: {
  readonly publishing: boolean;
  readonly onPublish: () => void;
}) {
  return (
    <View className="bg-accent-soft border border-accent rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
      <View className="flex-1 mr-3">
        <Text className="text-accent font-sans-medium text-sm">Torneo en borrador</Text>
        <Text className="text-carbon text-xs mt-0.5">
          Publícalo para que los equipos puedan inscribirse.
        </Text>
      </View>
      <TouchableOpacity
        onPress={onPublish}
        disabled={publishing}
        className="bg-accent rounded-xl px-3 py-2"
        activeOpacity={0.85}
      >
        {publishing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-sans-medium text-xs">Publicar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function BannerEsperando({
  inscritos,
  max,
}: {
  readonly inscritos: number;
  readonly max: number;
}) {
  return (
    <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-4">
      <Text className="text-primary font-sans-medium text-sm">Esperando equipos</Text>
      <Text className="text-carbon text-xs mt-0.5">
        {inscritos} de {max} equipos inscritos.
      </Text>
    </View>
  );
}

function BannerIniciar({
  starting,
  onStart,
}: {
  readonly starting: boolean;
  readonly onStart: () => void;
}) {
  return (
    <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
      <View className="flex-1 mr-3">
        <Text className="text-primary font-sans-medium text-sm">Fixture listo</Text>
        <Text className="text-carbon text-xs mt-0.5">Ya puedes iniciar el torneo oficialmente.</Text>
      </View>
      <TouchableOpacity
        onPress={onStart}
        disabled={starting}
        className="bg-primary rounded-xl px-3 py-2"
        activeOpacity={0.85}
      >
        {starting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-sans-medium text-xs">Iniciar torneo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showConfirm } = useAlert();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [starting,   setStarting]   = useState(false);

  useEffect(() => {
    if (!id) return;
    getTournamentById(id)
      .then(setTournament)
      .catch(() => showError('Error', 'No se pudo cargar el torneo.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const doPublish = async () => {
    setPublishing(true);
    try {
      setTournament(await publishTournament(tournament!.id));
    } catch {
      showError('Error', 'No se pudo publicar el torneo.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = () => {
    showConfirm(
      'Publicar torneo',
      'El torneo pasará a "En inscripción" y será visible para todos.',
      doPublish,
    );
  };

  const doStart = async () => {
    setStarting(true);
    try {
      setTournament(await startTournament(tournament!.id));
    } catch {
      showError('Error', 'No se pudo iniciar el torneo.');
    } finally {
      setStarting(false);
    }
  };

  const handleStart = () => {
    showConfirm(
      'Iniciar torneo',
      'El torneo pasará a "En curso". Ya no se podrán agregar equipos ni modificar la configuración.',
      doStart,
    );
  };

  // ── Navigation helpers (tournament is guaranteed non-null past the guards) ───

  const goToFixture = () =>
    router.push({
      pathname: '/(app)/tournament/fixture',
      params: {
        id: tournament!.id,
        rol: tournament!.rolUsuario ?? '',
        fechaInicio: tournament!.fechaInicio,
        fechaFin: tournament!.fechaFin,
        maxEquipos: String(tournament!.maxEquipos),
        estado: tournament!.estado,
      },
    } as never);

  const goToEquipos = () =>
    router.push({
      pathname: '/(app)/tournament/teams',
      params: {
        id: tournament!.id,
        rol: tournament!.rolUsuario ?? '',
        maxEquipos: String(tournament!.maxEquipos),
        estado: tournament!.estado,
      },
    } as never);

  const goToManage = () =>
    router.push({
      pathname: '/(app)/tournament/manage',
      params: {
        id: tournament!.id,
        nombre: tournament!.nombre,
        descripcion: tournament!.descripcion ?? '',
        fechaInicio: tournament!.fechaInicio,
        fechaFin: tournament!.fechaFin,
        estado: tournament!.estado,
        maxEquipos: String(tournament!.maxEquipos),
        equiposAprobados: String(tournament!.equiposAprobados ?? 0),
      },
    } as never);

  const goToInscribirse = () =>
    router.push({
      pathname: '/(app)/tournament/inscribirse',
      params: { id: tournament!.id },
    } as never);

  const goToMiEquipo = () =>
    router.push({
      pathname: '/(app)/tournament/mi-equipo',
      params: { id: tournament!.id, rol: tournament!.rolUsuario ?? '' },
    } as never);

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View className="flex-1 bg-mist items-center justify-center">
        <ActivityIndicator color="#0D7A3E" size="large" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View className="flex-1 bg-mist items-center justify-center px-8">
        <Text className="text-carbon text-base text-center">No se encontró el torneo.</Text>
      </View>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const isDraft       = tournament.estado === 'BORRADOR';
  const isInscripcion = tournament.estado === 'EN_INSCRIPCION';
  const isOrganizer   = tournament.rolUsuario === 'ORGANIZADOR';
  const isStaff       = tournament.rolUsuario === 'STAFF';
  const isCapitan     = tournament.rolUsuario === 'CAPITAN';
  const isJugador     = tournament.rolUsuario === 'JUGADOR';
  const equiposFull   = (tournament.equiposInscritos ?? 0) >= tournament.maxEquipos;
  const canStart      = isOrganizer && isInscripcion && (tournament.totalPartidos ?? 0) > 0 && equiposFull;

  const canVerFixture  = !isDraft;
  const canGestionar   = isOrganizer && (isDraft || isInscripcion);
  const canVerMiEquipo = isCapitan || isJugador;

  const showBannerBorrador         = isDraft && isOrganizer;
  const showBannerEsperando        = isInscripcion && (isOrganizer || isStaff) && !equiposFull;
  const showBannerSolicitudPending = isInscripcion && !tournament.rolUsuario && !!tournament.tieneSolicitudPendiente;
  const showBannerInscribirse      = isInscripcion && !tournament.rolUsuario && !tournament.tieneSolicitudPendiente;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-white text-base">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
            {tournament.nombre}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 ml-6">
          <View className="bg-primary-dark px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs">{getEstadoLabel(tournament.estado)}</Text>
          </View>
          <Text className="text-primary-light text-xs">
            {FORMAT_LABEL[tournament.formato] ?? tournament.formato} · {tournament.maxEquipos} equipos
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {showBannerBorrador && (
          <BannerBorrador publishing={publishing} onPublish={handlePublish} />
        )}
        {showBannerEsperando && (
          <BannerEsperando inscritos={tournament.equiposInscritos ?? 0} max={tournament.maxEquipos} />
        )}
        {canStart && (
          <BannerIniciar starting={starting} onStart={handleStart} />
        )}
        {showBannerSolicitudPending && (
          <View className="bg-primary-light border border-primary rounded-2xl px-4 py-4 mb-4 flex-row items-center gap-3">
            <Feather name="clock" size={20} color="#0D7A3E" />
            <View className="flex-1">
              <Text className="text-primary font-sans-medium text-sm">Solicitud en revisión</Text>
              <Text className="text-carbon text-xs mt-0.5">
                Tu solicitud está pendiente de aprobación por el organizador.
              </Text>
            </View>
          </View>
        )}
        {showBannerInscribirse && (
          <TouchableOpacity
            onPress={goToInscribirse}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl px-4 py-4 mb-4 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <Text className="text-white font-sans-medium text-sm">¿Quieres participar?</Text>
              <Text className="text-primary-light text-xs mt-0.5">
                Inscribe tu equipo en este torneo.
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-white rounded-xl px-3 py-2">
              <Feather name="user-plus" size={14} color="#0D7A3E" />
              <Text className="text-primary font-sans-medium text-xs">Inscribir mi equipo</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Info card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 mb-4"
          style={{ shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
        >
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-carbon text-xs">Período</Text>
              <Text className="text-night font-sans-medium text-sm">
                {formatDate(tournament.fechaInicio)} – {formatDate(tournament.fechaFin)}
              </Text>
            </View>
            {!!tournament.zona && (
              <View className="items-end">
                <Text className="text-carbon text-xs">Zona</Text>
                <Text className="text-night font-sans-medium text-sm">{tournament.zona}</Text>
              </View>
            )}
          </View>
          {!!tournament.descripcion && (
            <Text className="text-carbon text-sm mt-1">{tournament.descripcion}</Text>
          )}
        </View>

        {/* Acceso rápido */}
        <Text className="text-night font-sans-medium text-base mb-3">Acceso rápido</Text>
        <View className="flex-row gap-2 mb-2">
          <QuickBtn icon="calendar"    label="Fixture"      color="bg-primary"      onPress={canVerFixture ? goToFixture  : undefined} />
          <QuickBtn icon="award"       label="Tabla"        color="bg-accent"       onPress={canVerFixture ? () => {}     : undefined} />
          <QuickBtn icon="users"       label="Equipos"      color="bg-info"         onPress={canVerFixture ? goToEquipos  : undefined} />
        </View>
        <View className="flex-row gap-2 mb-2">
          <QuickBtn icon="bar-chart-2" label="Estadísticas"  color="bg-primary-dark" onPress={canVerFixture ? () => {} : undefined} />
          {canGestionar && (
            <QuickBtn icon="settings" label="Gestionar"     color="bg-carbon"       onPress={goToManage} />
          )}
          <QuickBtn icon="bell"        label="Notificaciones" color="bg-accent"      onPress={() => {}} />
        </View>
        {canVerMiEquipo && (
          <View className="flex-row gap-2 mb-4">
            <QuickBtn icon="shield" label="Mi equipo" color="bg-primary" onPress={goToMiEquipo} />
          </View>
        )}

        {/* Últimos resultados */}
        <Text className="text-night font-sans-medium text-base mb-3">Últimos resultados</Text>
        <View className="bg-white rounded-2xl px-4 py-6 items-center mb-4">
          <Text className="text-carbon text-sm text-center">Aún no hay resultados registrados.</Text>
        </View>

        {/* Próximos partidos */}
        <Text className="text-night font-sans-medium text-base mb-3 mt-1">Próximos partidos</Text>
        <View className="bg-white rounded-2xl px-4 py-6 items-center">
          <Text className="text-carbon text-sm text-center">No hay partidos próximos programados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
