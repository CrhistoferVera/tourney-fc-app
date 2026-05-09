import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface Props {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;

  error?: string;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  maxDate?: string;
}

function toDisplayDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  error,
  visible,
  onOpen,
  onClose,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

  const handleDayPress = (day: DateData) => {
    onChange(day.dateString);
    onClose();
  };

  return (
    <View className="flex-1">
      <Text className="text-carbon text-sm font-sans-medium mb-1">{label}</Text>
      <TouchableOpacity
        onPress={onOpen}
        className={`bg-white rounded-xl px-4 py-3 border ${error ? 'border-danger' : 'border-mist'}`}
      >
        <Text className={value ? 'text-night font-sans text-sm' : 'text-carbon font-sans text-sm'}>
          {value ? toDisplayDate(value) : 'dd/mm/aaaa'}
        </Text>
      </TouchableOpacity>
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl overflow-hidden w-full">
            <View className="bg-primary px-5 py-4">
              <Text className="text-white font-sans-medium text-base">{label}</Text>
              {value ? (
                <Text className="text-primary-light text-sm mt-0.5">{toDisplayDate(value)}</Text>
              ) : null}
            </View>
            <Calendar
              current={value || today}
              minDate={minDate ?? today}
              maxDate={maxDate}
              onDayPress={handleDayPress}
              markedDates={value ? { [value]: { selected: true, selectedColor: '#0D7A3E' } } : {}}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                selectedDayBackgroundColor: '#0D7A3E',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#0D7A3E',
                dayTextColor: '#0F1A14',
                textDisabledColor: '#EBF0EC',
                arrowColor: '#0D7A3E',
                monthTextColor: '#0F1A14',
                textDayFontFamily: 'Inter_400Regular',
                textMonthFontFamily: 'Inter_500Medium',
                textDayHeaderFontFamily: 'Inter_500Medium',
                textDayFontSize: 14,
                textMonthFontSize: 15,
                textDayHeaderFontSize: 12,
                dotColor: '#0D7A3E',
              }}
            />
            <View className="px-5 pb-5">
              <TouchableOpacity
                onPress={onClose}
                className="border border-mist rounded-xl py-3 items-center"
              >
                <Text className="text-carbon font-sans-medium text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
