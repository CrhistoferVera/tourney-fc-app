import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import ProgressBar from '../../components/create-tournament/ProgressBar';
import Step1, { Step1Errors } from '../../components/create-tournament/Step1';
import Step2 from '../../components/create-tournament/Step2';
import Step3 from '../../components/create-tournament/Step3';
import Step4 from '../../components/create-tournament/Step4';
import Step5 from '../../components/create-tournament/Step5';
import {
  Campo,
  createTournament,
  publishTournament,
  TournamentFormat,
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
  maxEquipos: number;
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
  maxEquipos: 8,
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
  const { token } = useAuthStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Error, setStep2Error] = useState('');
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
      if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
      if (!form.fechaInicio) errors.fechaInicio = 'Selecciona la fecha de inicio';
      if (!form.fechaFin) errors.fechaFin = 'Selecciona la fecha de fin';
      setStep1Errors(errors);
      return Object.keys(errors).length === 0;
    }
    if (step === 2) {
      if (!form.formato) {
        setStep2Error('Debes seleccionar un formato');
        return false;
      }
      setStep2Error('');
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 5) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const buildDto = (imageUrl?: string) => ({
    nombre: form.nombre,
    descripcion: form.descripcion,
    formato: form.formato as TournamentFormat,
    maxEquipos: form.maxEquipos,
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
      await createTournament(buildDto(imageUrl));
      showAlert({
        type: 'success',
        title: 'Borrador guardado',
        message: 'Tu torneo fue guardado como borrador.',
        onConfirm: () => {
          hideAlert();
          router.replace('/(app)/(tabs)/home');
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
          const created = await createTournament(buildDto(imageUrl));
          await publishTournament(created.id);
          showAlert({
            type: 'success',
            title: '¡Publicado!',
            message: 'Tu torneo ya está disponible para inscripciones.',
            onConfirm: () => {
              hideAlert();
              router.replace('/(app)/(tabs)/home');
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
    <KeyboardAvoidingView
      className="flex-1 bg-mist"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={back} className="mr-3">
            <Text className="text-white text-base">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-medium">Crear torneo</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
            onChange={(v) => {
              onChange('formato', v);
              if (v === 'COPA' && ![4, 8, 16, 32].includes(form.maxEquipos)) {
                // Find nearest valid power of 2 for Copa, default to 8
                const validCopa = [4, 8, 16, 32];
                const closest = validCopa.reduce((prev, curr) =>
                  Math.abs(curr - form.maxEquipos) < Math.abs(prev - form.maxEquipos) ? curr : prev,
                );
                onChange('maxEquipos', closest);
              }
            }}
            error={step2Error}
          />
        )}
        {step === 3 && (
          <Step3
            maxEquipos={form.maxEquipos}
            campos={form.campos}
            formato={form.formato}
            onChangeEquipos={(n) => onChange('maxEquipos', n)}
            onChangeCampos={(c) => onChange('campos', c)}
          />
        )}
        {step === 4 && (
          <Step4
            staffEmails={form.staffEmails}
            onChange={(emails) => onChange('staffEmails', emails)}
          />
        )}
        {step === 5 && (
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

        {step < 5 ? (
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
              className="flex-1 border border-primary rounded-2xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary font-sans-medium text-sm">Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveDraft}
              disabled={saving}
              className="flex-1 border border-primary rounded-2xl py-3 items-center"
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#0D7A3E" size="small" />
              ) : (
                <Text className="text-primary font-sans-medium text-sm">Guardar borrador</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublish}
              disabled={saving}
              className="flex-1 bg-primary rounded-2xl py-3 items-center"
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-sans-medium text-sm">Publicar torneo</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </KeyboardAvoidingView>
  );
}
