"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import GroupsIcon from "@mui/icons-material/Groups";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import SnackbarAlert from "@/components/SnackbarAlert";
import MemberDetailsModal from "./MemberDetailsModal";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  dateJoined?: string;
  lastLogin?: string;
  community?: { _id: string; name: string } | null;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  kyc?: { isVerified?: boolean };
}

const PAGE_SIZE = 8;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(
    null
  );
  const [menuUser, setMenuUser] = React.useState<UserRow | null>(null);

  const [editUser, setEditUser] = React.useState<UserRow | null>(null);
  const [editRole, setEditRole] = React.useState("User");
  const [saving, setSaving] = React.useState(false);

  const [viewUserId, setViewUserId] = React.useState<string | null>(null);

  const [highlightUserId, setHighlightUserId] = React.useState<string | null>(
    null
  );
  const [noMatchUserId, setNoMatchUserId] = React.useState<string | null>(
    null
  );
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [verifiedFilter, setVerifiedFilter] = React.useState("All");
  const [roleFilter, setRoleFilter] = React.useState("All");
  const [stateFilter, setStateFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);

  const { snackbar, closeSnackbar, showError, showSuccess } = useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();

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
      showError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // When arriving via /admin/users?user=<id>, highlight and auto-scroll to that card
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
      cardRefs.current[highlightUserId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightUserId, users]);

  const clearHighlight = () => {
    setHighlightUserId(null);
    setNoMatchUserId(null);
    router.replace("/admin/users");
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, user: UserRow) => {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  const openEditor = (user: UserRow) => {
    setEditUser(user);
    setEditRole(user.role);
    closeMenu();
  };

  const closeEditor = () => {
    setEditUser(null);
    setEditRole("User");
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }
      showSuccess("Member role updated");
      await fetchUsers();
      closeEditor();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: UserRow) => {
    closeMenu();
    openConfirmDialog(
      "Delete Member",
      `Are you sure you want to delete ${user.name}? This will permanently remove them from the database and cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`/api/users/${user._id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete user");
          }
          showSuccess("Member deleted");
          await fetchUsers();
        } catch (err) {
          showError(
            err instanceof Error ? err.message : "Failed to delete user"
          );
        }
      }
    );
  };

  const handleView = (user: UserRow) => {
    setViewUserId(user._id);
    closeMenu();
  };

  const stateOptions = React.useMemo(() => {
    const states = users
      .map((u) => u.address?.state)
      .filter((s): s is string => Boolean(s));
    return Array.from(new Set(states)).sort();
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      const matchesVerified =
        verifiedFilter === "All" ||
        (verifiedFilter === "Verified"
          ? Boolean(u.kyc?.isVerified)
          : !u.kyc?.isVerified);
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesState =
        stateFilter === "All" || u.address?.state === stateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVerified &&
        matchesRole &&
        matchesState
      );
    });
  }, [users, search, statusFilter, verifiedFilter, roleFilter, stateFilter]);

  // Reset to page 1 whenever the filters/search change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, verifiedFilter, roleFilter, stateFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  // Clamp page if the filtered list shrinks (e.g. after a delete)
  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        pt: { xs: 1, sm: 1.5, md: 2 },
        pb: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        Users
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Admins can manage all users.
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        <TextField
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { sm: 220 }, flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Restricted">Restricted</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>KYC</InputLabel>
          <Select
            label="KYC"
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
          >
            <MenuItem value="All">All Members</MenuItem>
            <MenuItem value="Verified">Verified</MenuItem>
            <MenuItem value="Not Verified">Not Verified</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="All">All Roles</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>State</InputLabel>
          <Select
            label="State"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <MenuItem value="All">All States</MenuItem>
            {stateOptions.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

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

      <Grid container spacing={2}>
        {pagedUsers.map((user) => (
          <Grid key={user._id} size={{ xs: 6, md: 3 }}>
            <Card
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current[user._id] = el;
              }}
              sx={{
                position: "relative",
                height: "100%",
                ...(highlightUserId === user._id && {
                  boxShadow: "0 0 0 2px rgba(255, 171, 0, 0.9)",
                }),
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => openMenu(e, user)}
                sx={{ position: "absolute", top: 8, right: 8 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <CardContent>
                <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", mb: 1.5 }}>
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box sx={{ minWidth: 0, width: "100%" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" noWrap sx={{ display: "block" }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ flexWrap: "wrap", justifyContent: "center" }}
                  >
                    <Chip
                      size="small"
                      label={user.role}
                      color={user.role === "Admin" ? "primary" : "default"}
                    />
                    <Chip
                      size="small"
                      label={user.status}
                      color={user.status === "Active" ? "success" : "warning"}
                    />
                    {user.kyc?.isVerified && (
                      <Chip size="small" label="KYC" color="info" variant="outlined" />
                    )}
                  </Stack>
                </Stack>

                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <PhoneIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" noWrap>
                      {user.phoneNumber || "No phone on file"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <PlaceIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" noWrap>
                      {[user.address?.city, user.address?.state]
                        .filter(Boolean)
                        .join(", ") || "No location on file"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <GroupsIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" noWrap>
                      {user.community?.name || "No community"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <EventAvailableIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" noWrap>
                      Joined {formatDate(user.dateJoined || user.createdAt)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <AccessTimeIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" noWrap>
                      Last login{" "}
                      {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredUsers.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {filteredUsers.length === 0 && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography color="textSecondary">No members found.</Typography>
        </Box>
      )}

      {/* Three-dot action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => menuUser && handleView(menuUser)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => menuUser && openEditor(menuUser)}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => menuUser && handleDelete(menuUser)}
          disabled={menuUser?.role === "Admin"}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit role dialog */}
      <Dialog open={Boolean(editUser)} onClose={closeEditor} fullWidth maxWidth="xs">
        <DialogTitle>Edit Member Role</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {editUser?.name} ({editUser?.email})
          </Typography>
          <TextField
            label="Role"
            select
            fullWidth
            size="small"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
          >
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveRole} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmDialog}
        isLoading={dialog.isLoading}
        isDangerous
        confirmButtonText="Delete"
      />

      {/* View details modal */}
      <MemberDetailsModal
        open={Boolean(viewUserId)}
        userId={viewUserId}
        onClose={() => setViewUserId(null)}
        onUserChanged={fetchUsers}
      />

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
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
