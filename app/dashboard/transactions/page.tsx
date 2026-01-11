"use client";

import * as React from "react";
import {
  Box,
  Container,
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
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Button from "@mui/material/Button";
import { formatNaira } from "@/lib/utils";

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
    | "refund_deposit";
  status: "Completed" | "Pending" | "Failed";
  amount: number;
  date: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Monthly_Contribution":
        return "success";
      case "Investment":
        return "primary";
      case "Profit Share":
        return "info";
      case "Assistance":
        return "secondary";
      case "Event":
        return "default";
      case "profit_deposit":
        return "success";
      case "refund_deposit":
        return "warning";
      default:
        return "default";
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 } }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Transaction History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and track all your transactions
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Transactions
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {filteredTransactions.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Amount
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              {formatNaira(totalAmount)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Search by Email"
              placeholder="user@example.com"
              size="small"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <TextField
              select
              label="Transaction Type"
              size="small"
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
              <MenuItem value="refund_deposit">Refund Deposit</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              size="small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              startIcon={<FileDownloadIcon />}
              variant="outlined"
              onClick={downloadCSV}
              disabled={filteredTransactions.length === 0}
            >
              Download CSV
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or make your first transaction
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Transaction By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
                      <Typography variant="caption" color="text.secondary">
                        {transaction.isAdminTransaction ? "Admin" : "Member"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type}
                      color={getTypeColor(transaction.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatNaira(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Container>
  );
}
