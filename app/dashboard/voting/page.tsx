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
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ArticleIcon from "@mui/icons-material/Article";
import { useSession } from "next-auth/react";

interface VotingItem {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "voting"
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Voting";
  votes?: Array<{ userId: string; vote: string; votedAt: string }>;
  createdAt: string;
  updatedAt: string;
  itemType: "proposal" | "investment" | "assistance";
  assistanceType?: string;
  investmentType?: string;
  amountRequired?: number;
  riskLevel?: string;
}

export default function VotingProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = React.useState<VotingItem[]>([]);
  const [investments, setInvestments] = React.useState<VotingItem[]>([]);
  const [assistance, setAssistance] = React.useState<VotingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<VotingItem | null>(
    null
  );
  const [voteDialogOpen, setVoteDialogOpen] = React.useState(false);
  const [voteChoice, setVoteChoice] = React.useState<string>("");
  const [voteError, setVoteError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userVotes, setUserVotes] = React.useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = React.useState(0);

  React.useEffect(() => {
    fetchAllVotingItems();
  }, []);

  async function fetchAllVotingItems() {
    try {
      // Fetch proposals
      const proposalsRes = await fetch("/api/proposals");
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(
          proposalsData.map((p: any) => ({ ...p, itemType: "proposal" }))
        );
      }

      // Fetch investment suggestions
      const investmentsRes = await fetch("/api/investments/suggestions");
      if (investmentsRes.ok) {
        const investmentsData = await investmentsRes.json();
        setInvestments(
          investmentsData.map((i: any) => ({ ...i, itemType: "investment" }))
        );
      }

      // Fetch assistance requests
      const assistanceRes = await fetch("/api/assistance");
      if (assistanceRes.ok) {
        const assistanceData = await assistanceRes.json();
        setAssistance(
          assistanceData.map((a: any) => ({ ...a, itemType: "assistance" }))
        );
      }
    } catch (err) {
      console.error("Failed to load voting items", err);
    } finally {
      setLoading(false);
    }
  }

  const handleVoteClick = (item: VotingItem) => {
    if (userVotes.has(item._id)) {
      setVoteError("You have already voted on this item");
      return;
    }
    setSelectedItem(item);
    setVoteDialogOpen(true);
    setVoteChoice("");
    setVoteError(null);
  };

  const handleVoteSubmit = async () => {
    setVoteError(null);

    if (!voteChoice) {
      setVoteError("Please select your vote");
      return;
    }

    if (!selectedItem) return;

    setIsSubmitting(true);

    try {
      let endpoint = "";
      let voteValue = voteChoice;

      if (selectedItem.itemType === "proposal") {
        endpoint = `/api/proposals/${selectedItem._id}/vote`;
      } else if (selectedItem.itemType === "investment") {
        endpoint = `/api/investments/suggestions/${selectedItem._id}/vote`;
      } else if (selectedItem.itemType === "assistance") {
        endpoint = `/api/assistance/${selectedItem._id}/vote`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote: voteValue,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      setUserVotes((prev) => new Set([...prev, selectedItem._id]));
      setVoteDialogOpen(false);
      setVoteChoice("");
      fetchAllVotingItems();
    } catch (error) {
      setVoteError(
        error instanceof Error ? error.message : "Failed to submit vote"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeStatus = (status: VotingItem["status"]) => {
    const s = (status || "pending").toString();
    if (/^voting$/i.test(s)) return "Active";
    if (/^approved$/i.test(s)) return "Passed";
    if (/^rejected$/i.test(s)) return "Failed";
    return "Pending";
  };

  const getStatusColor = (status: VotingItem["status"]) => {
    const label = normalizeStatus(status);
    if (label === "Active") return "primary";
    if (label === "Passed") return "success";
    if (label === "Failed") return "error";
    return "default";
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getVoteOptions = (itemType: string) => {
    if (itemType === "assistance") {
      return {
        yes: {
          value: "assist",
          label: "Assist",
          description: "I support providing assistance",
        },
        no: {
          value: "not-assist",
          label: "Not Assist",
          description: "I do not support this assistance request",
        },
      };
    }
    return {
      yes: { value: "yes", label: "Accept", description: "I support this" },
      no: {
        value: "no",
        label: "Reject",
        description: "I do not support this",
      },
    };
  };

  const countVotes = (item: VotingItem) => {
    const voteOptions = getVoteOptions(item.itemType);
    const yesVotes = (item.votes || []).filter(
      (v) => v.vote === voteOptions.yes.value
    ).length;
    const noVotes = (item.votes || []).filter(
      (v) => v.vote === voteOptions.no.value
    ).length;
    return { yesVotes, noVotes };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const allItems = [...proposals, ...investments, ...assistance];
  const totalVotes = allItems.reduce((sum, item) => {
    const { yesVotes, noVotes } = countVotes(item);
    return sum + yesVotes + noVotes;
  }, 0);

  const activeItems = allItems.filter(
    (item) => normalizeStatus(item.status) === "Active"
  );
  const passedItems = allItems.filter(
    (item) => normalizeStatus(item.status) === "Passed"
  );

  const getCurrentTabItems = () => {
    if (tabValue === 0) return allItems;
    if (tabValue === 1) return proposals;
    if (tabValue === 2) return investments;
    if (tabValue === 3) return assistance;
    return allItems;
  };

  const currentItems = getCurrentTabItems();

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 } }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Voting & Proposals
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Review and vote on community proposals, investments, and assistance
          requests
        </Typography>
      </Box>
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {activeItems.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              Active Voting Items
            </Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                color: "success.main",
                fontWeight: 600
              }}>
              {passedItems.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              Passed
            </Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                color: "warning.main",
                fontWeight: 600
              }}>
              {totalVotes}
            </Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              Total Votes Cast
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Tabs for filtering */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${allItems.length})`} />
          <Tab label={`Proposals (${proposals.length})`} />
          <Tab label={`Investments (${investments.length})`} />
          <Tab label={`Assistance (${assistance.length})`} />
        </Tabs>
      </Paper>
      {/* Voting Items Grid */}
      {currentItems.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <HowToVoteIcon
            sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
          />
          <Typography variant="h6" gutterBottom sx={{
            color: "text.secondary"
          }}>
            No voting items available
          </Typography>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Check back soon for new items to vote on!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {currentItems.map((item) => {
            const { yesVotes, noVotes } = countVotes(item);
            const totalVotesOnItem = yesVotes + noVotes;
            const acceptPercentage = getVotePercentage(
              yesVotes,
              totalVotesOnItem || 1
            );
            const rejectPercentage = getVotePercentage(
              noVotes,
              totalVotesOnItem || 1
            );
            const hasVotedServer = (item.votes || []).some(
              (v) => v.userId === session?.user?.id
            );
            const hasVoted = hasVotedServer || userVotes.has(item._id);
            const voteOptions = getVoteOptions(item.itemType);

            return (
              <Grid
                key={item._id}
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderLeft: 4,
                    borderLeftColor: `${getStatusColor(item.status)}.main`,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        mb: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          {item.itemType === "proposal" && (
                            <ArticleIcon fontSize="small" color="primary" />
                          )}
                          {item.itemType === "investment" && (
                            <TrendingUpIcon fontSize="small" color="success" />
                          )}
                          {item.itemType === "assistance" && (
                            <HandshakeIcon fontSize="small" color="info" />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              textTransform: "capitalize"
                            }}>
                            {item.itemType}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={normalizeStatus(item.status)}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2
                      }}>
                      {item.description}
                    </Typography>

                    {item.itemType === "investment" && (
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={2} sx={{
                          flexWrap: "wrap"
                        }}>
                          {item.investmentType && (
                            <Chip
                              label={item.investmentType}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {item.riskLevel && (
                            <Chip
                              label={`Risk: ${item.riskLevel}`}
                              size="small"
                              color={
                                item.riskLevel === "Low"
                                  ? "success"
                                  : item.riskLevel === "High"
                                  ? "error"
                                  : "warning"
                              }
                            />
                          )}
                        </Stack>
                      </Box>
                    )}

                    {item.itemType === "assistance" && item.assistanceType && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={item.assistanceType}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Vote Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{
                          color: "text.secondary"
                        }}>
                          Voting Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {totalVotesOnItem} votes
                        </Typography>
                      </Box>

                      <Stack spacing={1}>
                        {/* Accept Votes */}
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <ThumbUpIcon
                                sx={{
                                  fontSize: 18,
                                  mr: 1,
                                  color: "success.main",
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary"
                                }}
                              >
                                {voteOptions.yes.label}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              {yesVotes} ({acceptPercentage}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={acceptPercentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "success.light",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: "success.main",
                              },
                            }}
                          />
                        </Box>

                        {/* Reject Votes */}
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <ThumbDownIcon
                                sx={{
                                  fontSize: 18,
                                  mr: 1,
                                  color: "error.main",
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary"
                                }}
                              >
                                {voteOptions.no.label}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              {noVotes} ({rejectPercentage}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={rejectPercentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "error.light",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: "error.main",
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleVoteClick(item)}
                      disabled={
                        normalizeStatus(item.status) !== "Active" || hasVoted
                      }
                      startIcon={<HowToVoteIcon />}
                    >
                      {hasVoted
                        ? "You Voted"
                        : normalizeStatus(item.status) === "Active"
                        ? "Vote Now"
                        : normalizeStatus(item.status)}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      {/* Vote Dialog */}
      <Dialog
        open={voteDialogOpen}
        onClose={() => setVoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Vote on{" "}
          {selectedItem?.itemType === "proposal"
            ? "Proposal"
            : selectedItem?.itemType === "investment"
            ? "Investment"
            : "Assistance Request"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {voteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voteError}
            </Alert>
          )}

          {selectedItem && (
            <>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  {selectedItem.itemType === "proposal" && (
                    <ArticleIcon fontSize="small" color="primary" />
                  )}
                  {selectedItem.itemType === "investment" && (
                    <TrendingUpIcon fontSize="small" color="success" />
                  )}
                  {selectedItem.itemType === "assistance" && (
                    <HandshakeIcon fontSize="small" color="info" />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      textTransform: "capitalize"
                    }}>
                    {selectedItem.itemType}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedItem.title}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 2
                }}>
                {selectedItem.longDescription || selectedItem.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                How would you like to vote?
              </Typography>

              {(() => {
                const voteOptions = getVoteOptions(selectedItem.itemType);
                return (
                  <RadioGroup
                    value={voteChoice}
                    onChange={(e) => setVoteChoice(e.target.value)}
                  >
                    <FormControlLabel
                      value={voteOptions.yes.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {voteOptions.yes.label}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            {voteOptions.yes.description}
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value={voteOptions.no.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {voteOptions.no.label}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            {voteOptions.no.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                );
              })()}

              <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  Current Vote Results:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {(() => {
                    const { yesVotes, noVotes } = countVotes(selectedItem);
                    const voteOptions = getVoteOptions(selectedItem.itemType);
                    return `${voteOptions.yes.label}: ${yesVotes} | ${voteOptions.no.label}: ${noVotes}`;
                  })()}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVoteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleVoteSubmit}
            variant="contained"
            disabled={isSubmitting || !voteChoice}
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
