"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Stack,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSession } from "next-auth/react";
import { formatNaira } from "@/lib/utils";

interface Transaction {
  _id: string;
  userName: string;
  userEmail: string;
  performedByName?: string;
  isAdminTransaction: boolean;
  type: "Investment" | "Profit Share" | "Assistance" | "Event";
  amount: number;
  status: string;
  description?: string;
  date: string;
  createdAt: string;
}

interface Community {
  _id: string;
  name: string;
}

interface CommunityMember {
  _id: string;
  name: string;
  email: string;
}

export default function WithdrawalsPage() {
  const { data: session } = useSession();
  const [withdrawals, setWithdrawals] = React.useState<Transaction[]>([]);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [communityMembers, setCommunityMembers] = React.useState<CommunityMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    React.useState<Transaction | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    type: "Investment" as
      | "Investment"
      | "Profit Share"
      | "Assistance"
      | "Event",
    amount: "",
    recipientEmail: "",
    recipientName: "",
    description: "",
    communityId: "",
  });

  const isGeneralAdmin = session?.user?.role === "General Admin";

  React.useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [withdrawalsRes, communitiesRes] = await Promise.all([
        fetch("/api/transactions?withdrawal=true"),
        isGeneralAdmin ? fetch("/api/communities") : Promise.resolve(null),
      ]);

      if (withdrawalsRes.ok) {
        const data = await withdrawalsRes.json();
        // Filter for admin withdrawal transactions
        const adminWithdrawals = data.filter(
          (t: Transaction) =>
            t.isAdminTransaction &&
            ["Investment", "Profit Share", "Assistance", "Event"].includes(
              t.type
            )
        );
        setWithdrawals(adminWithdrawals);
      }

      if (isGeneralAdmin && communitiesRes?.ok) {
        const commData = await communitiesRes.json();
        setCommunities(commData);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load withdrawal data");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreateDialog = () => {
    const communityId = isGeneralAdmin ? "" : session?.user?.community || "";
    setFormData({
      type: "Investment",
      amount: "",
      recipientEmail: "",
      recipientName: "",
      description: "",
      communityId: communityId,
    });
    setCommunityMembers([]);
    if (communityId) {
      fetchCommunityMembers(communityId);
    }
    setError(null);
    setCreateDialogOpen(true);
  };

  const fetchCommunityMembers = async (communityId: string) => {
    try {
      const res = await fetch(`/api/users?communityId=${communityId}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityMembers(
          Array.isArray(data)
            ? data.map((u: any) => ({ _id: u._id, name: u.name, email: u.email }))
            : []
        );
      }
    } catch (err) {
      console.error("Failed to fetch community members", err);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({
      type: "Investment",
      amount: "",
      recipientEmail: "",
      recipientName: "",
      description: "",
      communityId: "",
    });
  };

  const handleViewDetails = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setDetailsDialogOpen(true);
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this withdrawal?")) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/withdrawals?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Withdrawal deleted successfully");
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete withdrawal");
      }
    } catch (err) {
      setError("Error deleting withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    // Validate required fields based on type
    if (!formData.amount) {
      setError("Amount is required");
      return;
    }

    if (!formData.description) {
      setError("Description is required");
      return;
    }

    const needsRecipient = formData.type === "Profit Share" || formData.type === "Assistance";
    if (needsRecipient && !formData.recipientName) {
      setError("Recipient name is required for this withdrawal type");
      return;
    }

    if (needsRecipient && !formData.recipientEmail) {
      setError("Recipient email is required for this withdrawal type");
      return;
    }

    if (isGeneralAdmin && !formData.communityId) {
      setError("Please select a community");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          description: formData.description,
          communityId: formData.communityId || session?.user?.community,
          performedBy: session?.user?.name,
        }),
      });

      if (res.ok) {
        setSuccess("Withdrawal initiated successfully");
        handleCloseCreateDialog();
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to initiate withdrawal");
      }
    } catch (err) {
      setError("Error initiating withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      case "Failed":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      width: 180,
      valueFormatter: (params) => formatDate(params),
    },
    {
      field: "performedBy",
      headerName: "Initiated By",
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.performedByName || params.row.userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin
          </Typography>
        </Box>
      ),
    },
    { field: "userName", headerName: "Recipient", width: 180 },
    { field: "userEmail", headerName: "Email", width: 200 },
    { field: "type", headerName: "Type", width: 150 },
    {
      field: "amount",
      headerName: "Amount",
      width: 150,
      valueFormatter: (params) => formatNaira(params),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleViewDetails(params.row)}
            title="View Details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteWithdrawal(params.row._id)}
            title="Delete Withdrawal"
            disabled={submitting}
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Withdrawals Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Initiate and manage community withdrawals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Initiate Withdrawal
        </Button>
      </Box>

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

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={withdrawals}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Transaction) => row._id}
        />
      </Paper>

      {/* Create Withdrawal Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Initiate Withdrawal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              label="Withdrawal Type"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as any;
                setFormData({
                  ...formData,
                  type: newType,
                  recipientName: "",
                  recipientEmail: "",
                });
              }}
              fullWidth
              required
            >
              <MenuItem value="Investment">Investment Withdrawal</MenuItem>
              <MenuItem value="Profit Share">
                Profit Share Distribution
              </MenuItem>
              <MenuItem value="Assistance">Assistance Payment</MenuItem>
              <MenuItem value="Event">Event Expense</MenuItem>
            </TextField>

            {isGeneralAdmin && (
              <TextField
                select
                label="Community"
                value={formData.communityId}
                onChange={(e) => {
                  const newCommunityId = e.target.value;
                  setFormData({ ...formData, communityId: newCommunityId });
                  if (newCommunityId) {
                    fetchCommunityMembers(newCommunityId);
                  }
                }}
                fullWidth
                required
              >
                {communities.map((community) => (
                  <MenuItem key={community._id} value={community._id}>
                    {community.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {(formData.type === "Profit Share" || formData.type === "Assistance") && (
              <TextField
                select
                label="Recipient Name"
                value={formData.recipientName}
                onChange={(e) => {
                  const selectedMember = communityMembers.find(
                    (m) => m.name === e.target.value
                  );
                  setFormData({
                    ...formData,
                    recipientName: e.target.value,
                    recipientEmail: selectedMember?.email || "",
                  });
                }}
                fullWidth
                required
              >
                <MenuItem value="">Select a member</MenuItem>
                {communityMembers.map((member) => (
                  <MenuItem key={member._id} value={member.name}>
                    {member.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {(formData.type === "Profit Share" || formData.type === "Assistance") && (
              <TextField
                label="Recipient Email"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, recipientEmail: e.target.value })
                }
                fullWidth
                disabled
                helperText="Auto-populated from selected recipient"
              />
            )}

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
              }}
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
              required
              placeholder="Enter detailed description of this withdrawal..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitWithdrawal}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Processing..." : "Initiate Withdrawal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdrawal Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Withdrawal Details</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                  <TableCell>{selectedWithdrawal._id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell>{formatDate(selectedWithdrawal.date)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Initiated By</TableCell>
                  <TableCell>
                    {selectedWithdrawal.performedByName ||
                      selectedWithdrawal.userName}{" "}
                    (Admin)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Recipient</TableCell>
                  <TableCell>{selectedWithdrawal.userName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell>{selectedWithdrawal.userEmail}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell>{selectedWithdrawal.type}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatNaira(selectedWithdrawal.amount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell>
                    <Chip
                      label={selectedWithdrawal.status}
                      color={getStatusColor(selectedWithdrawal.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {selectedWithdrawal.description && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell>{selectedWithdrawal.description}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
