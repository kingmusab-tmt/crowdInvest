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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Grid,
  Divider,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ForumIcon from "@mui/icons-material/Forum";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  PROPOSAL_TYPE_CONFIG,
  PROPOSAL_TYPE_OPTIONS,
  ProposalType,
} from "@/lib/proposalTypes";

type StatColor = "primary" | "success" | "error" | "warning" | "info";

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
  proposedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votingDeadline?: string;
  votes?: Array<{
    userId: string;
    vote: "yes" | "no";
  }>;
}

function proposalTypeLabel(type: string): string {
  return PROPOSAL_TYPE_CONFIG[type as ProposalType]?.label || type;
}

function getDaysRemainingLabel(votingDeadline?: string): string | null {
  if (!votingDeadline) return null;
  const days = Math.ceil(
    (new Date(votingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function getStatusMeta(status: Proposal["status"]) {
  switch (status) {
    case "approved":
      return { color: "success" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "rejected":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    case "voting":
      return { color: "info" as StatColor, icon: <HowToVoteIcon fontSize="small" /> };
    default:
      return { color: "warning" as StatColor, icon: <HourglassEmptyIcon fontSize="small" /> };
  }
}

const EMPTY_PROPOSAL_FORM = {
  title: "",
  description: "",
  proposalType: "policy" as ProposalType,
};

// --- Small presentational helpers -----------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: StatColor;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, height: "100%" }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", mb: 1.5 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme: Theme) => alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function StatusChip({ status }: { status: Proposal["status"] }) {
  const meta = getStatusMeta(status);
  return (
    <Chip
      label={status}
      size="small"
      icon={meta.icon as any}
      sx={{
        fontWeight: 600,
        textTransform: "capitalize",
        bgcolor: (theme: Theme) => alpha(theme.palette[meta.color].main, 0.12),
        color: `${meta.color}.main`,
        "& .MuiChip-icon": { color: `${meta.color}.main` },
      }}
    />
  );
}

function MetaItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", color: "text.secondary", mb: 0.25 }}
      >
        <Box sx={{ display: "flex", fontSize: 16 }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: valueColor || "text.primary" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "action.hover",
          color: "text.disabled",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, mx: "auto" }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}

function ViewToggle({
  value,
  onChange,
  currentCount,
  pastCount,
}: {
  value: "current" | "past";
  onChange: (v: "current" | "past") => void;
  currentCount: number;
  pastCount: number;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        mb: 3,
        bgcolor: "action.hover",
        borderRadius: 999,
        p: 0.5,
      }}
    >
      {(["current", "past"] as const).map((v) => (
        <Box
          key={v}
          onClick={() => onChange(v)}
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: value === v ? "primary.main" : "text.secondary",
            bgcolor: value === v ? "background.paper" : "transparent",
            boxShadow: value === v ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
          }}
        >
          {v === "current" ? `Current (${currentCount})` : `Past (${pastCount})`}
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------

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
  const [loading, setLoading] = React.useState(true);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);

  // Current vs Past view toggles
  const [activeView, setActiveView] = React.useState<"current" | "past">(
    "current"
  );
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );

  // Dialogs
  const [editProposalDialog, setEditProposalDialog] = React.useState(false);
  const [createProposalDialog, setCreateProposalDialog] = React.useState(false);
  const [selectedProposal, setSelectedProposal] =
    React.useState<Proposal | null>(null);
  const [rejectionReasonDialog, setRejectionReasonDialog] =
    React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Form states
  const [proposalForm, setProposalForm] = React.useState(EMPTY_PROPOSAL_FORM);

  const selectedTypeConfig = PROPOSAL_TYPE_CONFIG[proposalForm.proposalType];

  React.useEffect(() => {
    if (session?.user?.role) {
      loadData();
    }
  }, [session?.user?.role, session?.user?.community]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      showError("Failed to load data");
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
        showSuccess("Proposal approved");
        loadData();
      }
    } catch (err) {
      showError("Failed to approve proposal");
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
        showSuccess("Proposal rejected");
        setRejectionReasonDialog(false);
        loadData();
      }
    } catch (err) {
      showError("Failed to reject proposal");
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setProposalForm({
      title: proposal.title,
      description: proposal.description,
      proposalType: proposal.proposalType as ProposalType,
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
        showSuccess("Proposal updated");
        setEditProposalDialog(false);
        loadData();
      } else {
        showError("Failed to update proposal");
      }
    } catch (err) {
      showError("Error updating proposal");
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
        showSuccess("Proposal created");
        setCreateProposalDialog(false);
        setProposalForm(EMPTY_PROPOSAL_FORM);
        loadData();
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to create proposal");
      }
    } catch (err) {
      showError("Error creating proposal");
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    openConfirmDialog(
      "Delete Proposal",
      "Are you sure you want to delete this proposal? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/proposals/${proposalId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showSuccess("Proposal deleted");
            loadData();
          } else {
            showError("Failed to delete proposal");
          }
        } catch (err) {
          showError("Error deleting proposal");
        }
      }
    );
  };

  const calculateVotes = (proposal: Proposal) => {
    if (!proposal.votes) return { yes: 0, no: 0 };
    const yes = proposal.votes.filter((v: any) => v.vote === "yes").length;
    const no = proposal.votes.filter((v: any) => v.vote === "no").length;
    return { yes, no };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === "pending");

  // Active Proposals: current = still in the 3-day voting window, past =
  // decided (approved by vote, or rejected)
  const activeEligibleProposals = proposals.filter(
    (p) => p.status !== "pending"
  );
  const currentActiveProposals = activeEligibleProposals.filter(
    (p) => p.status === "voting"
  );
  const pastActiveProposals = activeEligibleProposals.filter(
    (p) => p.status === "approved" || p.status === "rejected"
  );
  const displayedActiveProposals =
    activeView === "current" ? currentActiveProposals : pastActiveProposals;

  // Voting Overview: same eligible set, tallies computed inline
  const displayedVotingProposals =
    votingView === "current" ? currentActiveProposals : pastActiveProposals;

  const approvedCount = proposals.filter((p) => p.status === "approved").length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 4,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <ForumIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Proposals Management
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Review, approve, and track community proposals
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => {
            setProposalForm(EMPTY_PROPOSAL_FORM);
            setCreateProposalDialog(true);
          }}
        >
          New Proposal
        </Button>
      </Stack>

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending Review"
            value={pendingProposals.length}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HowToVoteIcon fontSize="small" />}
            label="In Voting"
            value={currentActiveProposals.length}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<CheckCircleIcon fontSize="small" />}
            label="Approved"
            value={approvedCount}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<CancelIcon fontSize="small" />}
            label="Rejected"
            value={
              proposals.filter((p) => p.status === "rejected").length
            }
            color="error"
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            px: 1,
            "& .MuiTab-root": {
              minWidth: { xs: 150, sm: 180 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 600,
              textTransform: "none",
            },
          }}
        >
          <Tab
            icon={<HourglassEmptyIcon fontSize="small" />}
            iconPosition="start"
            label={`Pending Proposals (${pendingProposals.length})`}
          />
          <Tab
            icon={<ForumIcon fontSize="small" />}
            iconPosition="start"
            label={`Active Proposals (${activeEligibleProposals.length})`}
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Voting Overview (${activeEligibleProposals.length})`}
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Pending Proposals Tab */}
          <TabPanel value={tabValue} index={0}>
            {pendingProposals.length === 0 ? (
              <EmptyState
                icon={<HourglassEmptyIcon />}
                title="No pending proposals"
                description="New member proposals will show up here for review"
              />
            ) : (
              <Grid container spacing={2}>
                {pendingProposals.map((proposal) => (
                  <Grid key={proposal._id} size={{ xs: 12, lg: 6 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        height: "100%",
                        borderLeft: (theme) =>
                          `4px solid ${theme.palette.warning.main}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 0.5 }}
                          >
                            {proposal.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1.5 }}
                          >
                            {proposal.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <Chip
                              label={proposalTypeLabel(proposal.proposalType)}
                              size="small"
                              variant="outlined"
                            />
                            <StatusChip status={proposal.status} />
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ alignItems: "center", color: "text.secondary" }}
                            >
                              <PersonIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {proposal.proposedBy.name}
                              </Typography>
                            </Stack>
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
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
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
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Active Proposals Tab */}
          <TabPanel value={tabValue} index={1}>
            {activeEligibleProposals.length > 0 && (
              <ViewToggle
                value={activeView}
                onChange={setActiveView}
                currentCount={currentActiveProposals.length}
                pastCount={pastActiveProposals.length}
              />
            )}
            {activeEligibleProposals.length === 0 ? (
              <EmptyState
                icon={<ForumIcon />}
                title="No active proposals"
              />
            ) : displayedActiveProposals.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  activeView === "current"
                    ? "No proposals currently open"
                    : "No past proposals yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedActiveProposals.map((proposal) => {
                  const { yes, no } = calculateVotes(proposal);
                  const daysLabel = getDaysRemainingLabel(proposal.votingDeadline);
                  return (
                    <Grid key={proposal._id} size={{ xs: 12, md: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          height: "100%",
                          borderLeft: (theme) =>
                            `4px solid ${
                              theme.palette[getStatusMeta(proposal.status).color]
                                .main
                            }`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            gap: 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 0.5 }}
                            >
                              {proposal.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1.5 }}
                            >
                              {proposal.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                              <Chip
                                label={proposalTypeLabel(proposal.proposalType)}
                                size="small"
                                variant="outlined"
                              />
                              <StatusChip status={proposal.status} />
                              {proposal.status === "voting" && daysLabel && (
                                <Chip
                                  label={daysLabel}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              )}
                            </Stack>
                            <Stack direction="row" spacing={3}>
                              <Typography variant="caption">
                                Yes: <strong>{yes}</strong>
                              </Typography>
                              <Typography variant="caption">
                                No: <strong>{no}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Total: <strong>{yes + no}</strong>
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
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
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>

          {/* Voting Overview Tab */}
          <TabPanel value={tabValue} index={2}>
            {activeEligibleProposals.length > 0 && (
              <ViewToggle
                value={votingView}
                onChange={setVotingView}
                currentCount={currentActiveProposals.length}
                pastCount={pastActiveProposals.length}
              />
            )}
            {activeEligibleProposals.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title="No voting data available"
              />
            ) : displayedVotingProposals.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  votingView === "current"
                    ? "No voting currently in progress"
                    : "No past voting results yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedVotingProposals.map((proposal) => {
                  const { yes, no } = calculateVotes(proposal);
                  const total = yes + no;
                  const daysLabel = getDaysRemainingLabel(proposal.votingDeadline);
                  return (
                    <Grid key={proposal._id} size={{ xs: 12, lg: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          height: "100%",
                          borderLeft: (theme) =>
                            `4px solid ${
                              theme.palette[getStatusMeta(proposal.status).color]
                                .main
                            }`,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                            {proposal.title}
                          </Typography>
                          <StatusChip status={proposal.status} />
                          {proposal.status === "voting" && daysLabel && (
                            <Chip
                              label={daysLabel}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mb: 1.5, alignItems: "center" }}
                        >
                          <Box
                            sx={{
                              flex: yes || 0.05,
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "success.main",
                            }}
                          />
                          <Box
                            sx={{
                              flex: no || 0.05,
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "error.main",
                            }}
                          />
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid size={4}>
                            <MetaItem
                              icon={<CheckCircleIcon fontSize="inherit" />}
                              label="Yes"
                              value={yes}
                              valueColor="success.main"
                            />
                          </Grid>
                          <Grid size={4}>
                            <MetaItem
                              icon={<CancelIcon fontSize="inherit" />}
                              label="No"
                              value={no}
                              valueColor="error.main"
                            />
                          </Grid>
                          <Grid size={4}>
                            <MetaItem
                              icon={<PersonIcon fontSize="inherit" />}
                              label="Total Voters"
                              value={total}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>
        </Box>
      </Paper>

      {/* Edit Proposal Dialog */}
      <Dialog
        open={editProposalDialog}
        onClose={() => setEditProposalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Proposal Type
              </Typography>
              <Grid container spacing={1}>
                {PROPOSAL_TYPE_OPTIONS.map((opt) => {
                  const selected = proposalForm.proposalType === opt.value;
                  return (
                    <Grid key={opt.value} size={{ xs: 6, sm: 4 }}>
                      <Paper
                        onClick={() =>
                          setProposalForm({
                            ...proposalForm,
                            proposalType: opt.value,
                          })
                        }
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          textAlign: "center",
                          cursor: "pointer",
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? "primary.main" : "divider",
                          bgcolor: selected ? "action.selected" : "transparent",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: selected ? 600 : 400 }}
                        >
                          {opt.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
            <Divider />
            <TextField
              fullWidth
              label="Title"
              value={proposalForm.title}
              onChange={(e) =>
                setProposalForm({ ...proposalForm, title: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={proposalForm.description}
              onChange={(e) =>
                setProposalForm({ ...proposalForm, description: e.target.value })
              }
              multiline
              rows={4}
            />
          </Stack>
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
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Proposal Type
              </Typography>
              <Grid container spacing={1}>
                {PROPOSAL_TYPE_OPTIONS.map((opt) => {
                  const selected = proposalForm.proposalType === opt.value;
                  return (
                    <Grid key={opt.value} size={{ xs: 6, sm: 4 }}>
                      <Paper
                        onClick={() =>
                          setProposalForm({
                            ...proposalForm,
                            proposalType: opt.value,
                          })
                        }
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          textAlign: "center",
                          cursor: "pointer",
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? "primary.main" : "divider",
                          bgcolor: selected ? "action.selected" : "transparent",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: selected ? 600 : 400 }}
                        >
                          {opt.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
              {selectedTypeConfig && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  {selectedTypeConfig.description}
                </Typography>
              )}
            </Box>
            <Divider />
            <TextField
              fullWidth
              label="Title"
              value={proposalForm.title}
              onChange={(e) =>
                setProposalForm({ ...proposalForm, title: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={proposalForm.description}
              onChange={(e) =>
                setProposalForm({ ...proposalForm, description: e.target.value })
              }
              multiline
              rows={4}
            />
          </Stack>
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
