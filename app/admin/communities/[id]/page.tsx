"use client";

import * as React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Alert,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Community {
  _id: string;
  name: string;
  description: string;
  generalAdmin: { _id: string; name: string; email: string };
  communityAdmin?: { _id: string; name: string; email: string };
  status: "Active" | "Suspended";
  enabledFunctions: {
    investments: boolean;
    proposals: boolean;
    events: boolean;
    assistance: boolean;
    kyc: boolean;
    withdrawals: boolean;
  };
  memberCount: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
}

export default function CommunityManagement() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = React.useState<Community | null>(null);
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    communityAdmin: null as AdminUser | null,
    status: "Active" as "Active" | "Suspended",
    enabledFunctions: {
      investments: true,
      proposals: true,
      events: true,
      assistance: true,
      kyc: true,
      withdrawals: true,
    },
  });

  React.useEffect(() => {
    fetchData();
  }, [communityId]);

  async function fetchData() {
    try {
      setLoading(true);
      const [communityRes, adminUsersRes] = await Promise.all([
        fetch(`/api/communities/${communityId}`),
        fetch(`/api/admin/users?role=Community%20Admin`),
      ]);

      if (communityRes.ok) {
        const communityData = await communityRes.json();
        setCommunity(communityData);
        setFormData({
          name: communityData.name,
          description: communityData.description,
          communityAdmin: communityData.communityAdmin || null,
          status: communityData.status,
          enabledFunctions: communityData.enabledFunctions,
        });
      }

      if (adminUsersRes.ok) {
        const adminUsersData = await adminUsersRes.json();
        setAdminUsers(adminUsersData);
      }
    } catch (err) {
      console.error("Failed to load community data", err);
      setError("Failed to load community data");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          communityAdmin: formData.communityAdmin?._id,
          status: formData.status,
          enabledFunctions: formData.enabledFunctions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update community");
      }

      setSuccess("Community updated successfully");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update community"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!community) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">Community not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin")}
        sx={{ mb: 3 }}
      >
        Back to Admin Dashboard
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Manage Community: {community.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Community Name"
            fullWidth
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as "Active" | "Suspended",
                }))
              }
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            options={adminUsers}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={formData.communityAdmin}
            onChange={(_, value) =>
              setFormData((prev) => ({ ...prev, communityAdmin: value }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Community Admin" />
            )}
          />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Enabled Functions
            </Typography>
            <Stack spacing={1}>
              {Object.entries(formData.enabledFunctions).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          enabledFunctions: {
                            ...prev.enabledFunctions,
                            [key]: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outlined" onClick={() => router.push("/admin")}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
