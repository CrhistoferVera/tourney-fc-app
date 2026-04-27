import { useState } from 'react';

type AlertType = 'error' | 'success' | 'confirm';

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (config: Omit<AlertState, 'visible'>) => {
    setAlertState({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const showError = (title: string, message: string) => {
    showAlert({
      type: 'error',
      title,
      message,
      onConfirm: hideAlert,
    });
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      onConfirm: () => {
        hideAlert();
        onConfirm?.();
      },
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        hideAlert();
        onConfirm();
      },
      onCancel: hideAlert,
      confirmText,
      cancelText,
    });
  };

  return { alertState, hideAlert, showError, showSuccess, showConfirm };
};