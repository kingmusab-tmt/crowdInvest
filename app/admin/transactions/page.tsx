"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { formatNaira } from "@/lib/utils";

interface Transaction {
  _id: string;
  userName: string;
  userEmail: string;
  isAdminTransaction: boolean;
  performedByName?: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  description?: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
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
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTransaction(null);
  };

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Transaction By",
      "Role",
      "Email",
      "Type",
      "Amount",
      "Status",
      "Description",
    ];
    const csvData = transactions.map((t) => [
      new Date(t.date).toLocaleString(),
      t.performedByName || t.userName,
      t.isAdminTransaction ? "Admin" : "Member",
      t.userEmail,
      t.type,
      t.amount,
      t.status,
      t.description || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      headerName: "Transaction By",
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.performedByName || params.row.userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.isAdminTransaction ? "Admin" : "Member"}
          </Typography>
        </Box>
      ),
    },
    { field: "userEmail", headerName: "Email", width: 200 },
    { field: "type", headerName: "Type", width: 180 },
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
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleViewDetails(params.row)}
          title="View Details"
        >
          <VisibilityIcon />
        </IconButton>
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
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Transactions Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={downloadCSV}
          disabled={transactions.length === 0}
        >
          Download All
        </Button>
      </Box>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Transaction) => row._id}
        />
      </Paper>

      {/* Transaction Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                  <TableCell>{selectedTransaction._id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell>{formatDate(selectedTransaction.date)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Transaction By</TableCell>
                  <TableCell>
                    {selectedTransaction.performedByName ||
                      selectedTransaction.userName}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell>
                    {selectedTransaction.isAdminTransaction
                      ? "Admin"
                      : "Member"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell>{selectedTransaction.userEmail}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell>{selectedTransaction.type}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatNaira(selectedTransaction.amount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell>
                    <Chip
                      label={selectedTransaction.status}
                      color={getStatusColor(selectedTransaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                {selectedTransaction.description && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell>{selectedTransaction.description}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
