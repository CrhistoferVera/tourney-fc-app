import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  getTournamentEstadisticas,
  TorneoEstadisticas,
  EntradaLiderato,
} from '../../../services/tournamentService';

type Tab = 'global' | 'personal';

function CardIcon({ color }: { readonly color: string }) {
  return (
    <View
      style={{
        width: 10,
        height: 15,
        borderRadius: 2,
        backgroundColor: color,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.2)',
      }}
    />
  );
}

function MetricTile({
  icon,
  value,
  label,
}: {
  readonly icon: React.ReactNode;
  readonly value: string | number;
  readonly label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 6,
      }}
    >
      <View style={{ marginBottom: 6 }}>{icon}</View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#0F1A14',
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: '#3D4F44', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { readonly children: string }) {
  return (
    <Text
      style={{
        fontSize: 14,
        fontWeight: '600',
        color: '#0F1A14',
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function PlayerAvatar({ fotoPerfil }: { readonly fotoPerfil: string | null }) {
  if (fotoPerfil) {
    return (
      <Image
        source={{ uri: fotoPerfil }}
        style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }}
      />
    );
  }
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#D4F5E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      }}
    >
      <Feather name="user" size={15} color="#0D7A3E" />
    </View>
  );
}

function RankBadge({ position }: { readonly position: number }) {
  const bg = position <= 3 ? '#D4F5E2' : '#F0F4F1';
  const color = position <= 3 ? '#0D7A3E' : '#3D4F44';
  const border = position <= 3 ? '#A8E6C3' : 'transparent';
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>
        {position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : `${position}`}
      </Text>
    </View>
  );
}

function LeaderboardCard({
  entries,
  valueSuffix,
}: {
  readonly entries: EntradaLiderato[];
  readonly valueSuffix?: string;
}) {
  if (entries.length === 0) {
    return (
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          marginBottom: 16,
          elevation: 1,
          shadowColor: '#0F1A14',
          shadowOpacity: 0.05,
          shadowRadius: 6,
        }}
      >
        <Text style={{ color: '#3D4F44', fontSize: 13 }}>Sin datos registrados aún.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }}
    >
      {entries.map((entry, idx) => (
        <View
          key={entry.jugadorId + idx}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderBottomWidth: idx < entries.length - 1 ? 1 : 0,
            borderBottomColor: '#EEF2EF',
          }}
        >
          <RankBadge position={entry.posicion} />
          <PlayerAvatar fotoPerfil={entry.fotoPerfil} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F1A14' }} numberOfLines={1}>
              {entry.nombre}
            </Text>
            <Text style={{ fontSize: 11, color: '#3D4F44' }} numberOfLines={1}>
              {entry.equipoNombre}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#D4F5E2',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              minWidth: 36,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0D7A3E' }}>
              {entry.valor}
              {valueSuffix ?? ''}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PersonalStatGrid({
  stats,
}: {
  readonly stats: TorneoEstadisticas['estadisticasPersonales'];
}) {
  if (!stats) return null;

  const items = [
    {
      icon: <MaterialCommunityIcons name="soccer" size={20} color="#0D7A3E" />,
      value: stats.goles,
      label: 'Goles',
    },
    {
      icon: <MaterialCommunityIcons name="shoe-print" size={20} color="#1A73E8" />,
      value: stats.asistencias,
      label: 'Asistencias',
    },
    {
      icon: <CardIcon color="#F5C518" />,
      value: stats.tarjetasAmarillas,
      label: 'Amarillas',
    },
    {
      icon: <CardIcon color="#E53935" />,
      value: stats.tarjetasRojas,
      label: 'Rojas',
    },
    {
      icon: <MaterialCommunityIcons name="close-circle-outline" size={20} color="#9B59B6" />,
      value: stats.penalesFallados,
      label: 'Pen. fallados',
    },
  ];

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item, idx) => (
          <View
            key={item.label}
            style={{
              width: '33.33%',
              borderRightWidth: (idx + 1) % 3 !== 0 ? 1 : 0,
              borderBottomWidth: idx < 3 ? 1 : 0,
              borderColor: '#EEF2EF',
            }}
          >
            <MetricTile icon={item.icon} value={item.value} label={item.label} />
          </View>
        ))}
      </View>
    </View>
  );
}

