"use client";

import * as React from "react";
import { formatNaira } from "@/lib/utils";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSession } from "next-auth/react";
import MemberInvestmentCard from "@/components/MemberInvestmentCard";
import InvestmentSuggestionForm from "@/components/InvestmentSuggestionForm";
import {
  getCommunityInvestments,
  getCommunityInvestmentSuggestions,
} from "@/services/investmentService";

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

interface CommunityInvestment {
  id: string;
  title: string;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  currentValue: number;
  profitOrLoss: number;
  profitOrLossPercentage: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold";
  purchaseDate: string | Date;
}

interface InvestmentSuggestion {
  id: string;
  title: string;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
  description: string;
  reason: string;
  amountRequired: number;
  timeframe: string;
  riskLevel: "Low" | "Medium" | "High";
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  rejectionReason?: string;
  votes?: Array<{
    userId: string | { _id: string; name?: string; email?: string };
    vote: "yes" | "no";
    votedAt: string;
  }>;
  suggestedBy: { name?: string; email?: string } | any;
  createdAt: string;
}

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const [tabValue, setTabValue] = React.useState(0);
  const [communityInvestments, setCommunityInvestments] = React.useState<
    CommunityInvestment[]
  >([]);
  const [suggestions, setSuggestions] = React.useState<InvestmentSuggestion[]>(
    []
  );
  const [allCommunityVotingSuggestions, setAllCommunityVotingSuggestions] =
    React.useState<InvestmentSuggestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [suggestionFormOpen, setSuggestionFormOpen] = React.useState(false);
  const [editingSuggestion, setEditingSuggestion] =
    React.useState<InvestmentSuggestion | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadInvestments = React.useCallback(async () => {
    try {
      setError(null);
      const [investments, suggestions] = await Promise.all([
        getCommunityInvestments(session?.user?.community || ""),
        getCommunityInvestmentSuggestions(session?.user?.community || ""),
      ]);
      setCommunityInvestments(investments as unknown as CommunityInvestment[]);

      // Filter suggestions - all suggestions for display
      const allSuggestions = suggestions as unknown as InvestmentSuggestion[];
      setSuggestions(allSuggestions);

      // Filter only voting suggestions for the voting tab
      const votingSuggestions = allSuggestions.filter(
        (s) => s.status === "Voting" || s.status === "Approved"
      );
      setAllCommunityVotingSuggestions(votingSuggestions);
    } catch (err) {
      console.error("Failed to load investments", err);
      setError("Failed to load investments");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.community]);

  React.useEffect(() => {
    if (session?.user?.community) {
      loadInvestments();
    }
  }, [session?.user?.community, loadInvestments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  };

  const handleEditSuggestion = (suggestion: InvestmentSuggestion) => {
    setEditingSuggestion(suggestion);
    setSuggestionFormOpen(true);
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) {
      return;
    }

    try {
      const res = await fetch(`/api/investments/suggestions/${suggestionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete suggestion");
      }

      // Refresh the suggestions list
      await loadInvestments();
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      setError("Failed to delete suggestion. Please try again.");
    }
  };

  const handleFormClose = () => {
    setSuggestionFormOpen(false);
    setEditingSuggestion(null);
  };

  const handleVote = async (suggestionId: string, vote: "yes" | "no") => {
    try {
      const res = await fetch(
        `/api/investments/suggestions/${suggestionId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to record vote");
      }

      // Refresh the suggestions list to show updated vote counts
      await loadInvestments();
    } catch (error) {
      console.error("Error voting:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to record vote. Please try again."
      );
    }
  };

  const getUserVote = (
    suggestion: InvestmentSuggestion
  ): "yes" | "no" | null => {
    if (!session?.user?.id || !suggestion.votes) return null;

    const userVote = suggestion.votes.find((v) => {
      const userId = typeof v.userId === "string" ? v.userId : v.userId._id;
      return userId === session.user.id;
    });

    return userVote ? userVote.vote : null;
  };

  const getVoteCount = (suggestion: InvestmentSuggestion) => {
    if (!suggestion.votes || suggestion.votes.length === 0) {
      return { yes: 0, no: 0, total: 0 };
    }

    const yesVotes = suggestion.votes.filter((v) => v.vote === "yes").length;
    const noVotes = suggestion.votes.filter((v) => v.vote === "no").length;

    return {
      yes: yesVotes,
      no: noVotes,
      total: suggestion.votes.length,
    };
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const calculateTotalStats = () => {
    return {
      totalInvested: communityInvestments.reduce(
        (sum, inv) => sum + inv.totalInvested,
        0
      ),
      totalCurrentValue: communityInvestments.reduce(
        (sum, inv) => sum + inv.currentValue,
        0
      ),
      totalProfitLoss: communityInvestments.reduce(
        (sum, inv) => sum + inv.profitOrLoss,
        0
      ),
      totalDividends: communityInvestments.reduce(
        (sum, inv) => sum + inv.dividendReceived,
        0
      ),
      activeInvestments: communityInvestments.filter(
        (inv) => inv.status === "Active"
      ).length,
    };
  };

  // Get only suggestions made by current user
  const userSuggestions = suggestions.filter(
    (s) =>
      s.suggestedBy?.email === session?.user?.email ||
      s.suggestedBy?.name === session?.user?.name
  );

  const stats = calculateTotalStats();
  const totalReturn = stats.totalProfitLoss + stats.totalDividends;
  const overallROI =
    stats.totalInvested > 0 ? (totalReturn / stats.totalInvested) * 100 : 0;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 } }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "start",
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Investments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your portfolio and explore investment opportunities
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSuggestionFormOpen(true)}
          >
            Suggest Investment
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall Stats */}
      {communityInvestments.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Total Invested
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1976d2" }}
              >
                {formatNaira(stats.totalInvested, { maximumFractionDigits: 2 })}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Current Value
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#2e7d32" }}
              >
                {formatNaira(stats.totalCurrentValue, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Profit/Loss
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: stats.totalProfitLoss >= 0 ? "#4caf50" : "#f44336",
                }}
              >
                {formatNaira(stats.totalProfitLoss, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Overall ROI
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: overallROI >= 0 ? "#4caf50" : "#f44336",
                }}
              >
                {overallROI >= 0 ? "+" : ""}
                {overallROI.toFixed(2)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Investment tabs"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Tab
            label={`Community Investments (${communityInvestments.length})`}
            id="investment-tab-0"
            aria-controls="investment-tabpanel-0"
          />
          <Tab
            label={`Your Suggestions (${userSuggestions.length})`}
            id="investment-tab-1"
            aria-controls="investment-tabpanel-1"
          />
          <Tab
            label={`Investment Voting (${allCommunityVotingSuggestions.length})`}
            id="investment-tab-2"
            aria-controls="investment-tabpanel-2"
          />
        </Tabs>

        {/* Tab 1: Community Investments */}
        <TabPanel value={tabValue} index={0}>
          {communityInvestments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No community investments yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by suggesting an investment opportunity for your community
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSuggestionFormOpen(true)}
              >
                Suggest Investment
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {communityInvestments.map((investment) => (
                <Grid item xs={12} md={6} lg={4} key={investment.id}>
                  <MemberInvestmentCard {...investment} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Your Investment Suggestions */}
        <TabPanel value={tabValue} index={1}>
          {userSuggestions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No investment suggestions yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Be the first to suggest an investment opportunity
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSuggestionFormOpen(true)}
              >
                Suggest Investment
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {userSuggestions.map((suggestion) => (
                <Paper key={suggestion.id} sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Your Suggestion
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={suggestion.investmentType}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={suggestion.status}
                        size="small"
                        color={
                          suggestion.status === "Voting"
                            ? "success"
                            : suggestion.status === "Approved"
                            ? "warning"
                            : suggestion.status === "Pending"
                            ? "info"
                            : "default"
                        }
                      />
                    </Stack>
                  </Box>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    {suggestion.description}
                  </Typography>

                  <Box
                    sx={{ mb: 2, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Why this is genuine & profitable:
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {suggestion.reason}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Amount Required
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatNaira(suggestion.amountRequired, {
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Timeframe
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {suggestion.timeframe}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
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
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Suggested On
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(suggestion.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Box sx={{ mt: 2, pt: 2 }}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Status Updates:
                    </Typography>
                    {suggestion.status === "Pending" && (
                      <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                        ⏳ Awaiting review by community admin
                      </Alert>
                    )}
                    {suggestion.status === "Approved" && (
                      <Alert severity="success" sx={{ fontSize: "0.875rem" }}>
                        ✓ Approved! Moving to voting phase
                      </Alert>
                    )}
                    {suggestion.status === "Voting" && (
                      <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                        🗳️ Your suggestion is now in voting phase. Community
                        members are reviewing it
                      </Alert>
                    )}
                    {suggestion.status === "Rejected" && (
                      <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
                        ✗ This suggestion was not approved
                        {suggestion.rejectionReason && (
                          <Box
                            sx={{
                              mt: 1,
                              pt: 1,
                              borderTop: "1px solid rgba(211, 47, 47, 0.2)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                display: "block",
                                mb: 0.5,
                              }}
                            >
                              Reason for rejection:
                            </Typography>
                            <Typography variant="caption">
                              {suggestion.rejectionReason}
                            </Typography>
                          </Box>
                        )}
                      </Alert>
                    )}
                  </Box>

                  {/* Action Buttons for Rejected Suggestions */}
                  {suggestion.status === "Rejected" && (
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        gap: 1,
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditSuggestion(suggestion)}
                      >
                        Edit & Resubmit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 3: Investment Voting */}
        <TabPanel value={tabValue} index={2}>
          {allCommunityVotingSuggestions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No investments available for voting
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Check back later when community members submit investment
                suggestions
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {allCommunityVotingSuggestions.map((suggestion) => (
                <Paper
                  key={suggestion.id}
                  sx={{ p: 2, border: "2px solid #1976d2" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Suggested by:{" "}
                        {suggestion.suggestedBy?.name || "Community Member"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={suggestion.investmentType}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={suggestion.status}
                        size="small"
                        color={
                          suggestion.status === "Voting"
                            ? "success"
                            : suggestion.status === "Approved"
                            ? "warning"
                            : "default"
                        }
                      />
                    </Stack>
                  </Box>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    {suggestion.description}
                  </Typography>

                  <Box
                    sx={{ mb: 2, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Why this is genuine & profitable:
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {suggestion.reason}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Amount Required
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatNaira(suggestion.amountRequired, {
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Timeframe
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {suggestion.timeframe}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
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
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Suggested On
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(suggestion.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Box sx={{ mt: 2, pt: 2 }}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: "block", mb: 2, fontWeight: 600 }}
                    >
                      Vote on this investment proposal:
                    </Typography>

                    {/* Vote counts */}
                    {(() => {
                      const voteCounts = getVoteCount(suggestion);
                      const userVote = getUserVote(suggestion);

                      return (
                        <>
                          {voteCounts.total > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Yes: {voteCounts.yes} | No: {voteCounts.no} |
                                  Total: {voteCounts.total}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          <Stack direction="row" spacing={2}>
                            <Button
                              variant={
                                userVote === "yes" ? "contained" : "outlined"
                              }
                              color="success"
                              sx={{ flex: 1 }}
                              onClick={() => handleVote(suggestion.id, "yes")}
                            >
                              👍 Vote Yes
                            </Button>
                            <Button
                              variant={
                                userVote === "no" ? "contained" : "outlined"
                              }
                              color="error"
                              sx={{ flex: 1 }}
                              onClick={() => handleVote(suggestion.id, "no")}
                            >
                              👎 Vote No
                            </Button>
                          </Stack>

                          {userVote && (
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{
                                display: "block",
                                mt: 1,
                                textAlign: "center",
                              }}
                            >
                              You voted:{" "}
                              {userVote === "yes" ? "Yes 👍" : "No 👎"}
                            </Typography>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </TabPanel>
      </Paper>

      {/* Investment Suggestion Form Modal */}
      <InvestmentSuggestionForm
        open={suggestionFormOpen}
        onClose={handleFormClose}
        communityId={session?.user?.community || ""}
        userId={session?.user?.id || ""}
        onSuccess={handleRefresh}
        editingSuggestion={editingSuggestion}
      />
    </Container>
  );
}
