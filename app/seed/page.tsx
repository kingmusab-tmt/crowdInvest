"use client";

import * as React from "react";
import { Box, Button, Container, Paper, Typography, Alert, CircularProgress, List, ListItem, ListItemText } from "@mui/material";

export default function SeedPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const seedCommunities = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/seed/communities", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed communities");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed communities");
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {result.message}
            {result.communities && (
              <List>
                {result.communities.map((c: any) => (
                  <ListItem key={c.id}>
                    <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                  </ListItem>
                ))}
              </List>
            )}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={seedCommunities}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Seed Communities"}
        </Button>
      </Paper>
    </Container>
  );
}
