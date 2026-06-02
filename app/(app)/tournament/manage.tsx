import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { MinusCircle, PlusCircle, Users, Settings2, UserCheck, ClipboardList, MapPin } from 'lucide-react-native';
import { updateTournament, startTournament, getCamposByTournament, CampoDetalle, addCampoToTournament } from '../../../services/tournamentService';
import { getFixture } from '../../../services/fixtureService';
import { toDateOnlyString } from '../../../utils/matchDate';
import { userService, User } from '../../../services/userService';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import CustomAlert from '../../../components/CustomAlert';
import { useAlert } from '../../../hooks/useAlert';
import DatePickerField from '../../../components/create-tournament/DatePickerField';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StaffPendiente { id: string; email: string; estado: 'PENDIENTE' }
interface StaffAceptado  { id: string; nombre: string; email: string; fotoPerfil: string | null; estado: 'ACEPTADO' }
interface StaffAgregado  { email: string; nombre?: string }

interface Jugador    { id: string; nombre: string; email: string; fotoPerfil: string | null }
interface Equipo     { id: string; nombre: string; escudo: string | null; telefonoCapitan: string | null; cantidadJugadores: number; jugadores: Jugador[] }
interface Inscripcion { id: string; estado: string; createdAt: string; equipo: Equipo }

// ─── Tab Staff ────────────────────────────────────────────────────────────────

