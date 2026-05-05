import { View } from 'react-native';
import InputField from './InputField';
import DatePickerField from './DatePickerField';

export interface Step1Errors {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Props {
  nombre: string;
  descripcion: string;
  zona: string;
  fechaInicio: string;
  fechaFin: string;
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
  errors,
  onChange,
  calendarOpen,
  onOpenCalendar,
  onCloseCalendar,
}: Props) {
  return (
    <>
      <InputField
        label="Nombre del torneo"
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
        label="Zona / Ciudad"
        placeholder="Ej: Cochabamba"
        value={zona}
        onChangeText={(v) => onChange('zona', v)}
      />
      <View className="flex-row gap-3">
        <DatePickerField
          label="Fecha de inicio"
          value={fechaInicio}
          onChange={(v) => onChange('fechaInicio', v)}
          visible={calendarOpen === 'inicio'}
          onOpen={() => onOpenCalendar('inicio')}
          onClose={onCloseCalendar}
          error={errors.fechaInicio}
        />
        <DatePickerField
          label="Fecha de fin"
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
