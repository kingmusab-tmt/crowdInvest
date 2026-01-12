"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

export default function SeedPage() {
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const seedCommunities = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/seed/communities", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed communities");
      }

      showSuccess(data.message || "Communities seeded");
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to seed communities";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          Seed Communities
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Click the button below to populate the database with IMIC communities.
        </Typography>

        {result && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {result.message}
            </Typography>
            {result.communities && (
              <List>
                {result.communities.map((c: any) => (
                  <ListItem key={c.id}>
                    <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={seedCommunities}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Seed Communities"}
        </Button>
        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Paper>
    </Container>
  );
}
