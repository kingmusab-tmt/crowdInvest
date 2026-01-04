"use client";

import * as React from "react";
import {
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
} from "@mui/material";

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const [tab, setTab] = React.useState(0);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile and verification details.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="settings tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Profile" {...a11yProps(0)} />
          <Tab label="KYC Verification" {...a11yProps(1)} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Profile
            </Typography>
            <Stack spacing={2}>
              <TextField label="Full Name" fullWidth />
              <TextField label="Email" fullWidth disabled />
              <Button variant="contained">Save Changes</Button>
            </Stack>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              KYC Verification
            </Typography>
            <Stack spacing={2}>
              <TextField label="ID Number" fullWidth />
              <TextField label="Address" fullWidth />
              <TextField label="Document Link" fullWidth />
              <Button variant="contained">Submit Verification</Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
