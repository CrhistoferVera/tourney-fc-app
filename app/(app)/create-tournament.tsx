import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  createTournament,
  publishTournament,
  TournamentFormat,
  Campo,
} from '../../services/tournamentService';
import CustomAlert from '../../components/CustomAlert';
import ProgressBar from '../../components/create-tournament/ProgressBar';
import Step1, { Step1Errors } from '../../components/create-tournament/Step1';
import Step2 from '../../components/create-tournament/Step2';
import Step3 from '../../components/create-tournament/Step3';
import Step4 from '../../components/create-tournament/Step4';
import Step5 from '../../components/create-tournament/Step5';

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

  const onChange = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const showAlert = (params: Omit<AlertState, 'visible'>) =>
    setAlert({ visible: true, ...params });

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

  const buildDto = () => ({
    nombre: form.nombre,
    descripcion: form.descripcion,
    formato: form.formato as TournamentFormat,
    maxEquipos: form.maxEquipos,
    fechaInicio: form.fechaInicio,
    fechaFin: form.fechaFin,
    zona: form.zona,
    campos: form.campos.filter((c) => c.nombre.trim()),
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await createTournament(buildDto());
      showAlert({
        type: 'success',
        title: 'Borrador guardado',
        message: 'Tu torneo fue guardado como borrador.',
        onConfirm: () => {
          hideAlert();
          router.replace('/(app)/home');
        },
      });
    } catch {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el torneo. Intenta de nuevo.',
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
          const created = await createTournament(buildDto());
          await publishTournament(created.id);
          showAlert({
            type: 'success',
            title: '¡Publicado!',
            message: 'Tu torneo ya está disponible para inscripciones.',
            onConfirm: () => {
              hideAlert();
              router.replace('/(app)/home');
            },
          });
        } catch {
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'No se pudo publicar el torneo. Intenta de nuevo.',
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
            onChange={(v) => onChange('formato', v)}
            error={step2Error}
          />
        )}
        {step === 3 && (
          <Step3
            maxEquipos={form.maxEquipos}
            campos={form.campos}
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