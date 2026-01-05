"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Grid,
  Divider,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`investment-tabpanel-${index}`}
      aria-labelledby={`investment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface InvestmentSuggestion {
  _id: string;
  title: string;
  description: string;
  investmentType: string;
  amountRequired: number;
  timeframe: string;
  riskLevel: string;
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  suggestedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
}

interface Investment {
  _id: string;
  title: string;
  investmentType: string;
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold";
  community: string;
  user?: string;
  currentValue?: number;
  profitOrLoss?: number;
  profitOrLossPercentage?: number;
  purchaseDate?: string;
  description?: string;
  createdAt: string;
}

interface VoteData {
  _id: string;
  suggestionId: string;
  title: string;
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  status: string;
  community: string;
}

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<InvestmentSuggestion[]>(
    []
  );
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [votes, setVotes] = React.useState<VoteData[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialogs
  const [editInvestmentDialog, setEditInvestmentDialog] = React.useState(false);
  const [createInvestmentDialog, setCreateInvestmentDialog] =
    React.useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    React.useState<Investment | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    React.useState<InvestmentSuggestion | null>(null);
  const [rejectionReasonDialog, setRejectionReasonDialog] =
    React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Form states
  const [investmentForm, setInvestmentForm] = React.useState({
    title: "",
    investmentType: "stock",
    basePrice: 0,
    currentPrice: 0,
    quantity: 0,
    totalInvested: 0,
    dividendReceived: 0,
  });

  React.useEffect(() => {
    if (session?.user?.role) {
      loadData();
    }
  }, [session?.user?.role, session?.user?.community]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const isGeneralAdmin = session?.user?.role === "General Admin";
      const queryParams = isGeneralAdmin
        ? ""
        : `?community=${session?.user?.community}`;

      console.log("Loading investments with params:", queryParams);
      console.log("User role:", session?.user?.role);
      console.log("User community:", session?.user?.community);

      const [suggestionsRes, investmentsRes, votesRes] = await Promise.all([
        fetch(`/api/investments/suggestions${queryParams}`),
        fetch(`/api/investments${queryParams}`),
        fetch(`/api/investments/votes${queryParams}`),
      ]);

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        console.log("Fetched suggestions:", data.length);
        setSuggestions(data);
      }
      if (investmentsRes.ok) {
        const data = await investmentsRes.json();
        console.log("Fetched investments:", data.length);
        setInvestments(data);
      } else {
        console.error("Investments fetch failed:", investmentsRes.status);
      }
      if (votesRes.ok) {
        const data = await votesRes.json();
        console.log("Fetched votes:", data.length);
        setVotes(data);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApproveSuggestion = async (suggestion: InvestmentSuggestion) => {
    try {
      const res = await fetch(
        `/api/investments/suggestions/${suggestion._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Approved" }),
        }
      );
      if (res.ok) {
        setSuccess("Suggestion approved");
        loadData();
      }
    } catch (err) {
      setError("Failed to approve suggestion");
    }
  };

  const handleRejectSuggestion = (suggestion: InvestmentSuggestion) => {
    setSelectedSuggestion(suggestion);
    setRejectionReason("");
    setRejectionReasonDialog(true);
  };

  const confirmRejectSuggestion = async () => {
    if (!selectedSuggestion) return;
    try {
      const res = await fetch(
        `/api/investments/suggestions/${selectedSuggestion._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Rejected", rejectionReason }),
        }
      );
      if (res.ok) {
        setSuccess("Suggestion rejected");
        setRejectionReasonDialog(false);
        loadData();
      }
    } catch (err) {
      setError("Failed to reject suggestion");
    }
  };

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setInvestmentForm({
      title: investment.title,
      investmentType: investment.investmentType,
      basePrice: investment.basePrice,
      currentPrice: investment.currentPrice,
      quantity: investment.quantity,
      totalInvested: investment.totalInvested,
      dividendReceived: investment.dividendReceived,
    });
    setEditInvestmentDialog(true);
  };

  const handleSaveInvestment = async () => {
    if (!selectedInvestment) return;
    try {
      const res = await fetch(`/api/investments/${selectedInvestment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(investmentForm),
      });
      if (res.ok) {
        setSuccess("Investment updated");
        setEditInvestmentDialog(false);
        loadData();
      } else {
        setError("Failed to update investment");
      }
    } catch (err) {
      setError("Error updating investment");
    }
  };

  const handleCreateInvestment = async () => {
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...investmentForm,
          community: session?.user?.community,
        }),
      });
      if (res.ok) {
        setSuccess("Investment created");
        setCreateInvestmentDialog(false);
        setInvestmentForm({
          title: "",
          investmentType: "stock",
          basePrice: 0,
          currentPrice: 0,
          quantity: 0,
          totalInvested: 0,
          dividendReceived: 0,
        });
        loadData();
      } else {
        setError("Failed to create investment");
      }
    } catch (err) {
      setError("Error creating investment");
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;
    try {
      const res = await fetch(`/api/investments/${investmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Investment deleted");
        loadData();
      } else {
        setError("Failed to delete investment");
      }
    } catch (err) {
      setError("Error deleting investment");
    }
  };

  const isGeneralAdmin = session?.user?.role === "General Admin";

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Investments Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isGeneralAdmin
            ? "Manage all community investments and suggestions"
            : "Manage your community investments and suggestions"}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Investment management tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Manage Suggestions (${
              suggestions.filter((s) => s.status === "Pending").length
            })`}
            id="investment-tab-0"
            aria-controls="investment-tabpanel-0"
          />
          <Tab
            label={`Active Investments (${investments.length})`}
            id="investment-tab-1"
            aria-controls="investment-tabpanel-1"
          />
          <Tab
            label={`Community Voting (${votes.length})`}
            id="investment-tab-2"
            aria-controls="investment-tabpanel-2"
          />
        </Tabs>

        {/* Tab 1: Manage Suggestions */}
        <TabPanel value={tabValue} index={0}>
          {suggestions.filter((s) => s.status === "Pending").length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No pending investment suggestions
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {suggestions
                .filter((s) => s.status === "Pending")
                .map((suggestion) => (
                  <Card key={suggestion._id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {suggestion.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Suggested by:{" "}
                            {suggestion.suggestedBy?.name || "Community Member"}
                          </Typography>
                        </Box>
                        <Chip
                          label={suggestion.investmentType}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {suggestion.description}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Amount Required
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${suggestion.amountRequired.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Timeframe
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {suggestion.timeframe}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Risk Level
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color:
                                suggestion.riskLevel === "High"
                                  ? "#f44336"
                                  : suggestion.riskLevel === "Medium"
                                  ? "#ff9800"
                                  : "#4caf50",
                            }}
                          >
                            {suggestion.riskLevel}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="textSecondary">
                            Suggested On
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(
                              suggestion.createdAt
                            ).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          color="success"
                          sx={{ flex: 1 }}
                          onClick={() => handleApproveSuggestion(suggestion)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          color="error"
                          sx={{ flex: 1 }}
                          onClick={() => handleRejectSuggestion(suggestion)}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 2: Active Investments */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedInvestment(null);
                setInvestmentForm({
                  title: "",
                  investmentType: "stock",
                  basePrice: 0,
                  currentPrice: 0,
                  quantity: 0,
                  totalInvested: 0,
                  dividendReceived: 0,
                });
                setCreateInvestmentDialog(true);
              }}
            >
              Add Investment
            </Button>
          </Box>

          {investments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No active investments yet
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {investments.map((investment) => (
                <Grid item xs={12} md={6} lg={4} key={investment._id}>
                  <Card>
                    <CardContent>
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
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditInvestment(investment)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDeleteInvestment(investment._id)
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Chip
                        label={investment.investmentType}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />

                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Base Price
                          </Typography>
                          <Typography variant="body2">
                            ${investment.basePrice.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Current Price
                          </Typography>
                          <Typography variant="body2">
                            ${investment.currentPrice.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Quantity
                          </Typography>
                          <Typography variant="body2">
                            {investment.quantity}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Total Invested
                          </Typography>
                          <Typography variant="body2">
                            ${investment.totalInvested.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Dividend Received
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "#4caf50", fontWeight: 600 }}
                          >
                            ${investment.dividendReceived.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Status
                          </Typography>
                          <Chip
                            label={investment.status}
                            size="small"
                            color={
                              investment.status === "Active"
                                ? "success"
                                : "default"
                            }
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Community Voting */}
        <TabPanel value={tabValue} index={2}>
          {votes.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No voting in progress
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {votes.map((vote) => (
                <Card key={vote._id} sx={{ border: "2px solid #1976d2" }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vote.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Status: {vote.status}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${vote.yesVotes} Yes | ${vote.noVotes} No`}
                        color="primary"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block", mb: 1 }}
                      >
                        Voting Progress ({vote.yesVotes + vote.noVotes} of{" "}
                        {vote.totalVoters} voters)
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Box
                          sx={{
                            flex: vote.yesVotes,
                            bgcolor: "#4caf50",
                            height: 24,
                            borderRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            flex: vote.noVotes,
                            bgcolor: "#f44336",
                            height: 24,
                            borderRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            flex: Math.max(
                              0,
                              vote.totalVoters - vote.yesVotes - vote.noVotes
                            ),
                            bgcolor: "#e0e0e0",
                            height: 24,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary">
                          Yes Votes
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "#4caf50", fontWeight: 600 }}
                        >
                          {vote.yesVotes}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary">
                          No Votes
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "#f44336", fontWeight: 600 }}
                        >
                          {vote.noVotes}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="textSecondary">
                          Pending
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "#ff9800", fontWeight: 600 }}
                        >
                          {Math.max(
                            0,
                            vote.totalVoters - vote.yesVotes - vote.noVotes
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>
      </Paper>

      {/* Edit Investment Dialog */}
      <Dialog
        open={editInvestmentDialog}
        onClose={() => setEditInvestmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Investment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={investmentForm.title}
              onChange={(e) =>
                setInvestmentForm({ ...investmentForm, title: e.target.value })
              }
              fullWidth
              disabled
            />
            <TextField
              label="Investment Type"
              value={investmentForm.investmentType}
              fullWidth
              disabled
            />
            <TextField
              label="Base Price"
              type="number"
              value={investmentForm.basePrice}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  basePrice: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Current Price"
              type="number"
              value={investmentForm.currentPrice}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  currentPrice: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Quantity"
              type="number"
              value={investmentForm.quantity}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  quantity: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Total Invested"
              type="number"
              value={investmentForm.totalInvested}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  totalInvested: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Dividend Received"
              type="number"
              value={investmentForm.dividendReceived}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  dividendReceived: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInvestmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveInvestment} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Investment Dialog */}
      <Dialog
        open={createInvestmentDialog}
        onClose={() => setCreateInvestmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Investment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={investmentForm.title}
              onChange={(e) =>
                setInvestmentForm({ ...investmentForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              select
              label="Investment Type"
              value={investmentForm.investmentType}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  investmentType: e.target.value,
                })
              }
              fullWidth
            >
              <option value="stock">Stock</option>
              <option value="business">Business</option>
              <option value="crypto">Crypto</option>
              <option value="real-estate">Real Estate</option>
            </TextField>
            <TextField
              label="Base Price"
              type="number"
              value={investmentForm.basePrice}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  basePrice: parseFloat(e.target.value),
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Current Price"
              type="number"
              value={investmentForm.currentPrice}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  currentPrice: parseFloat(e.target.value),
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Quantity"
              type="number"
              value={investmentForm.quantity}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  quantity: parseFloat(e.target.value),
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Total Invested"
              type="number"
              value={investmentForm.totalInvested}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  totalInvested: parseFloat(e.target.value),
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Dividend Received"
              type="number"
              value={investmentForm.dividendReceived}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  dividendReceived: parseFloat(e.target.value),
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateInvestmentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateInvestment} variant="contained">
            Create Investment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionReasonDialog}
        onClose={() => setRejectionReasonDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Investment Suggestion</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Provide a reason for rejecting this investment suggestion..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionReasonDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmRejectSuggestion}
            variant="contained"
            color="error"
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
