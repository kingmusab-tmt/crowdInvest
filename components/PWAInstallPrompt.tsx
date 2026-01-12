"use client";

import React from "react";
import { Snackbar, Button, Box, Typography } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export default function PWAInstallPrompt() {
  const { installPrompt, isInstalled, handleInstall } = usePWAInstall();

  // Don't show if already installed or no install prompt
  if (isInstalled || !installPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={!!installPrompt}
      autoHideDuration={null}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      sx={{
        "& .MuiSnackbarContent-root": {
          backgroundColor: "#3399FF",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: "white",
          py: 1,
          px: 2,
        }}
      >
        <CloudDownloadIcon sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Install CROWD Invest
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Add to your home screen for easy access
          </Typography>
        </Box>
        <Button
          color="inherit"
          size="small"
          onClick={handleInstall}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            },
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          Install
        </Button>
      </Box>
    </Snackbar>
  );
}
