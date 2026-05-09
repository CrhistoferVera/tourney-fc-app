import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import {
  getTournamentById,
  publishTournament,
  Tournament,
  startTournament,
} from '../../../services/tournamentService';

interface MatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  venue: string;
  status: 'Confirmado' | 'Pendiente';
  homeEmoji: string;
  awayEmoji: string;
}

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  status: 'Pendiente';
  homeEmoji: string;
  awayEmoji: string;
}

const FORMAT_LABEL: Record<string, string> = {
  LIGA: 'Liga',
  COPA: 'Copa',
  GRUPOS: 'Grupos',
  ELIMINATORIA: 'Eliminatoria',
};

const { alertState, hideAlert, showError, showConfirm } = useAlert();

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface QuickBtnProps {
  icon: string;
  label: string;
  color: string;
  onPress?: () => void;
}

function QuickBtn({ icon, label, color, onPress }: QuickBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 0.6}
      className={`${color} rounded-2xl items-center justify-center py-4 ${!onPress ? 'opacity-50' : ''}`}
      style={{ flex: 1, minHeight: 80 }}
    >
      <Feather name={icon as any} size={24} color="white" />
      <Text className="text-white text-xs font-sans-medium mt-1">{label}</Text>
    </TouchableOpacity>
  );
}

