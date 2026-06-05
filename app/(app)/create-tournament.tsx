import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ChevronLeft } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import ProgressBar from '../../components/create-tournament/ProgressBar';
import Step1, { Step1Errors } from '../../components/create-tournament/Step1';
import Step2, { Step2Errors } from '../../components/create-tournament/Step2';
import Step3 from '../../components/create-tournament/Step3';
import Step5 from '../../components/create-tournament/Step5';
import {
  Campo,
  createTournament,
  updateTournament,
  getTournamentById,
  publishTournament,
  TournamentFormat,
  TournamentModality,
  uploadTournamentImage,
} from '../../services/tournamentService';
import { useAuthStore } from '../../store/authStore';

interface FormData {
  nombre: string;
  descripcion: string;
  zona: string;
  fechaInicio: string;
  fechaFin: string;
  formato: TournamentFormat | '';
  modalidad: TournamentModality | '';
  maxEquipos: number;
  maxJugadoresPorEquipo: number;
  campos: Campo[];
  staffEmails: string[];
  imagen?: string;
  imagenLocal?: string;
}

const INITIAL_FORM: FormData = {
  nombre: '',
  descripcion: '',
  zona: '',
  fechaInicio: '',
  fechaFin: '',
  formato: '',
  modalidad: '',
  maxEquipos: 8,
  maxJugadoresPorEquipo: 22,
  campos: [],
  staffEmails: [],
};

