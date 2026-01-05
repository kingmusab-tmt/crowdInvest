"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Community {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  status: string;
  createdAt: string;
  enabledFunctions?: {
    investments: boolean;
    proposals: boolean;
    events: boolean;
    assistance: boolean;
    kyc: boolean;
    withdrawals: boolean;
  };
}

export default function CommunitiesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedCommunity, setSelectedCommunity] =
    React.useState<Community | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
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
    // Only allow General Admins to access this page
    if (session && session.user?.role === "Community Admin") {
      router.push("/admin/community");
      return;
    }
    fetchCommunities();
  }, []);

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error("Failed to load communities", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateOpen = () => {
    setFormData({
      name: "",
      description: "",
      status: "Active",
      enabledFunctions: {
        investments: true,
        proposals: true,
        events: true,
        assistance: true,
        kyc: true,
        withdrawals: true,
      },
    });
    setError(null);
    setSuccess(null);
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (community: Community) => {
    setSelectedCommunity(community);
    setFormData({
      name: community.name,
      description: community.description,
      status: community.status as "Active" | "Suspended",
      enabledFunctions: community.enabledFunctions || {
        investments: true,
        proposals: true,
        events: true,
        assistance: true,
        kyc: true,
        withdrawals: true,
      },
    });
    setError(null);
    setSuccess(null);
    setEditDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("Community name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("Community created successfully");
        setCreateDialogOpen(false);
        fetchCommunities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create community");
      }
    } catch (err) {
      setError("Error creating community");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCommunity) return;
    if (!formData.name.trim()) {
      setError("Community name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/communities/${selectedCommunity._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("Community updated successfully");
        setEditDialogOpen(false);
        fetchCommunities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update community");
      }
    } catch (err) {
      setError("Error updating community");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (community: Community) => {
    if (
      !confirm(
        `Are you sure you want to delete "${community.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/communities/${community._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Community deleted successfully");
        fetchCommunities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete community");
      }
    } catch (err) {
      setError("Error deleting community");
      console.error(err);
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Community Name", width: 250 },
    { field: "description", headerName: "Description", width: 300 },
    { field: "memberCount", headerName: "Members", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "createdAt", headerName: "Created", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEditOpen(params.row)}
            title="Edit Community"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            title="Delete Community"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Create Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Communities Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateOpen}
        >
          Create Community
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Communities Table */}
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={communities}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Community) => row._id}
        />
      </Paper>

      {/* Create Community Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Community</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Community Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "Active" | "Suspended",
                })
              }
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Enabled Features
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.investments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            investments: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Investments"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.proposals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            proposals: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Proposals"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.events}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            events: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Events"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.assistance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            assistance: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Assistance"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.kyc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            kyc: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="KYC Verification"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.withdrawals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            withdrawals: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Withdrawals"
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={saving}>
            {saving ? "Creating..." : "Create Community"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Community Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Community</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Community Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "Active" | "Suspended",
                })
              }
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Enabled Features
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.investments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            investments: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Investments"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.proposals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            proposals: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Proposals"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.events}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            events: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Events"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.assistance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            assistance: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Assistance"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.kyc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            kyc: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="KYC Verification"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.enabledFunctions.withdrawals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enabledFunctions: {
                            ...formData.enabledFunctions,
                            withdrawals: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Withdrawals"
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
