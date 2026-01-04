"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState({
    platformName: "CrowdInvest",
    platformEmail: "support@crowdinvest.com",
    platformPhone: "+234 (0) 123-456-7890",
    maintenanceMode: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess("Settings updated successfully");
      } else {
        setError("Failed to update settings");
      }
    } catch (err) {
      setError("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Admin Settings
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Platform Name"
            fullWidth
            name="platformName"
            value={settings.platformName}
            onChange={handleChange}
          />

          <TextField
            label="Platform Email"
            fullWidth
            type="email"
            name="platformEmail"
            value={settings.platformEmail}
            onChange={handleChange}
          />

          <TextField
            label="Platform Phone"
            fullWidth
            name="platformPhone"
            value={settings.platformPhone}
            onChange={handleChange}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1">Maintenance Mode</Typography>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{ alignSelf: "flex-start" }}
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
