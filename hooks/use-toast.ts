"use client";

import * as React from "react";

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
}

interface ToastState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

let globalSetToast: ((state: ToastState) => void) | null = null;

function toast({ title, description, variant }: ToastOptions) {
  const message = title
    ? `${title}${description ? `: ${description}` : ""}`
    : String(description || "");

  const severity = variant === "destructive" ? "error" : "info";

  if (globalSetToast) {
    globalSetToast({
      open: true,
      message,
      severity,
    });
  }

  return {
    id: Date.now().toString(),
    dismiss: () => {
      if (globalSetToast) {
        globalSetToast((prev) => ({ ...prev, open: false }));
      }
    },
    update: () => {},
  };
}

function useToast() {
  const [toastState, setToastState] = React.useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  React.useEffect(() => {
    globalSetToast = setToastState;
    return () => {
      globalSetToast = null;
    };
  }, []);

  return {
    toast,
    toastState,
    setToastState,
    dismiss: () => setToastState((prev) => ({ ...prev, open: false })),
  };
}

export { useToast, toast };
