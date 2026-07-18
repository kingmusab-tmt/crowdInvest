"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  community?: { _id: string; name: string } | null;
  image?: string;
}

function UsersPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [editUser, setEditUser] = React.useState<UserRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    role: "User",
    status: "Active",
  });
  const [highlightUserId, setHighlightUserId] = React.useState<string | null>(
    null
  );
  const [noMatchUserId, setNoMatchUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // When arriving via /admin/users?user=<id>, highlight and auto-scroll to that user
  React.useEffect(() => {
    const targetId = searchParams?.get("user");
    if (!targetId || users.length === 0) return;
    const found = users.some((u) => u._id === targetId);
    setHighlightUserId(found ? targetId : null);
    setNoMatchUserId(found ? null : targetId);
  }, [searchParams, users]);

  React.useEffect(() => {
    if (!highlightUserId) return;
    const t = setTimeout(() => {
      const rowEl = document.querySelector(
        `[role="row"][data-id="${highlightUserId}"]`
      ) as HTMLElement | null;
      rowEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightUserId, users]);

  const clearHighlight = () => {
    setHighlightUserId(null);
    setNoMatchUserId(null);
    router.replace("/admin/users");
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{
          alignItems: "center"
        }}>
          <Avatar
            src={(params.row as UserRow).image}
            sx={{ width: 28, height: 28 }}
          />
          <Typography variant="body2">{params.row.name}</Typography>
        </Stack>
      ),
    },
    { field: "email", headerName: "Email", flex: 1.2 },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "Admin" ? "primary" : "default"}
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={value === "Active" ? "success" : "warning"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => openEditor(row as UserRow)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const openEditor = (user: UserRow) => {
    setEditUser(user);
    setForm({
      role: user.role,
      status: user.status,
    });
  };

  const closeEditor = () => {
    setEditUser(null);
    setForm({ role: "User", status: "Active" });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        role: form.role,
        status: form.status,
      };
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      setSuccess("User updated");
      await fetchUsers();
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      setSuccess("User deleted");
      await fetchUsers();
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        Users
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 3
        }}>
        Admins can manage all users.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      {highlightUserId && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={clearHighlight}>
              Clear
            </Button>
          }
        >
          Jumped to user:{" "}
          {users.find((u) => u._id === highlightUserId)?.name ||
            highlightUserId}
        </Alert>
      )}
      {noMatchUserId && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={clearHighlight}>
              Clear
            </Button>
          }
        >
          No match for user ID: {noMatchUserId}
        </Alert>
      )}
      <Paper sx={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          getRowId={(row: UserRow) => row._id}
          getRowClassName={(params) =>
            (params.id as string) === highlightUserId ? "highlighted" : ""
          }
          sx={{
            "& .MuiDataGrid-row.highlighted": {
              backgroundColor: "rgba(255, 243, 224, 0.6)",
              boxShadow: "inset 0 0 0 1px rgba(255, 171, 0, 0.8)",
            },
          }}
        />
      </Paper>
      <Dialog
        open={Boolean(editUser)}
        onClose={closeEditor}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit User Access</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                label="Role"
                select
                fullWidth
                size="small"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                label="Status"
                select
                fullWidth
                size="small"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Restricted">Restricted</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={saving}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            onClick={handleDelete}
            disabled={saving || editUser?.role === "Admin"}
          >
            Delete
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Container>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