type AlertState = {
  visible: boolean;
  type: 'error' | 'success' | 'confirm';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function CreateTournamentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const { token } = useAuthStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});
  const [step3Error, setStep3Error] = useState('');
  const [calendarOpen, setCalendarOpen] = useState<'inicio' | 'fin' | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const onChange = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const showAlert = (params: Omit<AlertState, 'visible'>) => setAlert({ visible: true, ...params });

  const hideAlert = () => setAlert((prev) => ({ ...prev, visible: false }));

  const validateStep = (): boolean => {
    if (step === 1) {
      const errors: Step1Errors = {};
      const trimmedNombre = form.nombre.trim();
      if (!trimmedNombre) {
        errors.nombre = 'El nombre es obligatorio';
      } else if (trimmedNombre.length < 3) {
        errors.nombre = 'El nombre debe tener al menos 3 caracteres';
      }
      if (!form.zona.trim()) errors.zona = 'La zona es obligatoria';
      if (!form.fechaInicio) errors.fechaInicio = 'Selecciona la fecha de inicio';
      if (!form.fechaFin) errors.fechaFin = 'Selecciona la fecha de fin';
      setStep1Errors(errors);
      return Object.keys(errors).length === 0;
    }
    if (step === 2) {
      const errors: Step2Errors = {};
      if (!form.formato) errors.formato = 'Debes seleccionar un formato de torneo';
      if (!form.modalidad) errors.modalidad = 'Debes seleccionar una modalidad de juego';
      setStep2Errors(errors);
      return Object.keys(errors).length === 0;
    }
    if (step === 3) {
      const nonTotallyEmptyCampos = form.campos.filter(c => c.nombre.trim() !== '' || c.direccion.trim() !== '');
      
      if (nonTotallyEmptyCampos.length !== form.campos.length) {
        setTimeout(() => setForm(prev => ({ ...prev, campos: nonTotallyEmptyCampos })), 0);
      }

      const hasIncomplete = nonTotallyEmptyCampos.some(c => c.nombre.trim() === '' || c.direccion.trim() === '');
      
      if (hasIncomplete) {
        setStep3Error('Por favor, completa el nombre y la dirección de todas las canchas (o elimina las que no uses).');
        return false;
      }
      setStep3Error('');
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 4) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      const hasData = form.nombre !== '' || form.descripcion !== '' || form.zona !== '' || form.fechaInicio !== '' || form.fechaFin !== '' || form.formato !== '' || form.campos.length > 0 || form.imagenLocal !== undefined;
      if (hasData) {
        showAlert({
          type: 'confirm',
          title: id ? 'Salir sin guardar' : 'Cancelar creación',
          message: id ? '¿Estás seguro de que deseas salir? Perderás los cambios no guardados.' : '¿Estás seguro de que deseas salir? Perderás todos los datos del torneo.',
          onConfirm: () => {
            hideAlert();
            router.back();
          },
          onCancel: hideAlert,
        });
      } else {
        router.back();
      }
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      back();
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [step, id, form]);

  useEffect(() => {
    if (id) {
      getTournamentById(id).then(t => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        let parsedInicio = t.fechaInicio ? t.fechaInicio.split('T')[0] : '';
        if (parsedInicio && parsedInicio < todayStr) parsedInicio = '';

        let parsedFin = t.fechaFin ? t.fechaFin.split('T')[0] : '';
        if (parsedFin && parsedFin < todayStr) parsedFin = '';

        setForm({
          nombre: t.nombre,
          descripcion: t.descripcion || '',
          zona: t.zona || '',
          fechaInicio: parsedInicio,
          fechaFin: parsedFin,
          formato: t.formato || '',
          modalidad: t.modalidad || '',
          maxEquipos: t.maxEquipos || 8,
          maxJugadoresPorEquipo: t.maxJugadoresPorEquipo || 22,
          campos: t.campos ? t.campos.map(c => ({ nombre: c.nombre, direccion: c.direccion || '', latitud: c.latitud, longitud: c.longitud })) : [],
          staffEmails: [],
          imagen: t.imagen || undefined,
        });
      }).catch(err => {
        console.error('Error loading draft:', err);
      });
    }
  }, [id]);

  const buildDto = (imageUrl?: string) => ({
    nombre: form.nombre,
    descripcion: form.descripcion,
    formato: form.formato as TournamentFormat,
    modalidad: form.modalidad as TournamentModality,
    maxEquipos: form.maxEquipos,
    maxJugadoresPorEquipo: form.maxJugadoresPorEquipo,
    fechaInicio: form.fechaInicio,
    fechaFin: form.fechaFin,
    zona: form.zona,
    imagen: imageUrl || form.imagen,
    campos: form.campos.filter((c) => c.nombre.trim()),
  });

  const handleUploadImage = async (): Promise<string | undefined> => {
    if (!form.imagenLocal) return form.imagen;
    // Si ya tenemos una URL de cloudinary y la imagen local no cambió (poco probable pero por si acaso)
    // En este caso, siempre subimos si hay imagenLocal nueva
    try {
      const { url } = await uploadTournamentImage(form.imagenLocal);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen');
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const imageUrl = await handleUploadImage();
      const dto = buildDto(imageUrl);
      if (id) {
        await updateTournament(id, dto);
      } else {
        await createTournament(dto);
      }
      showAlert({
        type: 'success',
        title: 'Borrador guardado',
        message: 'Tu torneo fue guardado como borrador.',
        onConfirm: () => {
          hideAlert();
          router.replace('/home');
        },
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo guardar el torneo. Intenta de nuevo.',
        onConfirm: hideAlert,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    showAlert({
      type: 'confirm',
      title: 'Publicar torneo',
      message: 'El torneo pasará a estado "En inscripción" y será visible para todos.',
      onCancel: hideAlert,
      onConfirm: async () => {
        hideAlert();
        setSaving(true);
        try {
          const imageUrl = await handleUploadImage();
          const dto = buildDto(imageUrl);
          let tId = id;
          if (tId) {
            await updateTournament(tId, dto);
          } else {
            const created = await createTournament(dto);
            tId = created.id;
          }
          await publishTournament(tId);
          showAlert({
            type: 'success',
            title: '¡Publicado!',
            message: 'Tu torneo ya está disponible para inscripciones.',
            onConfirm: () => {
              hideAlert();
              router.replace('/home');
            },
          });
        } catch (error: any) {
          showAlert({
            type: 'error',
            title: 'Error',
            message: error.message || 'No se pudo publicar el torneo. Intenta de nuevo.',
            onConfirm: hideAlert,
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <View className="flex-1 bg-mist">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={back} className="mr-3 p-1">
            <ChevronLeft size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium">Crear torneo</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={Platform.OS === 'ios' ? 20 : 150}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 150}
      >
        <ProgressBar step={step} />

        {step === 1 && (
          <Step1
            nombre={form.nombre}
            descripcion={form.descripcion}
            zona={form.zona}
            fechaInicio={form.fechaInicio}
            fechaFin={form.fechaFin}
            imagenLocal={form.imagenLocal}
            errors={step1Errors}
            onChange={onChange}
            calendarOpen={calendarOpen}
            onOpenCalendar={setCalendarOpen}
            onCloseCalendar={() => setCalendarOpen(null)}
          />
        )}
        {step === 2 && (
          <Step2
            formato={form.formato}
            modalidad={form.modalidad}
            onChange={(v) => {
              onChange('formato', v);
              setStep2Errors((prev) => ({ ...prev, formato: undefined }));
              if (v === 'COPA' && ![4, 8, 16, 32].includes(form.maxEquipos)) {
                // Find nearest valid power of 2 for Copa, default to 8
                const validCopa = [4, 8, 16, 32];
                const closest = validCopa.reduce((prev, curr) =>
                  Math.abs(curr - form.maxEquipos) < Math.abs(prev - form.maxEquipos) ? curr : prev,
                );
                onChange('maxEquipos', closest);
              }
            }}
            onChangeModalidad={(m) => {
              onChange('modalidad', m);
              setStep2Errors((prev) => ({ ...prev, modalidad: undefined }));
              const limites: Record<string, number> = {
                FUTBOL_5: 10,
                FUTBOL_7: 14,
                FUTBOL_11: 22,
              };
              onChange('maxJugadoresPorEquipo', limites[m]);
            }}
            errors={step2Errors}
          />
        )}
        {step === 3 && (
          <Step3
            maxEquipos={form.maxEquipos}
            campos={form.campos}
            formato={form.formato}
            onChangeEquipos={(n) => onChange('maxEquipos', n)}
            onChangeCampos={(c) => {
              onChange('campos', c);
              setStep3Error('');
            }}
            error={step3Error}
          />
        )}
        {step === 4 && (
          <Step5
            nombre={form.nombre}
            formato={form.formato}
            maxEquipos={form.maxEquipos}
            fechaInicio={form.fechaInicio}
            fechaFin={form.fechaFin}
            zona={form.zona}
            campos={form.campos}
            staffEmails={form.staffEmails}
            imagenLocal={form.imagenLocal}
          />
        )}

        {step < 4 ? (
          <View className="flex-row gap-3 mt-6">
            {step > 1 ? (
              <TouchableOpacity
                onPress={back}
                className="flex-1 border border-primary rounded-2xl py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary font-sans-medium text-sm">Anterior</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={next}
              className="flex-1 bg-primary rounded-2xl py-3 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-white font-sans-medium text-sm">Siguiente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-2 mt-6">
            <TouchableOpacity
              onPress={back}
              className="flex-1 border border-primary rounded-2xl py-3 justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary font-sans-medium text-xs text-center">Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveDraft}
              disabled={saving}
              className="flex-1 border border-primary rounded-2xl py-3 justify-center items-center px-1"
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#0D7A3E" size="small" />
              ) : (
                <Text className="text-primary font-sans-medium text-xs text-center leading-tight">Guardar borrador</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublish}
              disabled={saving}
              className="flex-1 bg-primary rounded-2xl py-3 justify-center items-center px-1"
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-sans-medium text-xs text-center leading-tight">Publicar torneo</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </View>
  );
}
