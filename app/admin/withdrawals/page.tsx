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
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSession } from "next-auth/react";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

interface WithdrawalRequest {
  _id: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  processedDate?: string;
  processedByName?: string;
  rejectionReason?: string;
  description?: string;
}

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

function a11yProps(index: number) {
  return {
    id: `withdrawal-tab-${index}`,
    "aria-controls": `withdrawal-tabpanel-${index}`,
  };
}

export default function WithdrawalsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = React.useState(0);
  const [withdrawalRequests, setWithdrawalRequests] = React.useState<
    WithdrawalRequest[]
  >([]);
  const [withdrawals, setWithdrawals] = React.useState<Transaction[]>([]);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [communityMembers, setCommunityMembers] = React.useState<
    CommunityMember[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    React.useState<Transaction | null>(null);
  const [selectedRequest, setSelectedRequest] =
    React.useState<WithdrawalRequest | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

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

  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();

  const isGeneralAdmin = session?.user?.role === "General Admin";

  React.useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [withdrawalRequestsRes, withdrawalsRes, communitiesRes] =
        await Promise.all([
          fetch("/api/withdrawals"),
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

      if (withdrawalRequestsRes.ok) {
        const requestsData = await withdrawalRequestsRes.json();
        setWithdrawalRequests(requestsData);
      }

      if (isGeneralAdmin && communitiesRes?.ok) {
        const commData = await communitiesRes.json();
        setCommunities(commData);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      showError("Failed to load withdrawal data");
    } finally {
      setLoading(false);
    }
  }
  const handleApproveWithdrawal = async (request: WithdrawalRequest) => {
    if (
      !window.confirm(
        `Approve withdrawal of ${formatNaira(request.amount)} for ${
          request.userName
        }?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    closeSnackbar();

    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: request._id,
          status: "Approved",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve withdrawal");
      }

      showSuccess(`Withdrawal approved successfully for ${request.userName}`);
      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectWithdrawal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
    setRejectionReason("");
  };

  const handleConfirmRejection = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    closeSnackbar();

    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedRequest._id,
          status: "Rejected",
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject withdrawal");
      }

      showSuccess(`Withdrawal rejected for ${selectedRequest.userName}`);
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
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
    closeSnackbar();
    setCreateDialogOpen(true);
  };

  const fetchCommunityMembers = async (communityId: string) => {
    try {
      const res = await fetch(`/api/users?communityId=${communityId}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityMembers(
          Array.isArray(data)
            ? data.map((u: any) => ({
                _id: u._id,
                name: u.name,
                email: u.email,
              }))
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
    closeSnackbar();

    try {
      const res = await fetch(`/api/admin/withdrawals?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showSuccess("Withdrawal deleted successfully");
        fetchData();
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to delete withdrawal");
      }
    } catch (err) {
      showError("Error deleting withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    // Validate required fields based on type
    if (!formData.amount) {
      showError("Amount is required");
      return;
    }

    if (!formData.description) {
      showError("Description is required");
      return;
    }

    const needsRecipient =
      formData.type === "Profit Share" || formData.type === "Assistance";
    if (needsRecipient && !formData.recipientName) {
      showError("Recipient name is required for this withdrawal type");
      return;
    }

    if (needsRecipient && !formData.recipientEmail) {
      showError("Recipient email is required for this withdrawal type");
      return;
    }

    if (isGeneralAdmin && !formData.communityId) {
      showError("Please select a community");
      return;
    }

    setSubmitting(true);
    closeSnackbar();

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
        showSuccess("Withdrawal initiated successfully");
        handleCloseCreateDialog();
        fetchData();
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to initiate withdrawal");
      }
    } catch (err) {
      showError("Error initiating withdrawal");
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
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
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
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
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
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab
            label={`Member Requests (${
              withdrawalRequests.filter((r) => r.status === "Pending").length
            })`}
            {...a11yProps(0)}
          />
          <Tab label="Admin Withdrawals" {...a11yProps(1)} />
        </Tabs>
      </Paper>
      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Member Withdrawal Requests
          </Typography>
          <DataGrid
            rows={withdrawalRequests}
            columns={[
              {
                field: "requestDate",
                headerName: "Request Date",
                width: 180,
                valueFormatter: (params) =>
                  new Date(params).toLocaleDateString(),
              },
              { field: "userName", headerName: "Member", width: 180 },
              { field: "userEmail", headerName: "Email", width: 200 },
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
                    color={
                      params.value === "Pending"
                        ? "warning"
                        : params.value === "Approved"
                        ? "success"
                        : "error"
                    }
                    size="small"
                  />
                ),
              },
              {
                field: "processedByName",
                headerName: "Processed By",
                width: 150,
              },
              {
                field: "actions",
                headerName: "Actions",
                width: 200,
                sortable: false,
                renderCell: (params) => (
                  <Box>
                    {params.row.status === "Pending" ? (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveWithdrawal(params.row)}
                          disabled={submitting}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRejectWithdrawal(params.row)}
                          disabled={submitting}
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{
                        color: "text.secondary"
                      }}>
                        {params.row.status}
                      </Typography>
                    )}
                  </Box>
                ),
              },
            ]}
            getRowId={(row) => row._id}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            // disableSelectionOnClick
          />
        </Paper>
      )}
      {tab === 1 && (
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
      )}
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

            {(formData.type === "Profit Share" ||
              formData.type === "Assistance") && (
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

            {(formData.type === "Profit Share" ||
              formData.type === "Assistance") && (
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
              slotProps={{
                input: {
                  startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                }
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
      {/* Rejection Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Withdrawal Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to reject the withdrawal request from{" "}
                <strong>{selectedRequest.userName}</strong> for{" "}
                <strong>{formatNaira(selectedRequest.amount)}</strong>?
              </Typography>
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this withdrawal is being rejected..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setApprovalDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRejection}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}
