"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SeedResult {
  message: string;
  data: {
    communitiesSeeded: number;
    investmentsCreated: number;
    suggestionsCreated: number;
  };
}

export default function SeedInvestmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SeedResult | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Check if user is General Admin
  if (session && session.user?.role !== "General Admin") {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          ❌ Access Denied: Only General Admin can access this page
        </Alert>
        <Button variant="contained" onClick={() => router.back()}>
          Go Back
        </Button>
      </Container>
    );
  }

  const handleSeedInvestments = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/seed/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to seed investments"
        );
      }

      const data = (await response.json()) as SeedResult;
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Seed Investment Data
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Populate all communities with sample investment data
        </Typography>
      </Box>

      {/* Info Card */}
      <Card sx={{ mb: 4, bgcolor: "#e3f2fd", border: "1px solid #90caf9" }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <InfoIcon sx={{ color: "#1976d2", mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                What does this do?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This action will create sample investment data for all active
                communities. It will:
              </Typography>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    Clear existing investment data
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    Create 5 sample member investments per community
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    Create 3 sample investment suggestions per community
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    Include various investment types (stocks, crypto, business,
                    real estate)
                  </Typography>
                </li>
              </ul>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Sample Data Info */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Sample Data Includes:
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                📊 Member Investments
              </Typography>
              <Stack spacing={1}>
                <Chip
                  label="Apple Inc. (AAPL) - Stock"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Tech Startup - Business"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Bitcoin (BTC) - Crypto"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Office Building - Real Estate"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label="Microsoft (MSFT) - Stock"
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                💡 Investment Suggestions
              </Typography>
              <Stack spacing={1}>
                <Chip
                  label="NVIDIA (Pending)"
                  size="small"
                  color="default"
                  variant="outlined"
                />
                <Chip
                  label="E-commerce Platform (Approved)"
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label="Residential Complex (Voting)"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          <strong>Note:</strong> All sample data will be created for each active
          community. Users and community selection is done automatically.
        </Typography>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Card sx={{ mb: 4, bgcolor: "#e8f5e9", border: "2px solid #4caf50" }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "flex-start" }}
            >
              <CheckCircleIcon
                sx={{ color: "#4caf50", fontSize: 32, mt: 0.5 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  ✓ Seeding Completed Successfully!
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{success.data.communitiesSeeded}</strong>{" "}
                    communities seeded with investment data
                  </Typography>
                  <Typography variant="body2">
                    <strong>{success.data.investmentsCreated}</strong> member
                    investments created
                  </Typography>
                  <Typography variant="body2">
                    <strong>{success.data.suggestionsCreated}</strong>{" "}
                    investment suggestions created
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  onClick={() => router.push("/admin")}
                >
                  Return to Admin Dashboard
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {!success && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Button variant="outlined" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<CloudUploadIcon />}
            onClick={() => setConfirmDialogOpen(true)}
            disabled={loading}
            size="large"
          >
            {loading ? "Seeding..." : "Seed Investment Data"}
          </Button>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <ErrorIcon sx={{ color: "#ff9800" }} />
            Confirm Data Seeding
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will:
          </Typography>
          <ul style={{ margin: "0 0 2px 20px", paddingLeft: 0 }}>
            <li>
              <Typography variant="body2" color="textSecondary">
                Delete all existing investment data
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="textSecondary">
                Create new sample investments for all active communities
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="textSecondary">
                This action cannot be undone
              </Typography>
            </li>
          </ul>
          <Alert severity="warning" sx={{ mt: 3 }}>
            Make sure you have backed up any important investment data before
            proceeding.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSeedInvestments}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Yes, Seed Data"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
