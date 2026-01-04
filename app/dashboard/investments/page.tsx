"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useSession } from "next-auth/react";

interface Investment {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  amount: number;
  goal: number;
  progress: number;
  investors: number;
  status: "Active" | "Funded" | "Completed";
  imageUrl?: string;
  projectedROI?: string;
  term?: string;
  risk: "Low" | "Medium" | "High";
  createdAt: string;
}

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedInvestment, setSelectedInvestment] =
    React.useState<Investment | null>(null);
  const [investDialogOpen, setInvestDialogOpen] = React.useState(false);
  const [investAmount, setInvestAmount] = React.useState("");
  const [investError, setInvestError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleInvestClick = (investment: Investment) => {
    setSelectedInvestment(investment);
    setInvestDialogOpen(true);
    setInvestAmount("");
    setInvestError(null);
  };

  const handleInvest = async () => {
    setInvestError(null);

    const amount = parseFloat(investAmount);
    if (!amount || amount <= 0) {
      setInvestError("Please enter a valid amount");
      return;
    }

    if (!selectedInvestment) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/investments/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investmentId: selectedInvestment._id,
          amount,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process investment");
      }

      setInvestDialogOpen(false);
      setInvestAmount("");
      fetchInvestments();
    } catch (error) {
      setInvestError(
        error instanceof Error ? error.message : "Failed to process investment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "success";
      case "Medium":
        return "warning";
      case "High":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "primary";
      case "Funded":
        return "success";
      case "Completed":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Investment Opportunities
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and invest in community-backed opportunities
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {investments.filter((i) => i.status === "Active").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Opportunities
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: 600 }}
            >
              ₦
              {investments
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invested
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: 600 }}
            >
              {investments.reduce((sum, inv) => sum + inv.investors, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Investors
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Investments Grid */}
      {investments.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No investment opportunities available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back soon for new opportunities!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {investments.map((investment) => (
            <Grid item xs={12} md={6} lg={4} key={investment._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {investment.imageUrl && (
                  <CardMedia
                    component="img"
                    height="180"
                    image={investment.imageUrl}
                    alt={investment.title}
                    sx={{ objectFit: "cover" }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {investment.title}
                    </Typography>
                    <Chip
                      label={investment.status}
                      color={getStatusColor(investment.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {investment.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {investment.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={investment.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        ₦{investment.amount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Goal: ₦{investment.goal.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`${investment.projectedROI || "N/A"} ROI`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<GroupIcon />}
                      label={`${investment.investors} investors`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={investment.risk}
                      color={getRiskColor(investment.risk) as any}
                      size="small"
                    />
                    {investment.term && (
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={investment.term}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleInvestClick(investment)}
                    disabled={investment.status !== "Active"}
                  >
                    {investment.status === "Active"
                      ? "Invest Now"
                      : investment.status}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Invest Dialog */}
      <Dialog
        open={investDialogOpen}
        onClose={() => setInvestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invest in {selectedInvestment?.title}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {investError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {investError}
            </Alert>
          )}

          {selectedInvestment && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedInvestment.longDescription ||
                  selectedInvestment.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Projected ROI
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvestment.projectedROI || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Risk Level
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvestment.risk}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Term
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvestment.term || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Current Investors
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedInvestment.investors}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <TextField
                label="Investment Amount"
                fullWidth
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder="Enter amount in Naira"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                }}
                helperText={`Remaining to goal: ₦${(
                  selectedInvestment.goal - selectedInvestment.amount
                ).toLocaleString()}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInvestDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInvest}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm Investment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
