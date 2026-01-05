"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { useSession } from "next-auth/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import VerifiedIcon from "@mui/icons-material/Verified";

interface KYCUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string;
  community: string;
  communityId: string;
  dateJoined: string;
  status: string;
  profile: {
    dateOfBirth?: string;
    placeOfWork?: string;
    phoneNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
    maritalStatus?: string;
    nextOfKin?: {
      name?: string;
      relationship?: string;
      phoneNumber?: string;
      email?: string;
      address?: string;
    };
  };
  kyc: {
    isVerified: boolean;
    submittedAt: string;
    verifiedAt: string;
    verificationNotes: string;
    rejectionReason: string;
    rejectionDate: string;
    idType: string;
    idNumber: string;
  };
}

export default function KYCPage() {
  const { data: session } = useSession();
  const [kycUsers, setKYCUsers] = React.useState<KYCUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState<KYCUser | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = React.useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = React.useState(false);
  const [verificationNotes, setVerificationNotes] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<
    "all" | "verified" | "pending"
  >("all");

  React.useEffect(() => {
    fetchKYCUsers();
  }, []);

  async function fetchKYCUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/kyc");
      if (res.ok) {
        const data = await res.json();
        setKYCUsers(data);
      } else {
        setError("Failed to load KYC users");
      }
    } catch (err) {
      console.error("Failed to load KYC users", err);
      setError("Failed to load KYC users");
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyClick = (user: KYCUser) => {
    setSelectedUser(user);
    setVerificationNotes("");
    setRejectionReason("");
    setVerifyDialogOpen(true);
  };

  const handleRejectClick = () => {
    setVerifyDialogOpen(false);
    setRejectionDialogOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedUser) return;

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          isVerified: true,
          verificationNotes: verificationNotes,
        }),
      });

      if (res.ok) {
        setSuccess(`KYC for ${selectedUser.name} verified successfully!`);
        setVerifyDialogOpen(false);
        setTimeout(() => {
          setSuccess(null);
          setFilterStatus("all"); // Reset filter to show updated status
          fetchKYCUsers();
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to process KYC");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process KYC");
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          isVerified: false,
          rejectionReason: rejectionReason,
        }),
      });

      if (res.ok) {
        setSuccess(
          `KYC for ${selectedUser.name} rejected and notification sent!`
        );
        setRejectionDialogOpen(false);
        setVerifyDialogOpen(false);
        setTimeout(() => {
          setFilterStatus("all"); // Reset filter to show updated status
          setSuccess(null);
          fetchKYCUsers();
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to process KYC");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process KYC");
    } finally {
      setVerifying(false);
    }
  };

  const filteredUsers = kycUsers.filter((user) => {
    if (filterStatus === "verified") return user.kyc?.isVerified;
    if (filterStatus === "pending") return !user.kyc?.isVerified;
    return true;
  });

  const verifiedCount = kycUsers.filter((u) => u.kyc?.isVerified).length;
  const pendingCount = kycUsers.filter((u) => !u.kyc?.isVerified).length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          KYC Verification Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify new members who have completed their onboarding
        </Typography>
      </Box>

      {/* Status Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {kycUsers.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Members
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#2e7d32" }}>
              {verifiedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Verified
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#e65100" }}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {kycUsers.length > 0
                ? ((verifiedCount / kycUsers.length) * 100).toFixed(0)
                : 0}
              %
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Verified Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small">
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterStatus}
            label="Filter"
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "verified" | "pending")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="pending">Pending Verification</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KYC Users Grid */}
      {filteredUsers.length === 0 ? (
        <Alert severity="info">
          {filterStatus === "all"
            ? "No members found"
            : filterStatus === "verified"
            ? "No verified members yet"
            : "No pending verifications"}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  border: user.kyc?.isVerified
                    ? "2px solid #2e7d32"
                    : "1px solid #e0e0e0",
                }}
              >
                {/* Verified Badge */}
                {user.kyc?.isVerified && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "#2e7d32",
                      color: "white",
                      borderRadius: "50%",
                      p: 1,
                    }}
                  >
                    <VerifiedIcon sx={{ fontSize: 20 }} />
                  </Box>
                )}

                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.name}
                      sx={{ width: 64, height: 64 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={user.community} size="small" />
                      </Box>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Stack spacing={1}>
                    {user.kyc?.isVerified ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Verified"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<PendingActionsIcon />}
                        label="Pending"
                        color="warning"
                        size="small"
                      />
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">
                        {user.profile?.phoneNumber || "Not provided"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2">
                        {user.profile?.address?.city},{" "}
                        {user.profile?.address?.country || "Not provided"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Joined
                      </Typography>
                      <Typography variant="body2">
                        {new Date(user.dateJoined).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                {!user.kyc?.isVerified && (
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleVerifyClick(user)}
                      fullWidth
                    >
                      Review & Verify
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Profile Review Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Review Profile: {selectedUser?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Check the information below to verify this member
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {selectedUser && (
            <Stack spacing={3}>
              {/* Profile Image */}
              <Box sx={{ textAlign: "center" }}>
                <Avatar
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  sx={{ width: 120, height: 120, mx: "auto", mb: 1 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.email}
                </Typography>
                <Chip
                  label={selectedUser.community}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider />

              {/* Personal Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Personal Information
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: "40%" }}>
                          Date of Birth
                        </TableCell>
                        <TableCell>
                          {selectedUser.profile?.dateOfBirth
                            ? new Date(
                                selectedUser.profile.dateOfBirth
                              ).toLocaleDateString()
                            : "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Marital Status
                        </TableCell>
                        <TableCell>
                          {selectedUser.profile?.maritalStatus ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Place of Work
                        </TableCell>
                        <TableCell>
                          {selectedUser.profile?.placeOfWork || "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        <TableCell>
                          {selectedUser.profile?.phoneNumber || "Not provided"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Address */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Address
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: "40%" }}>
                          Street
                        </TableCell>
                        <TableCell>
                          {selectedUser.profile?.address?.street ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                        <TableCell>
                          {selectedUser.profile?.address?.city ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                        <TableCell>
                          {selectedUser.profile?.address?.state ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                        <TableCell>
                          {selectedUser.profile?.address?.country ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Postal Code
                        </TableCell>
                        <TableCell>
                          {selectedUser.profile?.address?.postalCode ||
                            "Not provided"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Next of Kin */}
              {selectedUser.profile?.nextOfKin?.name && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Emergency Contact
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, width: "40%" }}>
                            Name
                          </TableCell>
                          <TableCell>
                            {selectedUser.profile?.nextOfKin?.name}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Relationship
                          </TableCell>
                          <TableCell>
                            {selectedUser.profile?.nextOfKin?.relationship}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                          <TableCell>
                            {selectedUser.profile?.nextOfKin?.phoneNumber}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell>
                            {selectedUser.profile?.nextOfKin?.email}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Divider />

              {/* Verification Notes */}
              <Box>
                <TextField
                  label="Verification Notes (Optional)"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add any notes about this verification"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectClick}
            variant="outlined"
            color="error"
            disabled={verifying}
          >
            Reject
          </Button>
          <Button
            onClick={handleVerifySubmit}
            variant="contained"
            color="success"
            disabled={verifying}
          >
            {verifying ? <CircularProgress size={24} /> : "Verify Member"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reject KYC Verification
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Please provide a reason for rejecting this member's KYC
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="E.g., ID photo is unclear, Information does not match, etc."
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRejectionDialogOpen(false);
              setVerifyDialogOpen(true);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={verifying || !rejectionReason.trim()}
          >
            {verifying ? <CircularProgress size={24} /> : "Reject & Notify"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
