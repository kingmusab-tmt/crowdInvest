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

interface Community {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  status: string;
  createdAt: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchCommunities();
  }, []);

  async function fetchCommunities() {
    try {
      const res = await fetch("/api/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error("Failed to load communities", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: GridColDef[] = [
    { field: "name", headerName: "Community Name", width: 250 },
    { field: "description", headerName: "Description", width: 300 },
    { field: "memberCount", headerName: "Members", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
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
        Communities Management
      </Typography>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={communities}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Community) => row._id}
        />
      </Paper>
    </Container>
  );
}
