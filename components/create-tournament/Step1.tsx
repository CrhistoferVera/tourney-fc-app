import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import DatePickerField from './DatePickerField';
import InputField from './InputField';

export interface Step1Errors {
  nombre?: string;
  zona?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Props {
  nombre: string;
  descripcion: string;
  zona: string;
  fechaInicio: string;
  fechaFin: string;
  imagenLocal?: string;
  errors: Step1Errors;
  onChange: (key: string, value: string) => void;
  calendarOpen: 'inicio' | 'fin' | null;
  onOpenCalendar: (which: 'inicio' | 'fin') => void;
  onCloseCalendar: () => void;
}

export default function Step1({
  nombre,
  descripcion,
  zona,
  fechaInicio,
  fechaFin,
  imagenLocal,
  errors,
  onChange,
  calendarOpen,
  onOpenCalendar,
  onCloseCalendar,
}: Props) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange('imagenLocal', result.assets[0].uri);
    }
  };

  return (
    <>
      <View className="mb-4 items-center">
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          className="w-full h-32 bg-white rounded-2xl border-2 border-dashed border-mist items-center justify-center overflow-hidden"
        >
          {imagenLocal ? (
            <Image source={{ uri: imagenLocal }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <View className="w-12 h-12 bg-primary-light rounded-full items-center justify-center mb-2">
                <Camera size={24} color="#0D7A3E" />
              </View>
              <Text className="text-carbon font-sans-medium text-sm">Añadir foto del torneo</Text>
              <Text className="text-carbon/60 font-sans text-xs mt-1">
                Formatos: JPG, PNG (16:9)
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <InputField
        label="Nombre del torneo *"
        placeholder="Ej: Copa Primavera 2026"
        value={nombre}
        onChangeText={(v) => onChange('nombre', v)}
        error={errors.nombre}
      />
      <InputField
        label="Descripción"
        placeholder="Describe tu torneo..."
        value={descripcion}
        onChangeText={(v) => onChange('descripcion', v)}
        multiline
      />
      <InputField
        label="Zona / Ciudad *"
        placeholder="Ej: Cochabamba"
        value={zona}
        onChangeText={(v) => onChange('zona', v)}
        error={errors.zona}
      />
      <View className="flex-row gap-3">
        <DatePickerField
          label="Fecha de inicio *"
          value={fechaInicio}
          onChange={(v) => onChange('fechaInicio', v)}
          visible={calendarOpen === 'inicio'}
          onOpen={() => onOpenCalendar('inicio')}
          onClose={onCloseCalendar}
          error={errors.fechaInicio}
        />
        <DatePickerField
          label="Fecha de fin *"
          value={fechaFin}
          onChange={(v) => onChange('fechaFin', v)}
          minDate={fechaInicio || undefined}
          visible={calendarOpen === 'fin'}
          onOpen={() => onOpenCalendar('fin')}
          onClose={onCloseCalendar}
          error={errors.fechaFin}
        />
      </View>
    </>
  );
}
