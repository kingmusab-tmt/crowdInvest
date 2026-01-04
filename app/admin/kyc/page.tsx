"use client";

import * as React from "react";
import { Box, Container, Typography, Paper, DataGrid, GridColDef, CircularProgress } from "@mui/material";

interface KYCVerification {
  _id: string;
  userEmail: string;
  idNumber: string;
  status: string;
  submittedAt: string;
}

export default function KYCPage() {
  const [kycRequests, setKYCRequests] = React.useState<KYCVerification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchKYC();
  }, []);

  async function fetchKYC() {
    try {
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const data = await res.json();
        setKYCRequests(data);
      }
    } catch (err) {
      console.error("Failed to load KYC requests", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: GridColDef[] = [
    { field: "userEmail", headerName: "User Email", width: 250 },
    { field: "idNumber", headerName: "ID Number", width: 180 },
    { field: "status", headerName: "Status", width: 150 },
    { field: "submittedAt", headerName: "Submitted", width: 180 },
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
        KYC Verification Management
      </Typography>
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={kycRequests}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row) => row._id}
        />
      </Paper>
    </Container>
  );
}
