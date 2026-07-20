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
  Stack,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}1a`,
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                display: "block",
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, lineHeight: 1.3, wordBreak: "break-word" }}
            >
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Completed":
    case "Approved":
      return "success" as const;
    case "Pending":
      return "warning" as const;
    case "Failed":
    case "Rejected":
      return "error" as const;
    default:
      return "default" as const;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WithdrawalsPage() {
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tab, setTab] = React.useState(0);
  const [withdrawalRequests, setWithdrawalRequests] = React.useState<
    WithdrawalRequest[]
  >([]);
  const [withdrawals, setWithdrawals] = React.useState<Transaction[]>([]);
  const [communityMembers, setCommunityMembers] = React.useState<
    CommunityMember[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const [selectedWithdrawal, setSelectedWithdrawal] =
    React.useState<Transaction | null>(null);
  const [selectedRequest, setSelectedRequest] =
    React.useState<WithdrawalRequest | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null
  );
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
  });

  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
  } = useSnackbar();

  React.useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [withdrawalRequestsRes, withdrawalsRes] = await Promise.all([
        fetch("/api/withdrawals"),
        fetch("/api/transactions?withdrawal=true"),
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
    } catch (err) {
      console.error("Failed to load data", err);
      showError("Failed to load withdrawal data");
    } finally {
      setLoading(false);
    }
  }

  const handleApproveWithdrawal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setApproveConfirmOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    closeSnackbar();

    try {
      const response = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedRequest._id,
          status: "Approved",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve withdrawal");
      }

      showSuccess(
        `Withdrawal approved successfully for ${selectedRequest.userName}`
      );
      setApproveConfirmOpen(false);
      setSelectedRequest(null);
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
    setFormData({
      type: "Investment",
      amount: "",
      recipientEmail: "",
      recipientName: "",
      description: "",
    });
    setCommunityMembers([]);
    fetchCommunityMembers();
    closeSnackbar();
    setCreateDialogOpen(true);
  };

  const fetchCommunityMembers = async () => {
    try {
      const res = await fetch("/api/users");
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
    });
  };

  const handleViewDetails = (withdrawal: Transaction) => {
    setSelectedWithdrawal(withdrawal);
    setDetailsDialogOpen(true);
  };

  const handleDeleteWithdrawal = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setSubmitting(true);
    closeSnackbar();

    try {
      const res = await fetch(`/api/admin/withdrawals?id=${pendingDeleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showSuccess("Withdrawal deleted successfully");
        setDeleteConfirmOpen(false);
        setPendingDeleteId(null);
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

  const stats = React.useMemo(() => {
    const pendingCount = withdrawalRequests.filter(
      (r) => r.status === "Pending"
    ).length;
    const approvedTotal = withdrawalRequests
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + r.amount, 0);
    const rejectedCount = withdrawalRequests.filter(
      (r) => r.status === "Rejected"
    ).length;
    const adminWithdrawalsTotal = withdrawals.reduce(
      (sum, w) => sum + w.amount,
      0
    );
    return { pendingCount, approvedTotal, rejectedCount, adminWithdrawalsTotal };
  }, [withdrawalRequests, withdrawals]);

  const filteredRequests = React.useMemo(() => {
    if (!searchQuery.trim()) return withdrawalRequests;
    const q = searchQuery.toLowerCase();
    return withdrawalRequests.filter(
      (r) =>
        r.userName?.toLowerCase().includes(q) ||
        r.userEmail?.toLowerCase().includes(q)
    );
  }, [withdrawalRequests, searchQuery]);

  const filteredWithdrawals = React.useMemo(() => {
    if (!searchQuery.trim()) return withdrawals;
    const q = searchQuery.toLowerCase();
    return withdrawals.filter(
      (w) =>
        w.userName?.toLowerCase().includes(q) ||
        w.userEmail?.toLowerCase().includes(q) ||
        w.performedByName?.toLowerCase().includes(q)
    );
  }, [withdrawals, searchQuery]);

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      minWidth: 170,
      valueFormatter: (params) => formatDate(params),
    },
    {
      field: "performedBy",
      headerName: "Initiated By",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.performedByName || params.row.userName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Admin
          </Typography>
        </Box>
      ),
    },
    { field: "userName", headerName: "Recipient", flex: 1, minWidth: 150 },
    { field: "userEmail", headerName: "Email", flex: 1, minWidth: 190 },
    { field: "type", headerName: "Type", flex: 1, minWidth: 130 },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 140,
      valueFormatter: (params) => formatNaira(params),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
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

  const requestColumns: GridColDef[] = [
    {
      field: "requestDate",
      headerName: "Request Date",
      flex: 1,
      minWidth: 170,
      valueFormatter: (params) => new Date(params).toLocaleDateString(),
    },
    { field: "userName", headerName: "Member", flex: 1, minWidth: 150 },
    { field: "userEmail", headerName: "Email", flex: 1, minWidth: 190 },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 140,
      valueFormatter: (params) => formatNaira(params),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "processedByName",
      headerName: "Processed By",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 130,
      sortable: false,
      renderCell: (params) =>
        params.row.status === "Pending" ? (
          <Box>
            <IconButton
              size="small"
              color="success"
              onClick={() => handleApproveWithdrawal(params.row)}
              disabled={submitting}
              title="Approve"
            >
              <CheckCircleIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleRejectWithdrawal(params.row)}
              disabled={submitting}
              title="Reject"
            >
              <CancelIcon />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {params.row.status}
          </Typography>
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
    <Container maxWidth="lg" disableGutters={isMobile} sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Stack
        spacing={2}
        sx={{
          mb: 3,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}
          >
            Withdrawals Management
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Initiate and manage community withdrawals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          fullWidth={isMobile}
          size={isMobile ? "large" : "medium"}
        >
          Initiate Withdrawal
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon />}
            label="Pending Requests"
            value={String(stats.pendingCount)}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<CheckCircleIcon />}
            label="Approved Total"
            value={formatNaira(stats.approvedTotal)}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<CancelIcon />}
            label="Rejected Requests"
            value={String(stats.rejectedCount)}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<AccountBalanceWalletIcon />}
            label="Admin Withdrawals"
            value={formatNaira(stats.adminWithdrawalsTotal)}
            color={theme.palette.primary.main}
          />
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 1 }}
        >
          <Tab
            label={`Member Requests (${stats.pendingCount})`}
            {...a11yProps(0)}
          />
          <Tab label="Admin Withdrawals" {...a11yProps(1)} />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {tab === 0 &&
        (isMobile ? (
          <Stack spacing={2}>
            {filteredRequests.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography color="text.secondary">
                  No withdrawal requests found.
                </Typography>
              </Paper>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request._id} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {request.userName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", wordBreak: "break-word" }}
                        >
                          {request.userEmail}
                        </Typography>
                      </Box>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={0.5}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatNaira(request.amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Requested
                        </Typography>
                        <Typography variant="body2">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      {request.processedByName && (
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Processed By
                          </Typography>
                          <Typography variant="body2">
                            {request.processedByName}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                    {request.status === "Pending" && (
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApproveWithdrawal(request)}
                          disabled={submitting}
                        >
                          Approve
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleRejectWithdrawal(request)}
                          disabled={submitting}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Member Withdrawal Requests
            </Typography>
            <DataGrid
              rows={filteredRequests}
              columns={requestColumns}
              getRowId={(row) => row._id}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
            />
          </Paper>
        ))}

      {tab === 1 &&
        (isMobile ? (
          <Stack spacing={2}>
            {filteredWithdrawals.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography color="text.secondary">
                  No admin withdrawals found.
                </Typography>
              </Paper>
            ) : (
              filteredWithdrawals.map((withdrawal) => (
                <Card key={withdrawal._id} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {withdrawal.userName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", wordBreak: "break-word" }}
                        >
                          {withdrawal.userEmail}
                        </Typography>
                      </Box>
                      <Chip
                        label={withdrawal.status}
                        color={getStatusColor(withdrawal.status)}
                        size="small"
                      />
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={0.5}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Type
                        </Typography>
                        <Typography variant="body2">{withdrawal.type}</Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatNaira(withdrawal.amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(withdrawal.date)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Initiated By
                        </Typography>
                        <Typography variant="body2">
                          {withdrawal.performedByName || withdrawal.userName}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(withdrawal)}
                      >
                        Details
                      </Button>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteWithdrawal(withdrawal._id)}
                        disabled={submitting}
                        sx={{ border: "1px solid", borderColor: "error.main" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        ) : (
          <Paper sx={{ borderRadius: 3 }}>
            <DataGrid
              rows={filteredWithdrawals}
              columns={columns}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              getRowId={(row: Transaction) => row._id}
            />
          </Paper>
        ))}

      {/* Create Withdrawal Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
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
                },
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
        <DialogActions sx={{ p: 2 }}>
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
            <Stack spacing={0} divider={<Divider />}>
              {[
                ["Transaction ID", selectedWithdrawal._id],
                ["Date", formatDate(selectedWithdrawal.date)],
                [
                  "Initiated By",
                  `${
                    selectedWithdrawal.performedByName ||
                    selectedWithdrawal.userName
                  } (Admin)`,
                ],
                ["Recipient", selectedWithdrawal.userName],
                ["Email", selectedWithdrawal.userEmail],
                ["Type", selectedWithdrawal.type],
              ].map(([label, value]) => (
                <Stack
                  key={label}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.5}
                  sx={{
                    py: 1.25,
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      wordBreak: "break-word",
                      textAlign: { xs: "left", sm: "right" },
                    }}
                  >
                    {value}
                  </Typography>
                </Stack>
              ))}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0.5}
                sx={{
                  py: 1.25,
                  justifyContent: "space-between",
                  alignItems: { sm: "center" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Amount
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {formatNaira(selectedWithdrawal.amount)}
                </Typography>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0.5}
                sx={{
                  py: 1.25,
                  justifyContent: "space-between",
                  alignItems: { sm: "center" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedWithdrawal.status}
                  color={getStatusColor(selectedWithdrawal.status)}
                  size="small"
                  sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
                />
              </Stack>
              {selectedWithdrawal.description && (
                <Stack sx={{ py: 1.25 }} spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", wordBreak: "break-word" }}
                  >
                    {selectedWithdrawal.description}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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
        <DialogActions sx={{ p: 2 }}>
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

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={approveConfirmOpen}
        onClose={() => !submitting && setApproveConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Approve Withdrawal?</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Typography variant="body2">
              Approve withdrawal of{" "}
              <strong>{formatNaira(selectedRequest.amount)}</strong> for{" "}
              <strong>{selectedRequest.userName}</strong>? This will mark the
              request as approved.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setApproveConfirmOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? "Approving..." : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !submitting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Withdrawal?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently delete the withdrawal record and reverse any
            associated balance and community finance changes. This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete"}
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
