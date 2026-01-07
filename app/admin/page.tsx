"use client";

import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface StatsData {
  totalUsers: number;
  totalCommunities: number;
  activeCommunityAdmins: number;
  platformHealth: string;
}

interface Community {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  communityAdmin?: { name: string; email: string };
  status: string;
  enabledFunctions: {
    investments: boolean;
    proposals: boolean;
    events: boolean;
    assistance: boolean;
    kyc: boolean;
    withdrawals: boolean;
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createCommunityOpen, setCreateCommunityOpen] = React.useState(false);
  const [newCommunity, setNewCommunity] = React.useState({
    name: "",
    description: "",
  });
  const [enabledFunctions, setEnabledFunctions] = React.useState({
    investments: true,
    proposals: true,
    events: true,
    assistance: true,
    kyc: true,
    withdrawals: true,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  React.useEffect(() => {
    // Redirect Community Admins to their community dashboard
    if (session?.user?.role === "Community Admin") {
      router.push("/admin/community");
      return;
    }

    // Only allow General Admins to access this page
    if (session && session.user?.role !== "General Admin") {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, router]);

  async function fetchData() {
    try {
      const [statsRes, communitiesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/communities"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (communitiesRes.ok) {
        const communitiesData = await communitiesRes.json();
        setCommunities(communitiesData);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCommunity = async () => {
    setError(null);
    setSuccess(null);

    if (!newCommunity.name || !newCommunity.description) {
      const msg = "Please fill in all fields";
      setError(msg);
      showSnackbar(msg, "error");
      return;
    }

    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCommunity,
          enabledFunctions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create community");
      }

      const msg = "Community created successfully";
      setSuccess(msg);
      showSnackbar(msg, "success");
      setNewCommunity({ name: "", description: "" });
      setCreateCommunityOpen(false);
      fetchData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create community";
      setError(msg);
      showSnackbar(msg, "error");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          General Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage all communities, users, and platform functions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {stats?.totalUsers || 0}
                  </Typography>
                </Box>
                <GroupIcon
                  sx={{ fontSize: 40, color: "primary.main", opacity: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Communities
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {stats?.totalCommunities || 0}
                  </Typography>
                </Box>
                <LocationCityIcon
                  sx={{ fontSize: 40, color: "success.main", opacity: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Community Admins
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {stats?.activeCommunityAdmins || 0}
                  </Typography>
                </Box>
                <AssignmentIcon
                  sx={{ fontSize: 40, color: "warning.main", opacity: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Platform Health
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, mt: 1, color: "success.main" }}
                  >
                    {stats?.platformHealth || "Good"}
                  </Typography>
                </Box>
                <TrendingUpIcon
                  sx={{ fontSize: 40, color: "info.main", opacity: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seed Data Section */}
      <Paper
        sx={{ p: 3, mb: 4, bgcolor: "#fff3e0", border: "2px dashed #ff9800" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🌱 Seed Sample Data
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Quickly populate all communities with sample investment data for
              testing and demonstration purposes.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="warning"
            startIcon={<CloudUploadIcon />}
            onClick={() => router.push("/admin/seed-investments")}
            sx={{ whiteSpace: "nowrap" }}
          >
            Seed Investments
          </Button>
        </Stack>
      </Paper>

      {/* Communities Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Communities Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateCommunityOpen(true)}
          >
            Create Community
          </Button>
        </Box>

        {/* Notifications handled via Snackbar */}

        <Grid container spacing={3}>
          {communities.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No communities yet. Create one to get started.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            communities.map((community) => (
              <Grid item xs={12} md={6} key={community._id}>
                <Paper
                  sx={{ p: 3, borderLeft: 4, borderLeftColor: "primary.main" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {community.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {community.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={community.status}
                      color={
                        community.status === "Active" ? "success" : "error"
                      }
                      size="small"
                    />
                  </Box>

                  <Box sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Members: {community.memberCount} | Admin:{" "}
                      {community.communityAdmin?.name || "Unassigned"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Enabled Functions:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {Object.entries(community.enabledFunctions).map(
                        ([key, enabled]) => (
                          <Chip
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            color={enabled ? "primary" : "default"}
                            variant={enabled ? "filled" : "outlined"}
                            size="small"
                          />
                        )
                      )}
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        router.push(`/admin/communities/${community._id}`)
                      }
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() =>
                        router.push(
                          `/admin/communities/${community._id}/permissions`
                        )
                      }
                    >
                      Permissions
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Create Community Dialog */}
      <Dialog
        open={createCommunityOpen}
        onClose={() => setCreateCommunityOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Community</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Community Name"
              fullWidth
              value={newCommunity.name}
              onChange={(e) =>
                setNewCommunity((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Tech Innovators"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newCommunity.description}
              onChange={(e) =>
                setNewCommunity((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your community"
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Enabled Functions
              </Typography>
              <Stack spacing={1}>
                {Object.entries(enabledFunctions).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) =>
                          setEnabledFunctions((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                    }
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateCommunityOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCommunity} variant="contained">
            Create Community
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
