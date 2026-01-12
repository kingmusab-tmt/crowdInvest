import { useState } from "react";

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  isLoading: boolean;
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const openConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setDialog({
      open: true,
      title,
      message,
      onConfirm,
      isLoading: false,
    });
  };

  const closeConfirmDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
  };

  const handleConfirm = async () => {
    setDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await dialog.onConfirm();
    } finally {
      closeConfirmDialog();
    }
  };

  return {
    dialog,
    openConfirmDialog,
    closeConfirmDialog,
    handleConfirm,
  };
}