function ResultCard({ match }: { match: MatchResult }) {
  const isConfirmed = match.status === 'Confirmado';
  return (
    <View
      className="bg-white rounded-2xl px-4 py-3 mb-3"
      style={{ shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
    >
      <View className="flex-row items-center">
        {/* Home */}
        <View className="flex-1 flex-row items-center">
          <Text style={{ fontSize: 28 }}>{match.homeEmoji}</Text>
          <Text className="text-night font-sans-medium text-sm ml-2" numberOfLines={1}>
            {match.homeTeam}
          </Text>
        </View>
        {/* Score */}
        <View className="px-3 items-center">
          <Text className="text-night font-sans-medium text-lg">
            {match.homeScore} - {match.awayScore}
          </Text>
        </View>
        {/* Away */}
        <View className="flex-1 flex-row items-center justify-end">
          <Text className="text-night font-sans-medium text-sm mr-2" numberOfLines={1}>
            {match.awayTeam}
          </Text>
          <View
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: isConfirmed ? '#1A73E8' : '#E53935' }}
          />
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-carbon text-xs">
          {match.date} · {match.venue}
        </Text>
        <View
          className={`px-2 py-0.5 rounded-full ${
            isConfirmed ? 'bg-primary-light' : 'bg-accent-soft'
          }`}
        >
          <Text
            className={`text-xs font-sans-medium ${isConfirmed ? 'text-primary' : 'text-accent'}`}
          >
            {match.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function UpcomingCard({ match }: { match: UpcomingMatch }) {
  return (
    <View
      className="bg-white rounded-2xl px-4 py-3 mb-3"
      style={{ shadowColor: '#0F1A14', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
    >
      <View className="flex-row items-center">
        <Text style={{ fontSize: 24 }}>{match.homeEmoji}</Text>
        <Text className="text-night font-sans-medium text-sm mx-2" numberOfLines={1}>
          {match.homeTeam}
        </Text>
        <Text className="text-carbon text-xs mx-1">vs</Text>
        <Text className="text-night font-sans-medium text-sm mx-2" numberOfLines={1}>
          {match.awayTeam}
        </Text>
        <Text style={{ fontSize: 24 }}>{match.awayEmoji}</Text>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-carbon text-xs">
          {match.date} · {match.venue}
        </Text>
        <View className="bg-accent-soft px-2 py-0.5 rounded-full">
          <Text className="text-accent text-xs font-sans-medium">Pendiente</Text>
        </View>
      </View>
    </View>
  );
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { alertState, hideAlert, showError, showConfirm } = useAlert();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [starting, setStarting] = useState(false);
  const recentResults: MatchResult[] = [];
  const upcomingMatches: UpcomingMatch[] = [];

  useEffect(() => {
    if (!id) return;
    getTournamentById(id)
      .then(setTournament)
      .catch(() => showError('Error', 'No se pudo cargar el torneo.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    if (!tournament) return;

    showConfirm(
      'Publicar torneo',
      '¿Estás seguro? El torneo pasará a estado "En inscripción" y será visible para todos.',
      async () => {
        setPublishing(true);
        try {
          const updated = await publishTournament(tournament.id);
          setTournament(updated);
        } catch {
          showError('Error', 'No se pudo publicar el torneo.');
        } finally {
          setPublishing(false);
        }
      },
      undefined, // o una función onCancel si quieres
    );
  };

  const handleStart = async () => {
    if (!tournament) return;
    showConfirm(
      'Iniciar torneo',
      'El torneo pasará a "En curso". Ya no se podrán agregar equipos ni modificar la configuración.',
      async () => {
        setStarting(true);
        try {
          const updated = await startTournament(tournament.id);
          setTournament(updated);
        } catch {
          showError('Error', 'No se pudo iniciar el torneo.');
        } finally {
          setStarting(false);
        }
      },
    );
  };

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

  const isDraft = tournament.estado === 'BORRADOR';
  const isInscripcion = tournament.estado === 'EN_INSCRIPCION';
  const isOrganizer = tournament.rolUsuario === 'ORGANIZADOR';
  const isStaff = tournament.rolUsuario === 'STAFF';
  const equiposFull = (tournament.equiposInscritos ?? 0) >= tournament.maxEquipos;
  const fixtureGenerado = (tournament.totalPartidos ?? 0) > 0;
  const canGenerateFixture = (isOrganizer || isStaff) && isInscripcion && equiposFull;
  const canStart = isOrganizer && isInscripcion && fixtureGenerado;

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
            <Text className="text-white text-xs">
              {tournament.estado === 'EN_CURSO'
                ? 'Activo'
                : tournament.estado === 'EN_INSCRIPCION'
                  ? 'Inscripción'
                  : tournament.estado === 'BORRADOR'
                    ? 'Borrador'
                    : 'Finalizado'}
            </Text>
          </View>
          <Text className="text-primary-light text-xs">
            {FORMAT_LABEL[tournament.formato] ?? tournament.formato} · {tournament.maxEquipos}{' '}
            equipos
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Publish banner (only for organizer in draft) */}
        {isDraft && isOrganizer ? (
          <View className="bg-accent-soft border border-accent rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-accent font-sans-medium text-sm">Torneo en borrador</Text>
              <Text className="text-carbon text-xs mt-0.5">
                Publícalo para que otros equipos puedan inscribirse.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePublish}
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
        ) : null}

        {isInscripcion && isOrganizer && !equiposFull ? (
          <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-4">
            <Text className="text-primary font-sans-medium text-sm">Esperando equipos</Text>
            <Text className="text-carbon text-xs mt-0.5">
              {tournament.equiposInscritos ?? 0} de {tournament.maxEquipos} equipos inscritos.
              Cuando se llene el cupo podrás generar el fixture.
            </Text>
          </View>
        ) : null}

        {canGenerateFixture && !fixtureGenerado ? (
          <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-primary font-sans-medium text-sm">¡Cupo completo!</Text>
              <Text className="text-carbon text-xs mt-0.5">
                Todos los equipos están inscritos. Ve a Fixture para generarlo.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(app)/tournament/fixture',
                  params: {
                    id: tournament.id,
                    rol: tournament.rolUsuario ?? '',
                    fechaInicio: tournament.fechaInicio,
                    fechaFin: tournament.fechaFin,
                    maxEquipos: String(tournament.maxEquipos),
                  },
                } as never)
              }
              className="bg-primary rounded-xl px-3 py-2"
              activeOpacity={0.85}
            >
              <Text className="text-white font-sans-medium text-xs">Ir a Fixture</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {canStart ? (
          <View className="bg-primary-light border border-primary rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-primary font-sans-medium text-sm">Fixture listo</Text>
              <Text className="text-carbon text-xs mt-0.5">
                Ya puedes iniciar el torneo oficialmente.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleStart}
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
        ) : null}

        {/* Tournament info card */}
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
            {tournament.zona ? (
              <View className="items-end">
                <Text className="text-carbon text-xs">Zona</Text>
                <Text className="text-night font-sans-medium text-sm">{tournament.zona}</Text>
              </View>
            ) : null}
          </View>
          {tournament.descripcion ? (
            <Text className="text-carbon text-sm mt-1">{tournament.descripcion}</Text>
          ) : null}
        </View>

        {/* Acceso rápido */}
        <View className="flex-row gap-2 mb-2">
          <QuickBtn
            icon="calendar"
            label="Fixture"
            color="bg-primary"
            onPress={() =>
              router.push({
                pathname: '/(app)/tournament/fixture',
                params: {
                  id: tournament.id,
                  rol: tournament.rolUsuario ?? '',
                  fechaInicio: tournament.fechaInicio,
                  fechaFin: tournament.fechaFin,
                  maxEquipos: String(tournament.maxEquipos),
                },
              } as never)
            }
          />
          <QuickBtn icon="award" label="Tabla" color="bg-accent" />
          <QuickBtn
            icon="users"
            label="Equipos"
            color="bg-info"
            onPress={() =>
              router.push({
                pathname: '/(app)/tournament/teams',
                params: {
                  id: tournament.id,
                  rol: tournament.rolUsuario ?? '',
                  maxEquipos: String(tournament.maxEquipos),
                },
              } as never)
            }
          />
        </View>
        <View className="flex-row gap-2 mb-4">
          <QuickBtn icon="bar-chart-2" label="Estadísticas" color="bg-primary-dark" />
          <QuickBtn
            icon="settings"
            label="Gestionar"
            color="bg-carbon"
            onPress={
              isOrganizer && !['EN_CURSO', 'FINALIZADO'].includes(tournament.estado)
                ? () =>
                    router.push({
                      pathname: '/(app)/tournament/manage',
                      params: {
                        id: tournament.id,
                        nombre: tournament.nombre,
                        descripcion: tournament.descripcion ?? '',
                        fechaInicio: tournament.fechaInicio,
                        fechaFin: tournament.fechaFin,
                      },
                    } as never)
                : undefined
            }
          />
          <QuickBtn icon="bell" label="Notificaciones" color="bg-accent" />
        </View>

        {/* Últimos resultados */}
        <Text className="text-night font-sans-medium text-base mb-3">Últimos resultados</Text>
        {recentResults.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center mb-4">
            <Text className="text-carbon text-sm text-center">
              Aún no hay resultados registrados.
            </Text>
          </View>
        ) : (
          recentResults.map((m) => <ResultCard key={m.id} match={m} />)
        )}

        {/* Próximos partidos */}
        <Text className="text-night font-sans-medium text-base mb-3 mt-1">Próximos partidos</Text>
        {upcomingMatches.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center">
            <Text className="text-carbon text-sm text-center">
              No hay partidos próximos programados.
            </Text>
          </View>
        ) : (
          upcomingMatches.map((m) => <UpcomingCard key={m.id} match={m} />)
        )}
      </ScrollView>
    </View>
  );
}
