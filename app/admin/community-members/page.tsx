"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Button,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

export default function CommunityMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = React.useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Active" | "Restricted"
  >("all");
  const [verifiedFilter, setVerifiedFilter] = React.useState<
    "all" | "verified" | "unverified"
  >("all");
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    role: "User",
    permissions: {} as any,
  });

  React.useEffect(() => {
    // Only allow Community Admins to access this page
    if (session && session.user?.role !== "Community Admin") {
      router.push("/dashboard");
      return;
    }
    fetchMembers();
  }, [session, router]);

  React.useEffect(() => {
    // Filter members based on search and filters
    let filtered = members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;
      const matchesVerified =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" && member.kyc?.isVerified) ||
        (verifiedFilter === "unverified" && !member.kyc?.isVerified);
      return matchesSearch && matchesStatus && matchesVerified;
    });
    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, verifiedFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's community and members
      if (session?.user?.email) {
        const userRes = await fetch(`/api/users?email=${session.user.email}`);
        const userData = await userRes.json();

        if (userData.length > 0 && userData[0].community) {
          // Extract community ID - could be string or object with _id
          const communityId =
            typeof userData[0].community === "string"
              ? userData[0].community
              : userData[0].community?._id;

          if (!communityId) {
            setError("Community ID not found");
            return;
          }

          // Fetch community members
          const membersRes = await fetch(
            `/api/communities/${communityId}/members`
          );
          if (membersRes.ok) {
            const membersList = await membersRes.json();
            setMembers(membersList);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const res = await fetch(`/api/users/${selectedMember._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDetailDialogOpen(false);
        setMembers(members.filter((m) => m._id !== selectedMember._id));
        setSelectedMember(null);
      } else {
        alert("Failed to delete member");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Error deleting member");
    }
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;

    try {
      const res = await fetch(`/api/users/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editForm.role,
          permissions:
            editForm.role === "Community Admin" ? editForm.permissions : {},
        }),
      });

      if (res.ok) {
        setEditDialogOpen(false);
        // Refresh members list
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update member");
      }
    } catch (err) {
      console.error("Error updating member:", err);
      alert("Error updating member");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (session?.user?.role !== "Community Admin") {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Community Members
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage members of your community
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Members Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Members ({members.length})
        </Typography>

        {/* Search and Filters */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 3, flexWrap: "wrap", gap: 2 }}
        >
          <TextField
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "textSecondary" }} />
              ),
            }}
            size="small"
            sx={{ flex: 1, minWidth: "250px" }}
          />
          <TextField
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            size="small"
            sx={{ minWidth: "150px" }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Restricted">Restricted</MenuItem>
          </TextField>
          <TextField
            select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as any)}
            size="small"
            sx={{ minWidth: "150px" }}
          >
            <MenuItem value="all">All Verified</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="unverified">Unverified</MenuItem>
          </TextField>
        </Stack>

        {/* Members Table */}
        {filteredMembers.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date Joined</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        size="small"
                        color={member.status === "Active" ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(member.dateJoined).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {member.kyc?.isVerified ? "✓ Verified" : "✗ Unverified"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedMember(member);
                          setDetailDialogOpen(true);
                        }}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="textSecondary">
            {members.length === 0
              ? "No members yet"
              : "No members match your filters"}
          </Typography>
        )}
      </Paper>

      {/* Detail Modal */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Member Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedMember && (
            <Stack spacing={2}>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Name
                </Typography>
                <Typography variant="body1">{selectedMember.name}</Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1">{selectedMember.email}</Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip label={selectedMember.status} size="small" />
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Date Joined
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedMember.dateJoined).toLocaleDateString()}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  KYC Verified
                </Typography>
                <Typography variant="body1">
                  {selectedMember.kyc?.isVerified ? "Yes" : "No"}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Current Role
                </Typography>
                <Typography variant="body1">{selectedMember.role}</Typography>
              </div>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailDialogOpen(false);
              if (selectedMember) {
                setEditForm({
                  role: selectedMember.role,
                  permissions: selectedMember.permissions || {},
                });
              }
              setEditDialogOpen(true);
            }}
            color="primary"
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            onClick={() => {
              if (selectedMember) {
                handleDeleteMember();
              }
            }}
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedMember && (
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={selectedMember.name}
                fullWidth
                disabled
              />
              <TextField
                label="Email"
                value={selectedMember.email}
                fullWidth
                disabled
              />
              <TextField
                select
                label="Role"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
                fullWidth
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Community Admin">Community Admin</MenuItem>
              </TextField>

              {editForm.role === "Community Admin" && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Permissions
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      { key: "canManageUsers", label: "Manage Users" },
                      { key: "canManageKYC", label: "Manage KYC" },
                      {
                        key: "canManageInvestments",
                        label: "Manage Investments",
                      },
                      {
                        key: "canManageWithdrawals",
                        label: "Manage Withdrawals",
                      },
                      { key: "canManageProposals", label: "Manage Proposals" },
                      { key: "canManageEvents", label: "Manage Events" },
                      {
                        key: "canManageCommunities",
                        label: "Manage Communities",
                      },
                    ].map((perm) => (
                      <FormControlLabel
                        key={perm.key}
                        control={
                          <Switch
                            checked={editForm.permissions?.[perm.key] || false}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                permissions: {
                                  ...editForm.permissions,
                                  [perm.key]: e.target.checked,
                                },
                              })
                            }
                          />
                        }
                        label={perm.label}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveMember}
            color="primary"
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
