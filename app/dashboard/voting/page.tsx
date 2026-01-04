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
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { useSession } from "next-auth/react";

interface Proposal {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  status: "Active" | "Passed" | "Failed";
  acceptedVotes: number;
  rejectedVotes: number;
  totalMembers: number;
  createdAt: string;
  updatedAt: string;
}

export default function VotingProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedProposal, setSelectedProposal] =
    React.useState<Proposal | null>(null);
  const [voteDialogOpen, setVoteDialogOpen] = React.useState(false);
  const [voteChoice, setVoteChoice] = React.useState<"accept" | "reject" | "">(
    ""
  );
  const [voteError, setVoteError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userVotes, setUserVotes] = React.useState<Set<string>>(new Set());

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

  const handleVoteClick = (proposal: Proposal) => {
    if (userVotes.has(proposal._id)) {
      setVoteError("You have already voted on this proposal");
      return;
    }
    setSelectedProposal(proposal);
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

    if (!selectedProposal) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/proposals/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: selectedProposal._id,
          vote: voteChoice,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      setUserVotes((prev) => new Set([...prev, selectedProposal._id]));
      setVoteDialogOpen(false);
      setVoteChoice("");
      fetchProposals();
    } catch (error) {
      setVoteError(
        error instanceof Error ? error.message : "Failed to submit vote"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "primary";
      case "Passed":
        return "success";
      case "Failed":
        return "error";
      default:
        return "default";
    }
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const totalVotes = proposals.reduce(
    (sum, p) => sum + p.acceptedVotes + p.rejectedVotes,
    0
  );
  const activeProposals = proposals.filter((p) => p.status === "Active");
  const passedProposals = proposals.filter((p) => p.status === "Passed");

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Voting & Proposals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and vote on community proposals
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {activeProposals.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Proposals
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
              {passedProposals.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Passed
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
              {totalVotes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Votes Cast
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <HowToVoteIcon
            sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No proposals available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back soon for new proposals to vote on!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {proposals.map((proposal) => {
            const totalVotesOnProposal =
              proposal.acceptedVotes + proposal.rejectedVotes;
            const acceptPercentage = getVotePercentage(
              proposal.acceptedVotes,
              totalVotesOnProposal || 1
            );
            const rejectPercentage = getVotePercentage(
              proposal.rejectedVotes,
              totalVotesOnProposal || 1
            );
            const hasVoted = userVotes.has(proposal._id);

            return (
              <Grid item xs={12} md={6} key={proposal._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderLeft: 4,
                    borderLeftColor: `${getStatusColor(proposal.status)}.main`,
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
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {proposal.title}
                      </Typography>
                      <Chip
                        label={proposal.status}
                        color={getStatusColor(proposal.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {proposal.description}
                    </Typography>

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
                        <Typography variant="body2" color="text.secondary">
                          Voting Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {totalVotesOnProposal} votes
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
                                color="text.secondary"
                              >
                                Accept
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              {proposal.acceptedVotes} ({acceptPercentage}%)
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
                                color="text.secondary"
                              >
                                Reject
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              {proposal.rejectedVotes} ({rejectPercentage}%)
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
                      onClick={() => handleVoteClick(proposal)}
                      disabled={proposal.status !== "Active" || hasVoted}
                      startIcon={<HowToVoteIcon />}
                    >
                      {hasVoted
                        ? "You Voted"
                        : proposal.status === "Active"
                        ? "Vote Now"
                        : proposal.status}
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
        <DialogTitle>Vote on Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {voteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voteError}
            </Alert>
          )}

          {selectedProposal && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedProposal.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedProposal.longDescription ||
                  selectedProposal.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                How would you like to vote?
              </Typography>

              <RadioGroup
                value={voteChoice}
                onChange={(e) =>
                  setVoteChoice(e.target.value as "accept" | "reject")
                }
              >
                <FormControlLabel
                  value="accept"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Accept
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        I support this proposal
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="reject"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Reject
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        I do not support this proposal
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Current Vote Results:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Accept: {selectedProposal.acceptedVotes} | Reject:{" "}
                  {selectedProposal.rejectedVotes}
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
