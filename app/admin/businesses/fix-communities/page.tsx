"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export default function FixCommunitiesPage() {
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [checkResult, setCheckResult] = React.useState<any>(null);
  const [fixResult, setFixResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const checkBusinesses = async () => {
    try {
      setChecking(true);
      setError(null);
      const res = await fetch("/api/businesses/fix-communities");
      if (!res.ok) throw new Error("Failed to check businesses");
      const data = await res.json();
      setCheckResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check businesses"
      );
    } finally {
      setChecking(false);
    }
  };

  const fixBusinesses = async () => {
    if (
      !confirm(
        "This will update all businesses without a community field. Continue?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFixResult(null);
      const res = await fetch("/api/businesses/fix-communities", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to fix businesses");
      const data = await res.json();
      setFixResult(data.results);
      // Refresh check
      await checkBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fix businesses");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkBusinesses();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Fix Business Communities
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          This tool fixes businesses that don't have a community assigned. It
          looks up each business owner and assigns the community from their user
          profile.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {checkResult && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Current Status
            </Typography>
            <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
              <Chip
                label={`Total Businesses: ${checkResult.total}`}
                color="default"
                variant="outlined"
              />
              <Chip
                label={`Need Fixing: ${checkResult.withoutCommunity}`}
                color={checkResult.withoutCommunity > 0 ? "warning" : "success"}
                icon={
                  checkResult.withoutCommunity > 0 ? (
                    <ErrorIcon />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              />
              <Chip
                label={`Already OK: ${checkResult.withCommunity}`}
                color="success"
                icon={<CheckCircleIcon />}
              />
            </Box>

            {checkResult.businessesNeedingFix &&
              checkResult.businessesNeedingFix.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Businesses Needing Fix:
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Business Name</TableCell>
                          <TableCell>Owner Email</TableCell>
                          <TableCell>Owner Name</TableCell>
                          <TableCell>Created</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {checkResult.businessesNeedingFix.map(
                          (business: any) => (
                            <TableRow key={business._id}>
                              <TableCell>{business.name}</TableCell>
                              <TableCell>{business.ownerEmail}</TableCell>
                              <TableCell>{business.ownerName}</TableCell>
                              <TableCell>
                                {new Date(
                                  business.createdAt
                                ).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={checkBusinesses}
            disabled={checking}
            startIcon={checking ? <CircularProgress size={16} /> : null}
          >
            {checking ? "Checking..." : "Refresh Check"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={fixBusinesses}
            disabled={
              loading || !checkResult || checkResult.withoutCommunity === 0
            }
            startIcon={loading ? <CircularProgress size={16} /> : <BuildIcon />}
          >
            {loading ? "Fixing..." : "Fix Businesses"}
          </Button>
        </Box>
      </Paper>

      {fixResult && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fix Results
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Chip
              label={`Total Processed: ${fixResult.total}`}
              color="default"
            />
            <Chip label={`Updated: ${fixResult.updated}`} color="success" />
            <Chip label={`Failed: ${fixResult.failed}`} color="error" />
          </Box>

          {fixResult.details && fixResult.details.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Details:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Business Name</TableCell>
                      <TableCell>Owner Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Community</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fixResult.details.map((detail: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{detail.businessName}</TableCell>
                        <TableCell>{detail.ownerEmail}</TableCell>
                        <TableCell>
                          <Chip
                            label={detail.status}
                            size="small"
                            color={
                              detail.status === "updated" ? "success" : "error"
                            }
                          />
                        </TableCell>
                        <TableCell>{detail.communitySet || "-"}</TableCell>
                        <TableCell>
                          {detail.reason || detail.error || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}
    </Container>
  );
}
