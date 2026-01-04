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

interface Proposal {
  _id: string;
  title: string;
  status: string;
  acceptedVotes: number;
  rejectedVotes: number;
  createdAt: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error("Failed to load proposals", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: GridColDef[] = [
    { field: "title", headerName: "Title", width: 300 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "acceptedVotes", headerName: "Accept", width: 120 },
    { field: "rejectedVotes", headerName: "Reject", width: 120 },
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
        Proposals Management
      </Typography>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={proposals}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Proposal) => row._id}
        />
      </Paper>
    </Container>
  );
}
