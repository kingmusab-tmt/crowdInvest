import React from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface SnackbarAlertProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
  position?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
}

export default function SnackbarAlert({
  open,
  message,
  severity = "info",
  onClose,
  autoHideDuration = 6000,
  position = { vertical: "bottom", horizontal: "left" },
}: SnackbarAlertProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
