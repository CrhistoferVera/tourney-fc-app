import { View, Text, TouchableOpacity, Modal } from 'react-native';

type AlertType = 'error' | 'success' | 'confirm';

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlert({
  visible,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: CustomAlertProps) {
  const getConfirmStyle = () => {
    if (type === 'error') return 'bg-danger';
    if (type === 'confirm') return 'bg-danger';
    return 'bg-primary';
  };

  const getIconColor = () => {
    if (type === 'error') return 'bg-danger';
    if (type === 'confirm') return 'bg-accent';
    return 'bg-primary';
  };

  const getIcon = () => {
    if (type === 'error') return '✕';
    if (type === 'confirm') return '!';
    return '✓';
  };

  const defaultConfirmText = () => {
    if (type === 'confirm') return confirmText ?? 'Confirmar';
    return confirmText ?? 'Aceptar';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="bg-white rounded-3xl w-full overflow-hidden">
          {/* Icono */}
          <View className="items-center pt-8 pb-4">
            <View
              className={`w-16 h-16 rounded-full ${getIconColor()} items-center justify-center`}
            >
              <Text className="text-white text-2xl font-sans-medium">{getIcon()}</Text>
            </View>
          </View>

          {/* Título y mensaje */}
          <View className="px-6 pb-6 items-center">
            <Text className="text-night text-lg font-sans-medium text-center mb-2">{title}</Text>
            <Text className="text-carbon text-sm text-center leading-5">{message}</Text>
          </View>

          {/* Botones */}
          <View className={`px-6 pb-6 gap-3 ${type === 'confirm' ? 'flex-col' : ''}`}>
            <TouchableOpacity
              className={`${getConfirmStyle()} rounded-xl py-4 items-center`}
              onPress={onConfirm}
            >
              <Text className="text-white font-sans-medium text-base">{defaultConfirmText()}</Text>
            </TouchableOpacity>

            {type === 'confirm' && onCancel && (
              <TouchableOpacity
                className="border border-mist rounded-xl py-4 items-center"
                onPress={onCancel}
              >
                <Text className="text-carbon font-sans-medium text-base">
                  {cancelText ?? 'Cancelar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
