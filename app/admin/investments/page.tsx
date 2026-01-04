"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface Investment {
  _id: string;
  title: string;
  amount: number;
  goal: number;
  status: string;
  investors: number;
  createdAt: string;
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchInvestments();
  }, []);

  async function fetchInvestments() {
    try {
      const res = await fetch("/api/investments");
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      }
    } catch (err) {
      console.error("Failed to load investments", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: GridColDef[] = [
    { field: "title", headerName: "Title", width: 250 },
    { field: "amount", headerName: "Amount", width: 120 },
    { field: "goal", headerName: "Goal", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "investors", headerName: "Investors", width: 120 },
    { field: "createdAt", headerName: "Created", width: 180 },
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
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Investments Management
      </Typography>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={investments}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Investment) => row._id}
        />
      </Paper>
    </Container>
  );
}
