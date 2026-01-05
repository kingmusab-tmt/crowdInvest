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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  status: string;
  proposedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votes?: Array<{
    userId: string;
    vote: "yes" | "no";
  }>;
}

interface VoteData {
  _id: string;
  proposalId: string;
  title: string;
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  status: string;
  community: string;
}

export default function ProposalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [activeProposals, setActiveProposals] = React.useState<Proposal[]>([]);
  const [votes, setVotes] = React.useState<VoteData[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialogs
  const [editProposalDialog, setEditProposalDialog] = React.useState(false);
  const [createProposalDialog, setCreateProposalDialog] = React.useState(false);
  const [selectedProposal, setSelectedProposal] =
    React.useState<Proposal | null>(null);
  const [rejectionReasonDialog, setRejectionReasonDialog] =
    React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Form states
  const [proposalForm, setProposalForm] = React.useState({
    title: "",
    description: "",
    proposalType: "policy",
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

      const [proposalsRes, votesRes] = await Promise.all([
        fetch(`/api/proposals${queryParams}`),
        fetch(`/api/proposals/votes${queryParams}`),
      ]);

      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        // Separate proposals by status
        const pending = data.filter(
          (p: Proposal) => p.status.toLowerCase() === "pending"
        );
        const active = data.filter(
          (p: Proposal) =>
            p.status.toLowerCase() === "approved" ||
            p.status.toLowerCase() === "voting"
        );
        setProposals(pending);
        setActiveProposals(active);
      }

      if (votesRes.ok) {
        const data = await votesRes.json();
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

  const handleApproveProposal = async (proposal: Proposal) => {
    try {
      const res = await fetch(`/api/proposals/${proposal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        setSuccess("Proposal approved");
        loadData();
      }
    } catch (err) {
      setError("Failed to approve proposal");
    }
  };

  const handleRejectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setRejectionReason("");
    setRejectionReasonDialog(true);
  };

  const confirmRejectProposal = async () => {
    if (!selectedProposal) return;
    try {
      const res = await fetch(`/api/proposals/${selectedProposal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason,
        }),
      });
      if (res.ok) {
        setSuccess("Proposal rejected");
        setRejectionReasonDialog(false);
        loadData();
      }
    } catch (err) {
      setError("Failed to reject proposal");
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setProposalForm({
      title: proposal.title,
      description: proposal.description,
      proposalType: proposal.proposalType,
    });
    setEditProposalDialog(true);
  };

  const handleSaveProposal = async () => {
    if (!selectedProposal) return;
    try {
      const res = await fetch(`/api/proposals/${selectedProposal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposalForm),
      });
      if (res.ok) {
        setSuccess("Proposal updated");
        setEditProposalDialog(false);
        loadData();
      } else {
        setError("Failed to update proposal");
      }
    } catch (err) {
      setError("Error updating proposal");
    }
  };

  const handleCreateProposal = async () => {
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...proposalForm,
          community: session?.user?.community,
          proposedBy: session?.user?.email,
        }),
      });
      if (res.ok) {
        setSuccess("Proposal created");
        setCreateProposalDialog(false);
        setProposalForm({
          title: "",
          description: "",
          proposalType: "policy",
        });
        loadData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create proposal");
      }
    } catch (err) {
      setError("Error creating proposal");
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Proposal deleted");
        loadData();
      } else {
        setError("Failed to delete proposal");
      }
    } catch (err) {
      setError("Error deleting proposal");
    }
  };

  const getStatusColor = (status: string): any => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "pending") return "warning";
    if (lowerStatus === "approved" || lowerStatus === "voting")
      return "success";
    if (lowerStatus === "rejected") return "error";
    return "default";
  };

  const calculateVotes = (proposal: Proposal) => {
    if (!proposal.votes) return { yes: 0, no: 0 };
    const yes = proposal.votes.filter((v: any) => v.vote === "yes").length;
    const no = proposal.votes.filter((v: any) => v.vote === "no").length;
    return { yes, no };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Proposals Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setProposalForm({
              title: "",
              description: "",
              proposalType: "policy",
            });
            setCreateProposalDialog(true);
          }}
        >
          New Proposal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Pending Proposals (${proposals.length})`} />
              <Tab label={`Active Proposals (${activeProposals.length})`} />
              <Tab label={`Voting Overview (${votes.length})`} />
            </Tabs>
          </Box>

          {/* Pending Proposals Tab */}
          <TabPanel value={tabValue} index={0}>
            {proposals.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No pending proposals
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {proposals.map((proposal) => (
                  <Card key={proposal._id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {proposal.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 1 }}
                          >
                            {proposal.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip label={proposal.proposalType} size="small" />
                            <Chip
                              label={proposal.status}
                              color={getStatusColor(proposal.status)}
                              size="small"
                            />
                            <Typography
                              variant="caption"
                              sx={{ alignSelf: "center" }}
                            >
                              By: {proposal.proposedBy.name}
                            </Typography>
                          </Stack>
                          {proposal.rejectionReason && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ display: "block", mt: 1 }}
                            >
                              Reason: {proposal.rejectionReason}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleApproveProposal(proposal)}
                            color="success"
                            title="Approve"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRejectProposal(proposal)}
                            color="error"
                            title="Reject"
                          >
                            <CloseIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditProposal(proposal)}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProposal(proposal._id)}
                            color="error"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Active Proposals Tab */}
          <TabPanel value={tabValue} index={1}>
            {activeProposals.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No active proposals
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {activeProposals.map((proposal) => {
                  const { yes, no } = calculateVotes(proposal);
                  return (
                    <Card key={proposal._id}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {proposal.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {proposal.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip
                                label={proposal.proposalType}
                                size="small"
                              />
                              <Chip
                                label={proposal.status}
                                color={getStatusColor(proposal.status)}
                                size="small"
                              />
                            </Stack>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Yes Votes: <strong>{yes}</strong>
                              </Typography>
                              <Typography variant="caption">
                                No Votes: <strong>{no}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Total: <strong>{yes + no}</strong>
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditProposal(proposal)}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteProposal(proposal._id)}
                              color="error"
                              title="Delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>

          {/* Voting Overview Tab */}
          <TabPanel value={tabValue} index={2}>
            {votes.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No voting data available
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {votes.map((vote) => (
                  <Card key={vote._id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {vote.title}
                          </Typography>
                          <Stack direction="row" spacing={3}>
                            <Typography variant="body2">
                              Yes Votes:{" "}
                              <Chip
                                label={vote.yesVotes}
                                size="small"
                                color="success"
                              />
                            </Typography>
                            <Typography variant="body2">
                              No Votes:{" "}
                              <Chip
                                label={vote.noVotes}
                                size="small"
                                color="error"
                              />
                            </Typography>
                            <Typography variant="body2">
                              Total Voters:{" "}
                              <Chip label={vote.totalVoters} size="small" />
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </Paper>
      )}

      {/* Edit Proposal Dialog */}
      <Dialog
        open={editProposalDialog}
        onClose={() => setEditProposalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={proposalForm.title}
            onChange={(e) =>
              setProposalForm({ ...proposalForm, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={proposalForm.description}
            onChange={(e) =>
              setProposalForm({ ...proposalForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Proposal Type</InputLabel>
            <Select
              value={proposalForm.proposalType}
              onChange={(e) =>
                setProposalForm({
                  ...proposalForm,
                  proposalType: e.target.value,
                })
              }
              label="Proposal Type"
            >
              <MenuItem value="policy">Policy</MenuItem>
              <MenuItem value="initiative">Initiative</MenuItem>
              <MenuItem value="budget">Budget</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProposalDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveProposal} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Proposal Dialog */}
      <Dialog
        open={createProposalDialog}
        onClose={() => setCreateProposalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={proposalForm.title}
            onChange={(e) =>
              setProposalForm({ ...proposalForm, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={proposalForm.description}
            onChange={(e) =>
              setProposalForm({ ...proposalForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Proposal Type</InputLabel>
            <Select
              value={proposalForm.proposalType}
              onChange={(e) =>
                setProposalForm({
                  ...proposalForm,
                  proposalType: e.target.value,
                })
              }
              label="Proposal Type"
            >
              <MenuItem value="policy">Policy</MenuItem>
              <MenuItem value="initiative">Initiative</MenuItem>
              <MenuItem value="budget">Budget</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProposalDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProposal} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionReasonDialog}
        onClose={() => setRejectionReasonDialog(false)}
      >
        <DialogTitle>Reject Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionReasonDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmRejectProposal}
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
