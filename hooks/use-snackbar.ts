import { useState } from "react";

export type AlertSeverity = "error" | "warning" | "info" | "success";

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertSeverity;
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (message: string, severity: AlertSeverity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showError = (message: string) => showSnackbar(message, "error");
  const showSuccess = (message: string) => showSnackbar(message, "success");
  const showWarning = (message: string) => showSnackbar(message, "warning");
  const showInfo = (message: string) => showSnackbar(message, "info");

  return {
    snackbar,
    showSnackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