function PersonalRankings({
  stats,
}: {
  readonly stats: TorneoEstadisticas['estadisticasPersonales'];
}) {
  if (!stats) return null;

  const rows = [
    {
      icon: <MaterialCommunityIcons name="soccer" size={16} color="#0D7A3E" />,
      label: 'Goleador',
      pos: stats.posicionGoles,
    },
    {
      icon: <MaterialCommunityIcons name="shoe-print" size={16} color="#1A73E8" />,
      label: 'Asistente',
      pos: stats.posicionAsistencias,
    },
    {
      icon: <CardIcon color="#F5C518" />,
      label: 'Tarjetas amarillas',
      pos: stats.posicionAmarillas,
    },
    {
      icon: <CardIcon color="#E53935" />,
      label: 'Tarjetas rojas',
      pos: stats.posicionRojas,
    },
    {
      icon: <MaterialCommunityIcons name="close-circle-outline" size={16} color="#9B59B6" />,
      label: 'Penales fallados',
      pos: stats.posicionPenalesFallados,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#0F1A14',
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }}
    >
      {rows.map((row, idx) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
            borderBottomColor: '#EEF2EF',
          }}
        >
          <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>{row.icon}</View>
          <Text style={{ flex: 1, fontSize: 13, color: '#0F1A14', fontWeight: '500' }}>
            {row.label}
          </Text>
          {row.pos !== null ? (
            <View
              style={{
                backgroundColor: '#D4F5E2',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D7A3E' }}>
                #{row.pos}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: '#3D4F44' }}>Sin ranking</Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function EstadisticasScreen() {
  const { id: torneoId, nombre, rol } = useLocalSearchParams<{
    id: string;
    nombre: string;
    rol: string;
  }>();
  const router = useRouter();

  const [data, setData] = useState<TorneoEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('global');

  const showPersonalTab =
    rol === 'CAPITAN' || rol === 'JUGADOR';

  const fetchData = useCallback(async () => {
    if (!torneoId) return;
    try {
      const result = await getTournamentEstadisticas(torneoId);
      setData(result);
    } catch {
      // silently ignore; data stays null
    }
  }, [torneoId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4F1' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#0D7A3E',
          paddingHorizontal: 20,
          paddingTop: 52,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text
          style={{ color: 'white', fontSize: 19, fontWeight: '600', flex: 1 }}
          numberOfLines={1}
        >
          Estadísticas
        </Text>
      </View>

      {/* Tab selector */}
      {showPersonalTab && (
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            marginTop: 14,
            marginBottom: 0,
            backgroundColor: '#E4EBE6',
            borderRadius: 12,
            padding: 3,
          }}
        >
          {(['global', 'personal'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? '#0F1A14' : '#3D4F44',
                }}
              >
                {tab === 'global' ? 'Global' : 'Mi estadística'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D7A3E"
              colors={['#0D7A3E']}
            />
          }
        >
          {/* Nombre del torneo */}
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: '#0F1A14', marginBottom: 14 }}
            numberOfLines={2}
          >
            {nombre ?? 'Torneo'}
          </Text>

          {activeTab === 'global' ? (
            <>
              {/* Resumen global */}
              <SectionTitle>Resumen del torneo</SectionTitle>
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  marginBottom: 16,
                  elevation: 1,
                  shadowColor: '#0F1A14',
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                }}
              >
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEF2EF' }}>
                  <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#EEF2EF' }}>
                    <MetricTile
                      icon={<Feather name="activity" size={18} color="#0D7A3E" />}
                      value={data?.resumen.totalPartidos ?? 0}
                      label="Finalizados"
                    />
                  </View>
                  <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#EEF2EF' }}>
                    <MetricTile
                      icon={<MaterialCommunityIcons name="soccer" size={20} color="#0D7A3E" />}
                      value={data?.resumen.totalGoles ?? 0}
                      label="Goles"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MetricTile
                      icon={
                        <Text style={{ fontSize: 16 }}>⚽</Text>
                      }
                      value={data?.resumen.promedioGolesPorPartido.toFixed(1) ?? '0.0'}
                      label="Goles/partido"
                    />
                  </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#EEF2EF' }}>
                    <MetricTile
                      icon={<CardIcon color="#F5C518" />}
                      value={data?.resumen.totalTarjetasAmarillas ?? 0}
                      label="Amarillas"
                    />
                  </View>
                  <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#EEF2EF' }}>
                    <MetricTile
                      icon={<CardIcon color="#E53935" />}
                      value={data?.resumen.totalTarjetasRojas ?? 0}
                      label="Rojas"
                    />
                  </View>
                </View>
              </View>

              {/* Goleadores */}
              <SectionTitle>⚽ Goleadores</SectionTitle>
              <LeaderboardCard entries={data?.goleadores ?? []} />

              {/* Asistencias */}
              <SectionTitle>🤝 Asistencias</SectionTitle>
              <LeaderboardCard entries={data?.asistentes ?? []} />

              {/* Tarjetas amarillas */}
              <SectionTitle>🟨 Tarjetas amarillas</SectionTitle>
              <LeaderboardCard entries={data?.amarillas ?? []} />

              {/* Tarjetas rojas */}
              <SectionTitle>🟥 Tarjetas rojas</SectionTitle>
              <LeaderboardCard entries={data?.rojas ?? []} />

              {/* Penales fallados */}
              <SectionTitle>❌ Penales fallados</SectionTitle>
              <LeaderboardCard entries={data?.penalesFallados ?? []} />
            </>
          ) : (
            <>
              {/* Pestaña personal */}
              {data?.estadisticasPersonales ? (
                <>
                  <SectionTitle>Mis números</SectionTitle>
                  <PersonalStatGrid stats={data.estadisticasPersonales} />

                  <SectionTitle>Mis posiciones en el torneo</SectionTitle>
                  <PersonalRankings stats={data.estadisticasPersonales} />
                </>
              ) : (
                <View
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 24,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: '#3D4F44', fontSize: 14, textAlign: 'center' }}>
                    No hay estadísticas personales disponibles aún.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
