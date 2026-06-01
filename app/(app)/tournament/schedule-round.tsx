import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFixture, Partido, RondaFixture } from '../../../services/fixtureService';
import { updateMatch } from '../../../services/matchService';
import { getCamposByTournament, CampoDetalle, getTournamentById, Tournament } from '../../../services/tournamentService';
import DatePickerField from '../../../components/create-tournament/DatePickerField';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import { fechaPartidoFromIso, fechaPartidoToIso, formatPartidoFecha, campoHorarioConflicto } from '../../../utils/matchDate';

interface MatchHorario {
  date: string;
  time: string;
  campoId: string | null;
}

function validateTime(t: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

function toDateOnly(iso: string | undefined) {
  if (!iso) return '';
  return iso.split('T')[0];
}

// ── Campo picker modal ────────────────────────────────────────────────────────
interface CampoPickerProps {
  visible: boolean;
  campos: CampoDetalle[];
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function CampoPicker({ visible, campos, selected, onSelect, onClose }: CampoPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: 32,
            maxHeight: '60%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: '#E5E7EB',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#0F1A14',
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            Seleccionar cancha
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {campos.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  onSelect(c.id);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected === c.id ? '#0D7A3E' : '#D1D5DB',
                    backgroundColor: selected === c.id ? '#0D7A3E' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected === c.id && (
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: '#0F1A14', fontWeight: '500' }}>
                    {c.nombre}
                  </Text>
                  {!!c.direccion && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {c.direccion}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginHorizontal: 20,
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EBF0EC',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#3D4F44', fontWeight: '500', fontSize: 14 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ScheduleRoundScreen() {
  const { torneoId, ronda, label, fechaInicio, fechaFin, mode } = useLocalSearchParams<{
    torneoId: string;
    ronda: string;
    label: string;
    fechaInicio: string;
    fechaFin: string;
    mode: string;
  }>();

  const isEdit = mode === 'editar';
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const rondaNum = ronda ? Number.parseInt(ronda, 10) : 1;
  const minDate = toDateOnly(fechaInicio);
  const maxDate = toDateOnly(fechaFin);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [allPartidosTorneo, setAllPartidosTorneo] = useState<Partido[]>([]);
  const [campos, setCampos] = useState<CampoDetalle[]>([]);
  const [torneo, setTorneo] = useState<Tournament | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<Record<string, MatchHorario>>({});
  const [activeDatePicker, setActiveDatePicker] = useState<string | null>(null);
  const [activeCampoPicker, setActiveCampoPicker] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!torneoId) return;
    try {
      const [rondas, camposList, torneoData] = await Promise.all([
        getFixture(torneoId) as Promise<RondaFixture[]>,
        getCamposByTournament(torneoId),
        getTournamentById(torneoId),
      ]);
      const rondaData = rondas.find((r) => r.ronda === rondaNum);
      const ps = rondaData?.partidos ?? [];
      setPartidos(ps);
      setAllPartidosTorneo(rondas.flatMap((r) => r.partidos));
      setCampos(camposList);
      setTorneo(torneoData);

      const init: Record<string, MatchHorario> = {};
      for (const p of ps) {
        if (p.fecha) {
          const { date, time } = fechaPartidoFromIso(p.fecha);
          init[p.id] = {
            date,
            time,
            campoId: p.campo?.id ?? null,
          };
        } else {
          init[p.id] = { date: '', time: '', campoId: p.campo?.id ?? null };
        }
      }
      setHorarios(init);
    } catch {
      showError('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [torneoId, rondaNum]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allFilled = partidos.length > 0 &&
    partidos.every((p) => {
      if (p.estado === 'EN_CURSO' || p.faseJuego === 'FINALIZADO') return true;
      const h = horarios[p.id];
      return h?.date && validateTime(h?.time ?? '');
    });

  const checkLocalConflicts = (): string | null => {
    const isFutbol11 = torneo?.modalidad === 'FUTBOL_11';
    const bufferMs = (isFutbol11 ? 120 : 75) * 60 * 1000;
    const hoursText = isFutbol11 ? '2 horas' : '1 hora y 15 minutos';

    const pendingSchedules = partidos
      .filter((p) => p.estado !== 'EN_CURSO' && p.faseJuego !== 'FINALIZADO')
      .map((p) => {
        const h = horarios[p.id];
        if (!h?.date || !h?.time || !h?.campoId || !validateTime(h.time)) return null;
        try {
          const targetMs = new Date(fechaPartidoToIso(h.date, h.time)).getTime();
          return {
            partidoId: p.id,
            label: `${p.equipoLocal.nombre} vs ${p.equipoVisitante.nombre}`,
            targetMs,
            campoId: h.campoId,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{
      partidoId: string;
      label: string;
      targetMs: number;
      campoId: string;
    }>;

    for (let i = 0; i < pendingSchedules.length; i += 1) {
      const sched = pendingSchedules[i];

      for (let j = i + 1; j < pendingSchedules.length; j += 1) {
        const otherSched = pendingSchedules[j];
        if (otherSched.campoId !== sched.campoId) continue;
        if (
          campoHorarioConflicto(sched.targetMs, {
            fecha: new Date(otherSched.targetMs).toISOString(),
            faseJuego: 'PREVIA',
            estado: 'PENDIENTE',
          }, bufferMs)
        ) {
          return `Conflicto entre "${sched.label}" y "${otherSched.label}": la cancha no está libre con al menos ${hoursText} de separación.`;
        }
      }

      for (const other of allPartidosTorneo) {
        if (other.id === sched.partidoId) continue;
        const otherCampoId = other.campo?.id;
        if (!otherCampoId || otherCampoId !== sched.campoId) continue;
        if (
          campoHorarioConflicto(sched.targetMs, {
            fecha: other.fecha,
            faseJuego: other.faseJuego,
            estado: other.estado,
            finalizadoEn: other.finalizadoEn,
          }, bufferMs)
        ) {
          const otherLabel = `${other.equipoLocal.nombre} vs ${other.equipoVisitante.nombre}`;
          return `Conflicto entre "${sched.label}" y "${otherLabel}": la cancha no está libre con al menos ${hoursText} de separación.`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const localConflict = checkLocalConflicts();
    if (localConflict) {
      showError('Conflicto de canchas', localConflict);
      return;
    }

    setSaving(true);
    try {
      // Guardar secuencialmente para evitar condiciones de carrera en base de datos
      for (const p of partidos) {
        if (p.estado === 'EN_CURSO' || p.faseJuego === 'FINALIZADO') continue;
        const h = horarios[p.id];
        if (!h?.date || !validateTime(h?.time ?? '')) continue;
        const fecha = fechaPartidoToIso(h.date, h.time);
        await updateMatch(p.id, {
          fecha,
          ...(h.campoId ? { campoId: h.campoId } : {}),
        });
      }

      showSuccess(
        'Horarios guardados',
        `Los horarios de ${label} fueron programados correctamente.`,
        () => router.back(),
      );
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudieron guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  const updateHorario = (id: string, patch: Partial<MatchHorario>) =>
    setHorarios((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F5' }}>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Campo picker modal (shared, only one open at a time) */}
      {activeCampoPicker && (
        <CampoPicker
          visible
          campos={campos}
          selected={horarios[activeCampoPicker]?.campoId ?? null}
          onSelect={(id) => updateHorario(activeCampoPicker, { campoId: id })}
          onClose={() => setActiveCampoPicker(null)}
        />
      )}

      {/* Header */}
      <View
        style={{
          backgroundColor: '#0D7A3E',
          paddingHorizontal: 24,
          paddingTop: 56,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
            {isEdit ? 'Editar horarios' : 'Programar horarios'}
          </Text>
          <Text style={{ color: '#A7F3C8', fontSize: 12, marginTop: 2 }}>{label}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0D7A3E" size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: bottom + 100 }}
            showsVerticalScrollIndicator={false}
          >
            {minDate && maxDate && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#EBF5EF',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                }}
              >
                <Feather name="info" size={13} color="#0D7A3E" />
                <Text style={{ fontSize: 12, color: '#0D7A3E', flex: 1 }}>
                  Fechas válidas: {minDate} al {maxDate}
                </Text>
              </View>
            )}

            {partidos.map((partido) => {
              const h = horarios[partido.id] ?? { date: '', time: '', campoId: null };
              const timeOk = !h.time || validateTime(h.time);
              const campoSeleccionado = campos.find((c) => c.id === h.campoId);
              const isNonEditable = partido.estado === 'EN_CURSO' || partido.faseJuego === 'FINALIZADO';

              return (
                <View
                  key={partido.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    elevation: 1,
                    shadowColor: '#0F1A14',
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                  }}
                >
                  {isNonEditable && (
                    <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 }}>
                      <Text style={{ color: '#B91C1C', fontSize: 11, fontWeight: '700' }}>
                        {partido.estado === 'EN_CURSO' ? 'Partido en curso - No editable' : 'Partido finalizado - No editable'}
                      </Text>
                    </View>
                  )}

                  {/* Teams */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#0F1A14',
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {partido.equipoLocal.nombre}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', paddingHorizontal: 10 }}>
                      vs
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#0F1A14',
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {partido.equipoVisitante.nombre}
                    </Text>
                  </View>

                  {/* Date + Time row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <DatePickerField
                        label="Fecha"
                        value={h.date}
                        onChange={(date) => updateHorario(partido.id, { date })}
                        minDate={minDate || undefined}
                        maxDate={maxDate || undefined}
                        visible={activeDatePicker === partido.id}
                        onOpen={() => {
                          if (!isNonEditable) {
                            setActiveDatePicker(partido.id);
                          }
                        }}
                        onClose={() => setActiveDatePicker(null)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: '#3D4F44',
                          fontSize: 14,
                          fontWeight: '500',
                          marginBottom: 4,
                        }}
                      >
                        Hora
                      </Text>
                      <TextInput
                        value={h.time}
                        onChangeText={(text) => updateHorario(partido.id, { time: text })}
                        placeholder="HH:MM"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        editable={!isNonEditable}
                        style={{
                          backgroundColor: isNonEditable ? '#F3F4F6' : 'white',
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderWidth: 1,
                          borderColor: !timeOk ? '#EF4444' : '#EBF0EC',
                          fontSize: 14,
                          color: isNonEditable ? '#9CA3AF' : '#0F1A14',
                        }}
                      />
                      {!timeOk && (
                        <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3 }}>
                          Formato inválido (HH:MM)
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Campo selector */}
                  <View>
                    <Text
                      style={{
                        color: '#3D4F44',
                        fontSize: 14,
                        fontWeight: '500',
                        marginBottom: 4,
                      }}
                    >
                      Cancha
                    </Text>
                    {campos.length === 0 ? (
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                        Este torneo no tiene canchas registradas
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          if (!isNonEditable) {
                            setActiveCampoPicker(partido.id);
                          }
                        }}
                        disabled={isNonEditable}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isNonEditable ? '#F3F4F6' : 'white',
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderWidth: 1,
                          borderColor: '#EBF0EC',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: campoSeleccionado ? '#0F1A14' : '#9CA3AF',
                          }}
                        >
                          {campoSeleccionado ? campoSeleccionado.nombre : 'Seleccionar cancha'}
                        </Text>
                        <Feather name="chevron-down" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Floating save button */}
          <View style={{ position: 'absolute', bottom: bottom + 16, left: 16, right: 16 }}>
            <TouchableOpacity
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: allFilled ? '#0D7A3E' : '#D1D5DB',
                shadowColor: '#000',
                shadowOpacity: allFilled ? 0.18 : 0,
                shadowRadius: 10,
                elevation: allFilled ? 6 : 0,
              }}
              onPress={handleSave}
              disabled={!allFilled || saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Feather name="save" size={18} color={allFilled ? 'white' : '#9CA3AF'} />
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 16,
                      color: allFilled ? 'white' : '#9CA3AF',
                    }}
                  >
                    Guardar horarios
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
