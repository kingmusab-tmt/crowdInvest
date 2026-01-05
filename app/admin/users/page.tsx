"use client";

import * as React from "react";
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
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PermissionKey =
  | "canManageUsers"
  | "canManageCommunities"
  | "canManageInvestments"
  | "canManageProposals"
  | "canManageEvents"
  | "canManageAssistance"
  | "canManageKYC"
  | "canManageWithdrawals"
  | "canSuspendUsers"
  | "canAssignCommunityAdmins"
  | "canModifyCommunityFunctions";

interface Permissions {
  [key: string]: boolean;
}

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  community?: { _id: string; name: string } | null;
  permissions?: Permissions;
  image?: string;
}

interface CommunityOption {
  _id: string;
  name: string;
}

const PERMISSION_OPTIONS: { key: PermissionKey; label: string }[] = [
  { key: "canManageKYC", label: "KYC Verification" },
  { key: "canManageInvestments", label: "Investment Approval" },
  { key: "canManageCommunities", label: "Business/Community Approval" },
  { key: "canManageWithdrawals", label: "Withdrawal Approval" },
  { key: "canManageUsers", label: "User Management" },
  { key: "canAssignCommunityAdmins", label: "Assign Community Admins" },
  { key: "canManageProposals", label: "Proposals" },
  { key: "canManageEvents", label: "Events" },
  { key: "canManageAssistance", label: "Assistance" },
  { key: "canModifyCommunityFunctions", label: "Community Config" },
  { key: "canSuspendUsers", label: "Suspend Users" },
];

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentRole = session?.user?.role;
  const currentCommunity = session?.user?.community as string | undefined;
  const currentPerms = (session?.user as any)?.permissions || {};

  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [communities, setCommunities] = React.useState<CommunityOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [editUser, setEditUser] = React.useState<UserRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    role: "User",
    status: "Active",
    community: "",
    permissions: {} as Permissions,
  });

  React.useEffect(() => {
    // Only allow General Admins to access this page
    if (currentRole === "Community Admin") {
      router.push("/admin/community");
      return;
    }
    fetchUsers();
    if (currentRole === "General Admin") {
      fetchCommunities();
    }
  }, [currentRole]);

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

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) return;
      const data = await res.json();
      setCommunities(data.map((c: any) => ({ _id: c._id, name: c.name })));
    } catch (err) {
      console.error("Failed to load communities", err);
    }
  }

  const canTogglePermission = (key: PermissionKey) => {
    if (currentRole === "General Admin") return true;
    return Boolean(currentPerms?.[key]);
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
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
      field: "community",
      headerName: "Community",
      width: 160,
      valueGetter: (params: any) =>
        (params?.row as UserRow)?.community?.name || "-",
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value}
          color={
            value === "General Admin"
              ? "primary"
              : value === "Community Admin"
              ? "secondary"
              : "default"
          }
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
      field: "permissions",
      headerName: "Functions",
      flex: 1,
      renderCell: ({ row }) => {
        const perms = Object.entries(row.permissions || {}).filter(
          ([, v]) => v
        );
        const preview = perms
          .slice(0, 2)
          .map(([k]) => k.replace("canManage", ""))
          .join(", ");
        return (
          <Typography variant="caption" color="text.secondary">
            {perms.length === 0
              ? "None"
              : `${preview}${perms.length > 2 ? "…" : ""}`}
          </Typography>
        );
      },
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
      community: user.community?._id || currentCommunity || "",
      permissions: { ...(user.permissions || {}) },
    });
  };

  const closeEditor = () => {
    setEditUser(null);
    setForm({ role: "User", status: "Active", community: "", permissions: {} });
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
        community: form.community,
        permissions: form.permissions,
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

  const disableGeneralAdminOption = currentRole !== "General Admin";

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
        Users & Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        General Admins can manage all users. Community Admins are limited to
        their community and functions assigned to them.
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

      <Paper sx={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          getRowId={(row: UserRow) => row._id}
        />
      </Paper>

      <Dialog
        open={Boolean(editUser)}
        onClose={closeEditor}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Edit User Access</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Role"
                select
                fullWidth
                size="small"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={
                  editUser?.role === "General Admin" &&
                  currentRole !== "General Admin"
                }
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Community Admin">Community Admin</MenuItem>
                <MenuItem
                  value="General Admin"
                  disabled={disableGeneralAdminOption}
                >
                  General Admin
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Community"
                select
                fullWidth
                size="small"
                value={form.community}
                onChange={(e) =>
                  setForm({ ...form, community: e.target.value })
                }
                disabled={currentRole === "Community Admin"}
              >
                {currentRole === "Community Admin" ? (
                  <MenuItem value={currentCommunity || ""}>
                    {editUser?.community?.name || "My Community"}
                  </MenuItem>
                ) : (
                  communities.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Functions this user can perform
            </Typography>
            <Grid container spacing={1.5}>
              {PERMISSION_OPTIONS.map((opt) => {
                const disabled = !canTogglePermission(opt.key);
                return (
                  <Grid item xs={12} sm={6} md={4} key={opt.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={Boolean(form.permissions?.[opt.key])}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              permissions: {
                                ...form.permissions,
                                [opt.key]: e.target.checked,
                              },
                            })
                          }
                          disabled={disabled || form.role === "User"}
                        />
                      }
                      label={opt.label}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={saving}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {currentRole === "General Admin" || currentPerms?.canManageUsers ? (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={saving || editUser?.role === "General Admin"}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