function TabStaff({ torneoId }: { readonly torneoId: string }) {
  const token = useAuthStore.getState().token ?? undefined;
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [staffPendientes, setStaffPendientes] = useState<StaffPendiente[]>([]);
  const [staffAceptados,  setStaffAceptados]  = useState<StaffAceptado[]>([]);
  const [loadingStaff,    setLoadingStaff]    = useState(true);
  const [showInput,       setShowInput]       = useState(false);
  const [staffQuery,      setStaffQuery]      = useState('');
  const [staffResults,    setStaffResults]    = useState<User[]>([]);
  const [searching,       setSearching]       = useState(false);
  const [staffAgregados,  setStaffAgregados]  = useState<StaffAgregado[]>([]);
  const [addingStaff,     setAddingStaff]     = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalStaff = staffPendientes.length + staffAceptados.length;

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const data = await api.get(`/tournaments/${torneoId}/staff`, token);
      setStaffPendientes(data.pendientes ?? []);
      setStaffAceptados(data.aceptados ?? []);
    } catch { /* silencioso */ }
    finally { setLoadingStaff(false); }
  }, [torneoId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleSearch = useCallback((text: string) => {
    setStaffQuery(text);
    setStaffResults([]);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim() || text.length < 2) return;
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const yaExisten = new Set([
          ...staffAgregados.map((s) => s.email),
          ...staffPendientes.map((s) => s.email),
          ...staffAceptados.map((s) => s.email),
        ]);
        const results = await userService.searchUsers(text.trim());
        setStaffResults(results.filter((u) => !yaExisten.has(u.email)));
      } catch { setStaffResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [staffAgregados, staffPendientes, staffAceptados]);

  const handleSelectUser = (user: User) => {
    setStaffAgregados((prev) => [...prev, { email: user.email, nombre: user.nombre }]);
    setStaffQuery('');
    setStaffResults([]);
  };

  const handleRemoveAgregado = useCallback((email: string) => {
    setStaffAgregados((prev) => prev.filter((x) => x.email !== email));
  }, []);

  const handleSaveStaff = async () => {
    if (staffAgregados.length === 0) return;
    setAddingStaff(true);
    try {
      await Promise.all(
        staffAgregados.map((s) =>
          api.post(`/tournaments/${torneoId}/staff`, { email: s.email }, token),
        ),
      );
      setStaffAgregados([]);
      setShowInput(false);
      setStaffQuery('');
      setStaffResults([]);
      showSuccess('Staff guardado', 'El staff será notificado al publicar el torneo');
      await fetchStaff();
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo agregar el staff');
    } finally { setAddingStaff(false); }
  };

  // Extraído para evitar ternario anidado en JSX
  const renderLista = () => {
    if (loadingStaff) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator color="#0D7A3E" size="small" />
        </View>
      );
    }
    if (totalStaff === 0 && !showInput) {
      return (
        <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
          <Feather name="users" size={28} color="#3D4F44" />
          <Text className="text-carbon text-sm text-center mt-2">No hay staff asignado aún.</Text>
        </View>
      );
    }
    return (
      <>
        {staffAceptados.map((s) => (
          <View key={s.id} className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center"
            style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}>
            <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center mr-3">
              <Text className="text-primary text-sm font-sans-medium">
                {s.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-night text-sm font-sans-medium">{s.nombre}</Text>
              <Text className="text-carbon text-xs">{s.email}</Text>
            </View>
            <View className="bg-green-100 px-2 py-0.5 rounded-full">
              <Text className="text-green-700 text-xs font-sans-medium">Aceptado</Text>
            </View>
          </View>
        ))}
        {staffPendientes.map((s) => (
          <View key={s.id} className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center"
            style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}>
            <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-3">
              <Feather name="clock" size={16} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-night text-sm font-sans-medium">{s.email}</Text>
              <Text className="text-carbon text-xs">Invitación pendiente</Text>
            </View>
            <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Text className="text-amber-700 text-xs font-sans-medium">Pendiente</Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  return (
    <View>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Cabecera de sección */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-night font-sans-medium text-base">
          Staff{totalStaff > 0 ? ` (${totalStaff})` : ''}
        </Text>
        <TouchableOpacity
          onPress={() => { setShowInput((p) => !p); setStaffQuery(''); setStaffResults([]); setStaffAgregados([]); }}
          className="flex-row items-center gap-1 bg-primary rounded-xl px-3 py-2"
          activeOpacity={0.8}
        >
          <Feather name={showInput ? 'x' : 'plus'} size={15} color="white" />
          <Text className="text-white text-xs font-sans-medium">
            {showInput ? 'Cancelar' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderLista()}

      {/* Panel agregar */}
      {showInput && (
        <View className="bg-white rounded-2xl px-4 py-4 mt-2">
          <Text className="text-carbon text-xs mb-3">
            Busca por nombre o correo para agregar staff al torneo.
          </Text>
          <View className="flex-row items-center bg-mist rounded-xl px-3 py-3 mb-1">
            <Feather name="search" size={15} color="#3D4F44" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-night text-sm"
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor="#3D4F44"
              autoCapitalize="none"
              keyboardType="email-address"
              value={staffQuery}
              onChangeText={handleSearch}
            />
            {searching && <ActivityIndicator size="small" color="#0D7A3E" />}
            {!searching && staffQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setStaffQuery(''); setStaffResults([]); }}>
                <Feather name="x" size={15} color="#3D4F44" />
              </TouchableOpacity>
            )}
          </View>
          {staffResults.length > 0 && (
            <View className="border border-mist rounded-xl overflow-hidden mt-1">
              {staffResults.map((user, index) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => handleSelectUser(user)}
                  activeOpacity={0.75}
                  className={`flex-row items-center px-3 py-3 ${index < staffResults.length - 1 ? 'border-b border-mist' : ''}`}
                >
                  <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-3">
                    <Text className="text-primary text-xs font-sans-medium">
                      {user.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-night text-sm font-sans-medium">{user.nombre}</Text>
                    <Text className="text-carbon text-xs">{user.email}</Text>
                  </View>
                  <Feather name="plus-circle" size={18} color="#0D7A3E" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {staffQuery.length >= 2 && !searching && staffResults.length === 0 && (
            <View className="py-3 items-center">
              <Text className="text-carbon text-xs">No se encontraron usuarios.</Text>
            </View>
          )}
          {staffAgregados.length > 0 && (
            <View className="mt-4">
              <Text className="text-carbon text-xs font-sans-medium mb-2">
                Por agregar ({staffAgregados.length}):
              </Text>
              {staffAgregados.map((s) => (
                <View key={s.email} className="flex-row items-center bg-mist rounded-xl px-3 py-2 mb-2">
                  <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center mr-2">
                    <Text className="text-primary text-xs font-sans-medium">
                      {(s.nombre ?? s.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    {s.nombre && <Text className="text-night text-xs font-sans-medium">{s.nombre}</Text>}
                    <Text className="text-carbon text-xs">{s.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAgregado(s.email)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 items-center mt-1"
                onPress={handleSaveStaff}
                disabled={addingStaff}
              >
                {addingStaff ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-sans-medium text-sm">
                    Confirmar staff ({staffAgregados.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Tab Solicitudes ──────────────────────────────────────────────────────────

function TabSolicitudes({
  torneoId,
  onEquiposChange,
}: {
  readonly torneoId: string;
  readonly onEquiposChange: (delta: number) => void;
}) {
  const token = useAuthStore.getState().token ?? undefined;
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [responding,    setResponding]    = useState<string | null>(null);

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/tournaments/${torneoId}/inscripciones`, token);
      setInscripciones(data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [torneoId]);

  useEffect(() => { fetchInscripciones(); }, [fetchInscripciones]);

  const handleResponder = async (inscripcionId: string, accion: 'aprobar' | 'rechazar') => {
    setResponding(inscripcionId);
    try {
      await api.patch(
        `/tournaments/${torneoId}/inscripciones/${inscripcionId}/${accion}`,
        {},
        token,
      );
      setInscripciones((prev) => prev.filter((i) => i.id !== inscripcionId));
      onEquiposChange(accion === 'aprobar' ? 1 : 0);
      showSuccess(
        accion === 'aprobar' ? 'Equipo aprobado' : 'Equipo rechazado',
        accion === 'aprobar'
          ? 'El equipo ha sido aceptado en el torneo.'
          : 'La solicitud ha sido rechazada.',
      );
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo procesar la solicitud');
    } finally { setResponding(null); }
  };

  if (loading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator color="#0D7A3E" />
      </View>
    );
  }

  return (
    <View>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {inscripciones.length === 0 ? (
        <View className="bg-white rounded-2xl px-4 py-8 items-center">
          <Feather name="check-circle" size={32} color="#3D4F44" />
          <Text className="text-carbon text-sm text-center mt-3">
            No hay solicitudes pendientes.
          </Text>
        </View>
      ) : (
        inscripciones.map((ins) => {
          const isOpen      = expanded === ins.id;
          const isResponding = responding === ins.id;
          const sufijo      = ins.equipo.cantidadJugadores === 1 ? '' : 'es';
          return (
            <View key={ins.id} className="bg-white rounded-2xl mb-3 overflow-hidden"
              style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}>
              {/* Cabecera del equipo */}
              <TouchableOpacity
                onPress={() => setExpanded(isOpen ? null : ins.id)}
                activeOpacity={0.8}
                className="flex-row items-center px-4 py-3"
              >
                {ins.equipo.escudo ? (
                  <Image
                    source={{ uri: ins.equipo.escudo }}
                    className="w-10 h-10 rounded-full mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center mr-3">
                    <Feather name="shield" size={18} color="#0D7A3E" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-night font-sans-medium text-sm">{ins.equipo.nombre}</Text>
                  <Text className="text-carbon text-xs">
                    {ins.equipo.cantidadJugadores} jugador{sufijo}
                    {ins.equipo.telefonoCapitan ? `  ·  ${ins.equipo.telefonoCapitan}` : ''}
                  </Text>
                </View>
                <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#3D4F44" />
              </TouchableOpacity>

              {/* Jugadores (expandible) */}
              {isOpen && ins.equipo.jugadores.length > 0 && (
                <View className="px-4 pb-2 border-t border-mist">
                  <Text className="text-carbon text-xs font-sans-medium mt-2 mb-1">
                    Jugadores inscritos
                  </Text>
                  {ins.equipo.jugadores.map((j) => (
                    <View key={j.id} className="flex-row items-center py-1.5">
                      {j.fotoPerfil ? (
                        <Image source={{ uri: j.fotoPerfil }} className="w-7 h-7 rounded-full mr-2" />
                      ) : (
                        <View className="w-7 h-7 rounded-full bg-mist items-center justify-center mr-2">
                          <Text className="text-carbon text-xs">
                            {j.nombre.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-night text-xs font-sans-medium">{j.nombre}</Text>
                        <Text className="text-carbon text-xs">{j.email}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Botones */}
              <View className="flex-row gap-2 px-4 py-3 border-t border-mist">
                {isResponding ? (
                  <View className="flex-1 items-center py-1">
                    <ActivityIndicator color="#0D7A3E" size="small" />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleResponder(ins.id, 'rechazar')}
                      className="flex-1 py-2 rounded-xl border border-mist items-center"
                    >
                      <Text className="text-carbon font-sans-medium text-sm">Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleResponder(ins.id, 'aprobar')}
                      className="flex-1 py-2 rounded-xl bg-primary items-center"
                    >
                      <Text className="text-white font-sans-medium text-sm">Aprobar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── Tab Canchas ──────────────────────────────────────────────────────────────

function TabCanchas({ torneoId }: { readonly torneoId: string }) {
  const { alertState, hideAlert, showError, showSuccess } = useAlert();

  const [campos, setCampos] = useState<CampoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCampos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCamposByTournament(torneoId);
      setCampos(data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [torneoId]);

  useEffect(() => { fetchCampos(); }, [fetchCampos]);

  const handleAddCampo = async () => {
    if (!nombre.trim()) {
      showError('Nombre requerido', 'Por favor ingresa el nombre de la cancha.');
      return;
    }
    setAdding(true);
    try {
      await addCampoToTournament(torneoId, {
        nombre: nombre.trim(),
        direccion: direccion.trim() || undefined,
      });
      setNombre('');
      setDireccion('');
      setShowForm(false);
      showSuccess('Cancha agregada', 'La cancha fue agregada exitosamente al torneo.');
      await fetchCampos();
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo agregar la cancha.');
    } finally { setAdding(false); }
  };

  const renderLista = () => {
    if (loading) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator color="#0D7A3E" size="small" />
        </View>
      );
    }
    if (campos.length === 0 && !showForm) {
      return (
        <View className="bg-white rounded-2xl px-4 py-6 items-center mb-3">
          <Feather name="map-pin" size={28} color="#3D4F44" />
          <Text className="text-carbon text-sm text-center mt-2">No hay canchas registradas en este torneo.</Text>
        </View>
      );
    }
    return (
      <>
        {campos.map((c) => (
          <View key={c.id} className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center"
            style={{ elevation: 1, shadowColor: '#0F1A14', shadowOpacity: 0.04, shadowRadius: 4 }}>
            <View className="w-9 h-9 rounded-full bg-primary-light items-center justify-center mr-3">
              <MapPin size={16} color="#0D7A3E" />
            </View>
            <View className="flex-1">
              <Text className="text-night text-sm font-sans-medium">{c.nombre}</Text>
              {c.direccion && <Text className="text-carbon text-xs">{c.direccion}</Text>}
            </View>
          </View>
        ))}
      </>
    );
  };

  return (
    <View>
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-night font-sans-medium text-base">
          Canchas{campos.length > 0 ? ` (${campos.length})` : ''}
        </Text>
        <TouchableOpacity
          onPress={() => { setShowForm((p) => !p); setNombre(''); setDireccion(''); }}
          className="flex-row items-center gap-1 bg-primary rounded-xl px-3 py-2"
          activeOpacity={0.8}
        >
          <Feather name={showForm ? 'x' : 'plus'} size={15} color="white" />
          <Text className="text-white text-xs font-sans-medium">
            {showForm ? 'Cancelar' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderLista()}

      {showForm && (
        <View className="bg-white rounded-2xl px-4 py-4 mt-2">
          <Text className="text-night font-sans-medium text-sm mb-3">
            Nueva Cancha de Juego
          </Text>
          <View className="mb-3">
            <Text className="text-carbon text-xs mb-1">Nombre de la cancha</Text>
            <TextInput
              className="bg-mist rounded-xl px-3 py-2.5 text-night text-sm"
              placeholder="Ej: Cancha Central, Campo 1..."
              placeholderTextColor="#9CA3AF"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
          <View className="mb-4">
            <Text className="text-carbon text-xs mb-1">Dirección (opcional)</Text>
            <TextInput
              className="bg-mist rounded-xl px-3 py-2.5 text-night text-sm"
              placeholder="Ej: Av. Principal 123..."
              placeholderTextColor="#9CA3AF"
              value={direccion}
              onChangeText={setDireccion}
            />
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center"
            onPress={handleAddCampo}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-sans-medium text-sm">
                Guardar cancha
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Tab Ajustes ──────────────────────────────────────────────────────────────

function toDisplayDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function maxDateStr(...dates: string[]): string | undefined {
  const valid = dates.filter(Boolean);
  if (valid.length === 0) return undefined;
  return valid.sort((a, b) => (a > b ? -1 : 1))[0];
}

function TabAjustes({
  torneoId,
  estadoInicial,
  fechaInicioInicial,
  fechaFinInicial,
  maxEquiposInicial,
  equiposAprobados,
  onEstadoChange,
}: {
  readonly torneoId: string;
  readonly estadoInicial: string;
  readonly fechaInicioInicial: string;
  readonly fechaFinInicial: string;
  readonly maxEquiposInicial: string;
  readonly equiposAprobados: number;
  readonly onEstadoChange: (estado: string) => void;
}) {
  const { alertState, hideAlert, showError, showSuccess, showConfirm } = useAlert();

  const [calendarOpen, setCalendarOpen] = useState<'fin' | null>(null);
  const [fechaInicio, setFechaInicio] = useState(fechaInicioInicial?.slice(0, 10) ?? '');
  const [fechaFin, setFechaFin] = useState(fechaFinInicial?.slice(0, 10) ?? '');
  const [maxEquipos, setMaxEquipos] = useState(maxEquiposInicial ?? '4');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [estado, setEstado] = useState(estadoInicial ?? '');
  const [ultimaFechaPartido, setUltimaFechaPartido] = useState('');

  const isEnCurso = estado === 'EN_CURSO';
  const isFinalizado = estado === 'FINALIZADO';
  const canEditEquipos = !isEnCurso && !isFinalizado;
  const today = new Date().toISOString().split('T')[0];
  const minFechaFin = maxDateStr(fechaInicio, today, ultimaFechaPartido) ?? today;

  useEffect(() => {
    if (!torneoId) return;
    getFixture(torneoId)
      .then((rondas) => {
        let latest = '';
        for (const r of rondas) {
          for (const p of r.partidos) {
            if (!p.fecha) continue;
            const d = toDateOnlyString(p.fecha);
            if (d && (!latest || d > latest)) latest = d;
          }
        }
        setUltimaFechaPartido(latest);
      })
      .catch(() => setUltimaFechaPartido(''));
  }, [torneoId]);

  const handleCerrarInscripciones = () => {
    const max = Number.parseInt(maxEquipos, 10);
    if (equiposAprobados < max) {
      showError(
        'No se puede cerrar',
        `Faltan equipos: hay ${equiposAprobados} de ${max} aprobados. Reduce el máximo de equipos o aprueba más solicitudes.`,
      );
      return;
    }
    showConfirm(
      'Cerrar inscripciones',
      `Se cerrarán las inscripciones con ${equiposAprobados} equipos. ¿Continuar?`,
      async () => {
        setClosing(true);
        try {
          await startTournament(torneoId);
          setEstado('EN_CURSO');
          onEstadoChange('EN_CURSO');
          showSuccess('Inscripciones cerradas', 'El torneo está ahora En curso');
        } catch (e: any) {
          showError('Error', e.message ?? 'No se pudo cerrar las inscripciones');
        } finally {
          setClosing(false);
        }
      },
    );
  };

  const handleSave = async () => {
    if (fechaFin && fechaFin < minFechaFin) {
      showError(
        'Fecha inválida',
        'La fecha de fin debe ser posterior o igual a la de inicio, a hoy y a cualquier partido programado.',
      );
      return;
    }

    if (!isEnCurso && canEditEquipos) {
      const max = Number.parseInt(maxEquipos, 10);
      if (!max || max < 4) {
        showError('Valor inválido', 'El número de equipos debe ser al menos 4');
        return;
      }
      if (max < equiposAprobados) {
        showError(
          'Valor inválido',
          `No puedes reducir a ${max} equipos: ya hay ${equiposAprobados} aprobados.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = isEnCurso
        ? { fechaFin }
        : { fechaFin, maxEquipos: Number.parseInt(maxEquipos, 10) };
      await updateTournament(torneoId, payload);
      showSuccess('Torneo actualizado', 'Los cambios fueron guardados exitosamente');
    } catch (e: any) {
      showError('Error', e.message ?? 'No se pudo actualizar el torneo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      <View
        className="bg-white rounded-2xl mb-4"
        style={{ paddingHorizontal: 16, paddingVertical: 16, overflow: 'hidden' }}
      >
        {/* Fechas en columna para que no se salgan de pantalla */}
        <View style={{ gap: 12, marginBottom: 16 }}>
          <View>
            <Text className="text-carbon text-sm font-sans-medium mb-1">Fecha inicio</Text>
            <View className="bg-mist rounded-xl px-4 py-3 border border-mist">
              <Text className="text-night font-sans text-sm">{toDisplayDate(fechaInicio)}</Text>
            </View>
            <Text className="text-carbon text-xs mt-1">
              La fecha de inicio no se puede modificar
            </Text>
          </View>
          <DatePickerField
            label="Fecha fin"
            value={fechaFin}
            onChange={(v) => setFechaFin(v)}
            minDate={minFechaFin}
            visible={calendarOpen === 'fin'}
            onOpen={() => setCalendarOpen('fin')}
            onClose={() => setCalendarOpen(null)}
          />
          {ultimaFechaPartido ? (
            <Text className="text-carbon text-xs">
              Último partido programado: {toDisplayDate(ultimaFechaPartido)}
            </Text>
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: '#EBF0EC', marginBottom: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Users size={14} color="#3D4F44" />
          <Text style={{ color: '#3D4F44', fontFamily: 'Inter_500Medium', fontSize: 12 }}>
            Máximo de equipos
          </Text>
        </View>

        {canEditEquipos ? (
          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: 280,
                paddingHorizontal: 8,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const cur = Number.parseInt(maxEquipos, 10) || 4;
                  const next = Math.max(Math.max(4, equiposAprobados || 4), cur - 2);
                  setMaxEquipos(String(next));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MinusCircle size={36} color="#0D7A3E" strokeWidth={1.5} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 8 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 44,
                    color: '#0D7A3E',
                    lineHeight: 48,
                  }}
                >
                  {maxEquipos}
                </Text>
                <Text
                  style={{
                    color: '#3D4F44',
                    fontSize: 11,
                    fontFamily: 'Inter_400Regular',
                    textAlign: 'center',
                  }}
                >
                  {equiposAprobados} aprobado{equiposAprobados === 1 ? '' : 's'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const cur = Number.parseInt(maxEquipos, 10) || 4;
                  setMaxEquipos(String(Math.min(32, cur + 2)));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <PlusCircle size={36} color="#0D7A3E" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="items-center py-2">
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 40, color: '#0D7A3E' }}>
              {maxEquipos}
            </Text>
            <Text className="text-carbon text-xs text-center mt-1 px-2">
              No se puede modificar con el torneo en curso o finalizado
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        className="bg-primary rounded-2xl py-4 items-center mb-3"
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-sans-medium text-base">Guardar cambios</Text>
        )}
      </TouchableOpacity>

      {estado === 'EN_INSCRIPCION' && (
        <TouchableOpacity
          style={{
            backgroundColor: '#E53935',
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            elevation: 2,
            shadowColor: '#E53935',
            shadowOpacity: 0.25,
            shadowRadius: 8,
          }}
          onPress={handleCerrarInscripciones}
          disabled={closing}
          activeOpacity={0.8}
        >
          {closing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Feather name="lock" size={18} color="white" />
              <Text style={{ color: 'white', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
                Cerrar inscripciones
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

type Tab = 'staff' | 'solicitudes' | 'canchas' | 'ajustes';

export default function ManageScreen() {
  const {
    id: torneoId,
    fechaInicio: fechaInicioInicial,
    fechaFin: fechaFinInicial,
    estado: estadoInicial,
    maxEquipos: maxEquiposInicial,
    equiposAprobados: equiposAprobadosInicial,
  } = useLocalSearchParams<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    maxEquipos: string;
    equiposAprobados: string;
  }>();
  const router = useRouter();
  const { alertState, hideAlert } = useAlert();

  const [tab, setTab] = useState<Tab>('staff');
  const [equiposAprobados, setEquiposAprobados] = useState(Number.parseInt(equiposAprobadosInicial ?? '0', 10));
  const [estado, setEstado] = useState(estadoInicial ?? '');

  const tabs: { key: Tab; label: string; icon: typeof UserCheck }[] = [
    { key: 'staff', label: 'Staff', icon: UserCheck },
    { key: 'solicitudes', label: 'Solicitudes', icon: ClipboardList },
    { key: 'canchas', label: 'Canchas', icon: MapPin },
    { key: 'ajustes', label: 'Ajustes', icon: Settings2 },
  ];

  return (
    <View className="flex-1 bg-mist">
      <CustomAlert {...alertState} onConfirm={alertState.onConfirm} onCancel={hideAlert} />

      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-sans-medium flex-1">Gestionar torneo</Text>
      </View>

      {/* Tabs debajo del título */}
      <View className="px-4 pt-3 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row bg-white rounded-2xl p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: tab === key ? '#0D7A3E' : 'transparent',
                }}
              >
                <Icon size={15} color={tab === key ? 'white' : '#3D4F44'} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: tab === key ? 'white' : '#3D4F44' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!!torneoId && tab === 'ajustes' && (
          <TabAjustes
            torneoId={torneoId}
            estadoInicial={estado || estadoInicial}
            fechaInicioInicial={fechaInicioInicial ?? ''}
            fechaFinInicial={fechaFinInicial ?? ''}
            maxEquiposInicial={maxEquiposInicial ?? '4'}
            equiposAprobados={equiposAprobados}
            onEstadoChange={setEstado}
          />
        )}
        {!!torneoId && tab === 'staff' && <TabStaff torneoId={torneoId} />}
        {!!torneoId && tab === 'solicitudes' && (
          <TabSolicitudes
            torneoId={torneoId}
            onEquiposChange={(delta) => setEquiposAprobados((prev) => prev + delta)}
          />
        )}
        {!!torneoId && tab === 'canchas' && <TabCanchas torneoId={torneoId} />}
      </ScrollView>
    </View>
  );
}
