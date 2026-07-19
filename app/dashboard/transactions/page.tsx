"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Stack,
  CircularProgress,
  MenuItem,
  Grid,
  Divider,
  InputAdornment,
  Button,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { formatNaira } from "@/lib/utils";

type StatColor = "primary" | "success" | "error" | "warning" | "info";

interface Transaction {
  _id: string;
  userName: string;
  userEmail: string;
  isAdminTransaction: boolean;
  performedByName?: string;
  type:
    | "Monthly_Contribution"
    | "Investment"
    | "Profit Share"
    | "Assistance"
    | "Event"
    | "profit_deposit"
    | "manual_deposit";
  status: "Completed" | "Pending" | "Failed";
  amount: number;
  date: string;
  createdAt: string;
}

function formatTransactionType(type: string): string {
  return type
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getTypeColor(type: string): StatColor {
  switch (type) {
    case "Monthly_Contribution":
      return "success";
    case "Investment":
      return "primary";
    case "Profit Share":
      return "info";
    case "Assistance":
      return "warning";
    case "profit_deposit":
      return "success";
    case "manual_deposit":
      return "primary";
    default:
      return "info";
  }
}

function getStatusMeta(status: Transaction["status"]) {
  switch (status) {
    case "Completed":
      return { color: "success" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "Failed":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    default:
      return { color: "warning" as StatColor, icon: <HourglassEmptyIcon fontSize="small" /> };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Small presentational helpers -----------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: StatColor;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, height: "100%" }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", mb: 1.5 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme: Theme) => alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function StatusChip({ status }: { status: Transaction["status"] }) {
  const meta = getStatusMeta(status);
  return (
    <Chip
      label={status}
      size="small"
      icon={meta.icon as any}
      sx={{
        fontWeight: 600,
        bgcolor: (theme: Theme) => alpha(theme.palette[meta.color].main, 0.12),
        color: `${meta.color}.main`,
        "& .MuiChip-icon": { color: `${meta.color}.main` },
      }}
    />
  );
}

function TypeChip({ type }: { type: string }) {
  const color = getTypeColor(type);
  return (
    <Chip
      label={formatTransactionType(type)}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderColor: (theme: Theme) => alpha(theme.palette[color].main, 0.4),
        color: `${color}.main`,
      }}
    />
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "action.hover",
          color: "text.disabled",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, mx: "auto" }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const meta = getStatusMeta(transaction.status);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        borderLeft: (theme) => `4px solid ${theme.palette[meta.color].main}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          mb: 1,
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          {formatNaira(transaction.amount)}
        </Typography>
        <StatusChip status={transaction.status} />
      </Box>
      <Box sx={{ mb: 1.5 }}>
        <TypeChip type={transaction.type} />
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
          <PersonIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">
            {transaction.performedByName || transaction.userName} (
            {transaction.isAdminTransaction ? "Admin" : "Member"})
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
          <CalendarTodayIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">{formatDate(transaction.date)}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ---------------------------------------------------------------------------

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [filterType, setFilterType] = React.useState<string>("");
  const [filterStatus, setFilterStatus] = React.useState<string>("");
  const [searchEmail, setSearchEmail] = React.useState<string>("");

  const fetchTransactions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  React.useEffect(() => {
    let filtered = [...transactions];

    if (filterType) {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (searchEmail) {
      filtered = filtered.filter((t) =>
        t.userEmail.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
    setPage(0);
  }, [transactions, filterType, filterStatus, searchEmail]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadCSV = () => {
    const headers = ["Date", "User Email", "Type", "Amount", "Status"];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.userEmail,
      t.type,
      formatNaira(t.amount),
      t.status,
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const completedCount = filteredTransactions.filter(
    (t) => t.status === "Completed"
  ).length;
  const pendingCount = filteredTransactions.filter(
    (t) => t.status === "Pending"
  ).length;

  const hasActiveFilters = !!(filterType || filterStatus || searchEmail);
  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setSearchEmail("");
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 4,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <ReceiptLongIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Transaction History
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              View and track all your transactions
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={<FileDownloadIcon />}
            onClick={downloadCSV}
            disabled={filteredTransactions.length === 0}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<ReceiptLongIcon fontSize="small" />}
            label="Total Transactions"
            value={filteredTransactions.length}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<PaidIcon fontSize="small" />}
            label="Total Amount"
            value={formatNaira(totalAmount, { maximumFractionDigits: 0 })}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<CheckCircleIcon fontSize="small" />}
            label="Completed"
            value={completedCount}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending"
            value={pendingCount}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Search by Email"
              placeholder="user@example.com"
              size="small"
              fullWidth
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
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
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              label="Type"
              size="small"
              fullWidth
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Monthly_Contribution">
                Monthly Contribution
              </MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
              <MenuItem value="Profit Share">Profit Share</MenuItem>
              <MenuItem value="Assistance">Assistance</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
              <MenuItem value="profit_deposit">Profit Deposit</MenuItem>
              <MenuItem value="manual_deposit">Manual Deposit</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              label="Status"
              size="small"
              fullWidth
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              fullWidth
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              sx={{ height: 40 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <EmptyState
            icon={<Inventory2Icon />}
            title="No transactions found"
            description="Try adjusting your filters or make your first transaction"
          />
        </Paper>
      ) : (
        <>
          {/* Mobile: card list */}
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {paginatedTransactions.map((transaction) => (
              <TransactionCard key={transaction._id} transaction={transaction} />
            ))}
          </Stack>

          {/* Desktop: table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              display: { xs: "none", md: "block" },
              borderRadius: 3,
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Transaction By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {transaction.performedByName || transaction.userName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {transaction.isAdminTransaction ? "Admin" : "Member"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TypeChip type={transaction.type} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatNaira(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={transaction.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 3 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
