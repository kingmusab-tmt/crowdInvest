"use client";

import * as React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import { usePlatformSettings } from "@/components/PlatformSettingsContext";

export default function MaintenancePage() {
  const { settings } = usePlatformSettings();

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
        <Box sx={{ color: "warning.main", mb: 2 }}>
          <BuildCircleIcon sx={{ fontSize: 64 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
          {settings.platformName} is under maintenance
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {settings.legal.maintenanceMessage ||
            "We're currently performing scheduled maintenance. Please check back shortly."}
        </Typography>
      </Paper>
    </Container>
  );
}
