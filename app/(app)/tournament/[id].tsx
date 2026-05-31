import { Feather } from '@expo/vector-icons';
import {
  CalendarDays,
  Trophy,
  Users,
  BarChart2,
  Settings2,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import {
  getTournamentById,
  publishTournament,
  startTournament,
  Tournament,
} from '../../../services/tournamentService';
import { getFixture, Partido } from '../../../services/fixtureService';
import MatchCard from '../../../components/tournament/MatchCard';

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

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  readonly icon: React.ComponentType<{ size: number; color: string }>;
  readonly iconColor: string;
  readonly iconBg: string;
  readonly label: string;
  readonly subtitle: string;
  readonly onPress?: () => void;
  readonly last?: boolean;
}

function NavItem({ icon: Icon, iconColor, iconBg, label, subtitle, onPress, last }: NavItemProps) {
  const disabled = !onPress;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.75}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#EBF0EC',
        opacity: disabled ? 0.38 : 1,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#0F1A14' }}>{label}</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#3D4F44', marginTop: 1 }}>{subtitle}</Text>
      </View>
      {!disabled && <ChevronRight size={18} color="#A8B5AE" />}
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
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [starting,   setStarting]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([
        getTournamentById(id)
          .then(setTournament)
          .catch(() => showError('Error', 'No se pudo cargar el torneo.')),
        getFixture(id)
          .then((rondas) => {
            setPartidos(Array.isArray(rondas) ? rondas.flatMap((r) => r.partidos) : []);
          })
          .catch(() => setPartidos([]))
      ])
        .finally(() => setLoading(false));
    }, [id])
  );

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
        formato: tournament!.formato,
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
      params: {
        id: tournament!.id,
        nombre: tournament!.nombre,
        descripcion: tournament!.descripcion ?? '',
        modalidad: tournament!.modalidad ?? '',
        maxEquipos: String(tournament!.maxEquipos),
        equiposInscritos: String(tournament!.equiposInscritos ?? 0),
        maxJugadoresPorEquipo: String(tournament!.maxJugadoresPorEquipo ?? 0),
        zona: tournament!.zona ?? '',
      },
    } as never);

  const goToMiEquipo = () =>
    router.push({
      pathname: '/(app)/tournament/mi-equipo',
      params: { id: tournament!.id, rol: tournament!.rolUsuario ?? '' },
    } as never);

  const goToTabla = () =>
    router.push({
      pathname: '/(app)/tournament/tabla',
      params: {
        id: tournament!.id,
        nombre: tournament!.nombre,
        rol: tournament!.rolUsuario ?? '',
        formato: tournament!.formato,
        maxEquipos: String(tournament!.maxEquipos),
        estado: tournament!.estado,
      },
    } as never);

  const goToEstadisticas = () =>
    router.push({
      pathname: '/(app)/tournament/estadisticas',
      params: {
        id: tournament!.id,
        nombre: tournament!.nombre,
        rol: tournament!.rolUsuario ?? '',
      },
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
  const isLiga         = tournament.formato === 'LIGA';
  const isBracketFmt   = tournament.formato === 'COPA' || tournament.formato === 'ELIMINATORIA';
  const canVerTabla    = canVerFixture && (isLiga || isBracketFmt);
  const canGestionar   = isOrganizer && (isDraft || isInscripcion);
  const canVerMiEquipo = isCapitan || isJugador;

  // Filtrar partidos en curso (estado EN_CURSO o con fase de juego activa en vivo)
  const partidosEnCurso = partidos
    .filter(
      (p) =>
        p.estado === 'EN_CURSO' ||
        ['PRIMER_TIEMPO', 'MEDIO_TIEMPO', 'SEGUNDO_TIEMPO', 'PENALES'].includes(p.faseJuego)
    )
    .sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateA - dateB;
    });

  // Filtrar últimos resultados (sólo partidos finalizados/esperando confirmación/en disputa)
  const ultimosResultados = partidos
    .filter(
      (p) =>
        p.faseJuego === 'FINALIZADO' ||
        p.estado === 'ESPERANDO_CONFIRMACION' ||
        p.estado === 'EN_DISPUTA'
    )
    .sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return (b.ronda ?? 0) - (a.ronda ?? 0);
    })
    .slice(0, 3);

  // Filtrar próximos partidos (no iniciados y sin marcador, fase PREVIA y no en curso)
  const proximosPartidos = partidos
    .filter(
      (p) =>
        p.faseJuego === 'PREVIA' &&
        p.estado !== 'EN_CURSO' &&
        p.golesLocal === null &&
        p.golesVisitante === null
    )
    .sort((a, b) => {
      if (a.fecha && !b.fecha) return -1;
      if (!a.fecha && b.fecha) return 1;
      if (a.fecha && b.fecha) {
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      }
      return (a.ronda ?? 0) - (b.ronda ?? 0);
    })
    .slice(0, 3);

  const showBannerBorrador         = isDraft && isOrganizer;
  const showBannerEsperando        = isInscripcion && (isOrganizer || isStaff) && !equiposFull;
  const showBannerSolicitudPending = isInscripcion && !tournament.rolUsuario && !!tournament.tieneSolicitudPendiente;
  const showBannerInscribirse      = isInscripcion && !tournament.rolUsuario && !tournament.tieneSolicitudPendiente;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-4 pt-14 pb-4">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 4,
            }}
          >
            <Feather name="arrow-left" size={26} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium flex-1" numberOfLines={1}>
            {tournament.nombre}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 pl-1">
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
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#0F1A14', marginBottom: 10 }}>Acceso rápido</Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 16,
            elevation: 2,
            shadowColor: '#0F1A14',
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <NavItem
            icon={CalendarDays}
            iconColor="#0D7A3E"
            iconBg="#D4F5E2"
            label="Fixture"
            subtitle="Ver el calendario de partidos"
            onPress={canVerFixture ? goToFixture : undefined}
          />
          <NavItem
            icon={Trophy}
            iconColor="#F5820D"
            iconBg="#FEF0DC"
            label={isBracketFmt ? 'Bracket' : 'Tabla de posiciones'}
            subtitle={isBracketFmt ? 'Ver el árbol de eliminación' : 'Clasificación y puntos'}
            onPress={canVerTabla ? goToTabla : undefined}
          />
          <NavItem
            icon={Users}
            iconColor="#1A73E8"
            iconBg="#EAF2FB"
            label="Equipos"
            subtitle="Ver todos los equipos inscritos"
            onPress={canVerFixture ? goToEquipos : undefined}
          />
          {canVerMiEquipo && (
            <NavItem
              icon={Shield}
              iconColor="#9B59B6"
              iconBg="#F5EEF8"
              label="Mi equipo"
              subtitle="Ver la plantilla de mi equipo"
              onPress={goToMiEquipo}
            />
          )}
          {canGestionar && (
            <NavItem
              icon={Settings2}
              iconColor="#3D4F44"
              iconBg="#EBF0EC"
              label="Gestionar torneo"
              subtitle="Administrar staff, equipos y fechas"
              onPress={goToManage}
              last
            />
          )}
          {!canGestionar && (
            <NavItem
              icon={BarChart2}
              iconColor="#3D4F44"
              iconBg="#EBF0EC"
              label="Estadísticas"
              subtitle="Goleadores, tarjetas y más"
              onPress={goToEstadisticas}
              last
            />
          )}
        </View>

        {/* Partidos en curso */}
        {partidosEnCurso.length > 0 && (
          <View className="mb-2">
            <Text className="text-night font-sans-medium text-base mb-3">Partidos en curso</Text>
            {partidosEnCurso.map((partido) => (
              <MatchCard
                key={partido.id}
                partido={partido}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/tournament/match/[id]',
                    params: { id: partido.id },
                  } as any)
                }
              />
            ))}
          </View>
        )}

        {/* Últimos resultados */}
        <Text className="text-night font-sans-medium text-base mb-3">Últimos resultados</Text>
        {ultimosResultados.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center mb-4">
            <Text className="text-carbon text-sm text-center">Aún no hay resultados registrados.</Text>
          </View>
        ) : (
          <View className="mb-1">
            {ultimosResultados.map((partido) => (
              <MatchCard
                key={partido.id}
                partido={partido}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/tournament/match/[id]',
                    params: { id: partido.id },
                  } as any)
                }
              />
            ))}
          </View>
        )}

        {/* Próximos partidos */}
        <Text className="text-night font-sans-medium text-base mb-3 mt-1">Próximos partidos</Text>
        {proximosPartidos.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center">
            <Text className="text-carbon text-sm text-center">No hay partidos próximos programados.</Text>
          </View>
        ) : (
          <View className="mb-1">
            {proximosPartidos.map((partido) => (
              <MatchCard
                key={partido.id}
                partido={partido}
                onPress={() => {
                  if (partido.estado === 'PENDIENTE') {
                    showError('Partido no programado', 'Debes programar primero estos partidos');
                    goToFixture();
                  } else {
                    router.push({
                      pathname: '/(app)/tournament/match/[id]',
                      params: { id: partido.id },
                    } as any);
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
