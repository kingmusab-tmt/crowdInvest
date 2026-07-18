"use client";

import * as React from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Chip,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MenuItem from "@mui/material/MenuItem";
import { useSession } from "next-auth/react";

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
      id={`proposal-tabpanel-${index}`}
      aria-labelledby={`proposal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface Proposal {
  _id: string;
  title: string;
  description: string;
  proposalType: string;
  status: "pending" | "approved" | "rejected" | "voting";
  proposedBy: { name?: string; email?: string } | any;
  community: string;
  createdAt: string;
  votes?: Array<{
    userId: string;
    vote: "yes" | "no";
  }>;
  rejectionReason?: string;
}

export default function ProposalsPage() {
  const { data: session } = useSession();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [tabValue, setTabValue] = React.useState(0);
  const [communityProposals, setCommunityProposals] = React.useState<
    Proposal[]
  >([]);
  const [userProposals, setUserProposals] = React.useState<Proposal[]>([]);
  const [votingProposals, setVotingProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [proposalFormOpen, setProposalFormOpen] = React.useState(false);
  const [editingProposal, setEditingProposal] = React.useState<Proposal | null>(
    null
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [proposalForm, setProposalForm] = React.useState({
    title: "",
    description: "",
    proposalType: "policy",
  });
  const [votingDialog, setVotingDialog] = React.useState(false);
  const [selectedProposal, setSelectedProposal] =
    React.useState<Proposal | null>(null);

  React.useEffect(() => {
    if (session?.user?.community) {
      loadProposals();
    }
  }, [session?.user?.community]);

  async function loadProposals() {
    try {
      setLoading(true);

      const queryParams = `?community=${session?.user?.community}`;
      const userQueryParams = `?community=${session?.user?.community}&email=${session?.user?.email}`;

      const [allRes, userRes] = await Promise.all([
        fetch(`/api/proposals${queryParams}`),
        fetch(`/api/proposals/user${userQueryParams}`),
      ]);

      if (allRes.ok) {
        const allProposals = await allRes.json();
        setCommunityProposals(allProposals);

        // Filter voting proposals
        const votingProps = allProposals.filter(
          (p: Proposal) => p.status === "voting" || p.status === "approved"
        );
        setVotingProposals(votingProps);
      }

      if (userRes.ok) {
        const userProps = await userRes.json();
        setUserProposals(userProps);
      }
    } catch (err) {
      console.error("Failed to load proposals", err);
      showError("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProposals();
    setRefreshing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmitProposal = async () => {
    if (!proposalForm.title || !proposalForm.description) {
      showError("Please fill in all fields");
      return;
    }

    try {
      const isEditing = !!editingProposal;
      const url = isEditing
        ? `/api/proposals/${editingProposal!._id}`
        : "/api/proposals";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        ...proposalForm,
        community: session?.user?.community,
        proposedBy: session?.user?.email,
      };
      if (isEditing) {
        payload.status = "pending";
        payload.rejectionReason = "";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showSuccess(
          isEditing
            ? "Proposal updated and resubmitted"
            : "Proposal created successfully"
        );
        setProposalForm({ title: "", description: "", proposalType: "policy" });
        setProposalFormOpen(false);
        setEditingProposal(null);
        loadProposals();
      } else {
        const data = await res.json();
        showError(data.error || "Failed to create proposal");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error creating proposal");
    }
  };

  const handleVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, userId: session?.user?.id }),
      });

      if (res.ok) {
        showSuccess(`Vote recorded: ${vote.toUpperCase()}`);
        setVotingDialog(false);
        loadProposals();
      } else {
        showError("Failed to record vote");
      }
    } catch (err) {
      showError("Error recording vote");
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
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Community Proposals
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Participate in community decisions and make proposals
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
            onClick={() => setProposalFormOpen(true)}
          >
            Make Proposal
          </Button>
        </Box>
      </Box>
      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Proposal tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Community Proposals (${communityProposals.length})`}
            id="proposal-tab-0"
            aria-controls="proposal-tabpanel-0"
          />
          <Tab
            label={`My Proposals (${userProposals.length})`}
            id="proposal-tab-1"
            aria-controls="proposal-tabpanel-1"
          />
          <Tab
            label={`Voting (${votingProposals.length})`}
            id="proposal-tab-2"
            aria-controls="proposal-tabpanel-2"
          />
        </Tabs>

        {/* Tab 1: Community Proposals */}
        <TabPanel value={tabValue} index={0}>
          {communityProposals.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No proposals yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Be the first to make a proposal for your community
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {communityProposals.map((proposal) => (
                <Card key={proposal._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {proposal.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          By: {proposal.proposedBy?.name || "Community Member"}
                        </Typography>
                      </Box>
                      <Chip
                        label={proposal.status}
                        color={
                          proposal.status === "approved"
                            ? "success"
                            : proposal.status === "rejected"
                            ? "error"
                            : proposal.status === "voting"
                            ? "info"
                            : "default"
                        }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {proposal.description}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        label={proposal.proposalType}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 2: My Proposals */}
        <TabPanel value={tabValue} index={1}>
          {userProposals.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                You haven't made any proposals yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by making a proposal for your community
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setProposalFormOpen(true)}
              >
                Make Proposal
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {userProposals.map((proposal) => (
                <Card key={proposal._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {proposal.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={proposal.status}
                        color={
                          proposal.status === "approved"
                            ? "success"
                            : proposal.status === "rejected"
                            ? "error"
                            : proposal.status === "voting"
                            ? "info"
                            : "default"
                        }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {proposal.description}
                    </Typography>
                    {proposal.status === "rejected" && (
                      <>
                        {proposal.rejectionReason && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                              <strong>Rejection Reason:</strong>{" "}
                              {proposal.rejectionReason}
                            </Typography>
                          </Alert>
                        )}
                        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEditingProposal(proposal);
                              setProposalForm({
                                title: proposal.title,
                                description: proposal.description,
                                proposalType: proposal.proposalType,
                              });
                              setProposalFormOpen(true);
                            }}
                          >
                            Edit & Resubmit
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              openConfirmDialog(
                                "Delete Proposal",
                                "Are you sure you want to delete this proposal? This action cannot be undone.",
                                async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/proposals/${proposal._id}`,
                                      { method: "DELETE" }
                                    );
                                    if (res.ok) {
                                      showSuccess("Proposal deleted");
                                      loadProposals();
                                    } else {
                                      showError("Failed to delete proposal");
                                    }
                                  } catch (error) {
                                    showError("Error deleting proposal");
                                  }
                                }
                              );
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </>
                    )}
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Chip
                        label={proposal.proposalType}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 3: Voting */}
        <TabPanel value={tabValue} index={2}>
          {votingProposals.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No proposals in voting yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Check back soon for proposals to vote on
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {votingProposals.map((proposal) => {
                const votes = proposal.votes || [];
                const yesVotes = votes.filter((v) => v.vote === "yes").length;
                const noVotes = votes.filter((v) => v.vote === "no").length;
                const totalVotes = yesVotes + noVotes;

                return (
                  <Card key={proposal._id} sx={{ border: "2px solid #1976d2" }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {proposal.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            By:{" "}
                            {proposal.proposedBy?.name || "Community Member"}
                          </Typography>
                        </Box>
                        <Chip label={proposal.status} color="info" />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {proposal.description}
                      </Typography>

                      {/* Voting Progress */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: "block", mb: 1 }}
                        >
                          Voting Progress ({totalVotes} votes)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Box
                            sx={{
                              flex: yesVotes,
                              bgcolor: "#4caf50",
                              height: 24,
                              borderRadius: 1,
                            }}
                          />
                          <Box
                            sx={{
                              flex: noVotes,
                              bgcolor: "#f44336",
                              height: 24,
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">
                            Yes Votes
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color: "#4caf50", fontWeight: 600 }}
                          >
                            {yesVotes}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">
                            No Votes
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color: "#f44336", fontWeight: 600 }}
                          >
                            {noVotes}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ThumbUpIcon />}
                          color="success"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            handleVote(proposal._id, "yes");
                          }}
                        >
                          Vote Yes
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ThumbDownIcon />}
                          color="error"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            handleVote(proposal._id, "no");
                          }}
                        >
                          Vote No
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </TabPanel>
      </Paper>
      {/* Make Proposal Dialog */}
      <Dialog
        open={proposalFormOpen}
        onClose={() => setProposalFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProposal ? "Edit Proposal" : "Make a Proposal"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Proposal Title"
              value={proposalForm.title}
              onChange={(e) =>
                setProposalForm({ ...proposalForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              select
              label="Proposal Type"
              value={proposalForm.proposalType}
              onChange={(e) =>
                setProposalForm({
                  ...proposalForm,
                  proposalType: e.target.value,
                })
              }
              fullWidth
            >
              <MenuItem value="policy">Community Policy</MenuItem>
              <MenuItem value="initiative">Community Initiative</MenuItem>
              <MenuItem value="budget">Budget Allocation</MenuItem>
              <MenuItem value="event">Event Planning</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Description"
              value={proposalForm.description}
              onChange={(e) =>
                setProposalForm({
                  ...proposalForm,
                  description: e.target.value,
                })
              }
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe your proposal in detail..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposalFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitProposal} variant="contained">
            {editingProposal ? "Save & Resubmit" : "Submit Proposal"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmDialog}
        isLoading={dialog.isLoading}
        confirmButtonText="Delete"
        isDangerous
      />
    </Container>
  );
}
