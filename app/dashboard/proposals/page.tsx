"use client";

import * as React from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Box,
  Button,
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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ForumIcon from "@mui/icons-material/Forum";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DescriptionIcon from "@mui/icons-material/Description";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useSession } from "next-auth/react";
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
  proposedBy: { name?: string; email?: string } | any;
  community: string;
  createdAt: string;
  votes?: Array<{
    userId: string;
    vote: "yes" | "no";
  }>;
  rejectionReason?: string;
  votingDeadline?: string;
}

function proposalTypeLabel(type: string): string {
  return PROPOSAL_TYPE_CONFIG[type as ProposalType]?.label || type;
}

function getDaysRemainingLabel(votingDeadline?: string): string | null {
  if (!votingDeadline) return null;
  const days = Math.ceil(
    (new Date(votingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Voting closes today";
  if (days === 1) return "1 day left to vote";
  return `${days} days left to vote`;
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
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        height: "100%",
      }}
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

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
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
          sx={{ mb: action ? 3 : 0, maxWidth: 360, mx: "auto" }}
        >
          {description}
        </Typography>
      )}
      {action}
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
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_, v) => v && onChange(v)}
      sx={{
        mb: 3,
        bgcolor: "action.hover",
        borderRadius: 999,
        p: 0.5,
        "& .MuiToggleButton-root": {
          border: "none",
          borderRadius: 999,
          px: 2,
          fontWeight: 600,
          textTransform: "none",
          color: "text.secondary",
          "&.Mui-selected": {
            bgcolor: "background.paper",
            color: "primary.main",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          },
          "&.Mui-selected:hover": {
            bgcolor: "background.paper",
          },
        },
      }}
    >
      <ToggleButton value="current">Current ({currentCount})</ToggleButton>
      <ToggleButton value="past">Past ({pastCount})</ToggleButton>
    </ToggleButtonGroup>
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
  const [communityProposals, setCommunityProposals] = React.useState<
    Proposal[]
  >([]);
  const [userProposals, setUserProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [proposalFormOpen, setProposalFormOpen] = React.useState(false);
  const [editingProposal, setEditingProposal] = React.useState<Proposal | null>(
    null
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [proposalForm, setProposalForm] = React.useState(EMPTY_PROPOSAL_FORM);

  // Current vs Past view toggles, one per tab
  const [communityView, setCommunityView] = React.useState<"current" | "past">(
    "current"
  );
  const [myView, setMyView] = React.useState<"current" | "past">("current");
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );
  const [votingInFlight, setVotingInFlight] = React.useState<{
    id: string;
    vote: "yes" | "no";
  } | null>(null);

  const selectedTypeConfig = PROPOSAL_TYPE_CONFIG[proposalForm.proposalType];

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
        setProposalForm(EMPTY_PROPOSAL_FORM);
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
    setVotingInFlight({ id: proposalId, vote });
    try {
      const res = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, userId: session?.user?.id }),
      });

      if (res.ok) {
        showSuccess(`Vote recorded: ${vote.toUpperCase()}`);
        await loadProposals();
      } else {
        showError("Failed to record vote");
      }
    } catch (err) {
      showError("Error recording vote");
    } finally {
      setVotingInFlight(null);
    }
  };

  const getUserVote = (proposal: Proposal): "yes" | "no" | null => {
    if (!session?.user?.id || !proposal.votes) return null;
    const userVote = proposal.votes.find((v) => v.userId === session.user.id);
    return userVote ? userVote.vote : null;
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Community Proposals: only show proposals the admin has already acted on
  // — a pending proposal that hasn't been approved (sent to voting) or
  // rejected yet is only visible to its own creator, under "My Proposals".
  // current = still in the 3-day voting window, past = decided (approved
  // by vote, or rejected)
  const visibleCommunityProposals = communityProposals.filter(
    (p) => p.status !== "pending"
  );
  const currentCommunityProposals = visibleCommunityProposals.filter(
    (p) => p.status === "voting"
  );
  const pastCommunityProposals = visibleCommunityProposals.filter(
    (p) => p.status === "approved" || p.status === "rejected"
  );
  const displayedCommunityProposals =
    communityView === "current"
      ? currentCommunityProposals
      : pastCommunityProposals;

  // My Proposals: current = awaiting a decision, past = decided
  const currentUserProposals = userProposals.filter(
    (p) => p.status === "pending" || p.status === "voting"
  );
  const pastUserProposals = userProposals.filter(
    (p) => p.status === "approved" || p.status === "rejected"
  );
  const displayedUserProposals =
    myView === "current" ? currentUserProposals : pastUserProposals;

  // Voting: only proposals the admin has reviewed (i.e. not still pending) —
  // current = still in the 3-day voting window, past = decided
  const votingEligibleProposals = communityProposals.filter(
    (p) => p.status !== "pending"
  );
  const currentVotingProposals = votingEligibleProposals.filter(
    (p) => p.status === "voting"
  );
  const pastVotingProposals = votingEligibleProposals.filter(
    (p) => p.status === "approved" || p.status === "rejected"
  );
  const displayedVotingProposals =
    votingView === "current" ? currentVotingProposals : pastVotingProposals;

  const pendingCount = communityProposals.filter(
    (p) => p.status === "pending"
  ).length;
  const activeCount = communityProposals.filter(
    (p) => p.status === "voting"
  ).length;
  const rejectedCount = communityProposals.filter(
    (p) => p.status === "rejected"
  ).length;

  return (
    <Box>
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
              Community Proposals
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Participate in community decisions and make proposals
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProposal(null);
              setProposalForm(EMPTY_PROPOSAL_FORM);
              setProposalFormOpen(true);
            }}
          >
            Make Proposal
          </Button>
        </Stack>
      </Stack>

      {/* Overall Stats */}
      {communityProposals.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<DescriptionIcon fontSize="small" />}
              label="Total Proposals"
              value={communityProposals.length}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<HourglassEmptyIcon fontSize="small" />}
              label="Pending Review"
              value={pendingCount}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<HowToVoteIcon fontSize="small" />}
              label="Active / Voting"
              value={activeCount}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<CancelIcon fontSize="small" />}
              label="Rejected"
              value={rejectedCount}
              color="error"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Proposal tabs"
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
            icon={<ForumIcon fontSize="small" />}
            iconPosition="start"
            label={`Community Proposals (${visibleCommunityProposals.length})`}
            id="proposal-tab-0"
            aria-controls="proposal-tabpanel-0"
          />
          <Tab
            icon={<LightbulbIcon fontSize="small" />}
            iconPosition="start"
            label={`My Proposals (${userProposals.length})`}
            id="proposal-tab-1"
            aria-controls="proposal-tabpanel-1"
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Voting (${votingEligibleProposals.length})`}
            id="proposal-tab-2"
            aria-controls="proposal-tabpanel-2"
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Tab 1: Community Proposals */}
          <TabPanel value={tabValue} index={0}>
            {visibleCommunityProposals.length > 0 && (
              <ViewToggle
                value={communityView}
                onChange={setCommunityView}
                currentCount={currentCommunityProposals.length}
                pastCount={pastCommunityProposals.length}
              />
            )}
            {visibleCommunityProposals.length === 0 ? (
              <EmptyState
                icon={<ForumIcon />}
                title="No proposals yet"
                description="Be the first to make a proposal for your community"
              />
            ) : displayedCommunityProposals.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  communityView === "current"
                    ? "No current proposals"
                    : "No past proposals yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedCommunityProposals.map((proposal) => (
                  <Grid key={proposal._id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderLeft: (theme) =>
                          `4px solid ${
                            theme.palette[getStatusMeta(proposal.status).color]
                              .main
                          }`,
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            mb: 1,
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, fontSize: "1.05rem" }}
                          >
                            {proposal.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                          >
                            <StatusChip status={proposal.status} />
                            {proposal.status === "voting" &&
                              getDaysRemainingLabel(proposal.votingDeadline) && (
                                <Chip
                                  label={getDaysRemainingLabel(
                                    proposal.votingDeadline
                                  )}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              )}
                          </Stack>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            alignItems: "center",
                            color: "text.secondary",
                            mb: 1.5,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {proposal.proposedBy?.name || "Community Member"}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {proposal.description}
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          <Chip
                            label={proposalTypeLabel(proposal.proposalType)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 2: My Proposals */}
          <TabPanel value={tabValue} index={1}>
            {userProposals.length > 0 && (
              <ViewToggle
                value={myView}
                onChange={setMyView}
                currentCount={currentUserProposals.length}
                pastCount={pastUserProposals.length}
              />
            )}
            {userProposals.length === 0 ? (
              <EmptyState
                icon={<LightbulbIcon />}
                title="You haven't made any proposals yet"
                description="Start by making a proposal for your community"
                action={
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingProposal(null);
                      setProposalForm(EMPTY_PROPOSAL_FORM);
                      setProposalFormOpen(true);
                    }}
                  >
                    Make Proposal
                  </Button>
                }
              />
            ) : displayedUserProposals.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  myView === "current"
                    ? "No proposals awaiting a decision"
                    : "No past proposals yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedUserProposals.map((proposal) => (
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
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          mb: 1.5,
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, fontSize: "1.05rem" }}
                        >
                          {proposal.title}
                        </Typography>
                        <StatusChip status={proposal.status} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {proposal.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1, fontWeight: 600 }}
                        >
                          Status Updates
                        </Typography>
                        {proposal.status === "pending" && (
                          <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                            ⏳ Awaiting review by community admin
                          </Alert>
                        )}
                        {proposal.status === "voting" && (
                          <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                            🗳️ Approved! Your proposal is now open for
                            community voting
                            {getDaysRemainingLabel(proposal.votingDeadline) && (
                              <>
                                {" "}
                                — {getDaysRemainingLabel(proposal.votingDeadline)}
                              </>
                            )}
                          </Alert>
                        )}
                        {proposal.status === "approved" && (
                          <Alert severity="success" sx={{ fontSize: "0.875rem" }}>
                            🎉 Voting closed — the community approved this
                            proposal!
                          </Alert>
                        )}
                        {proposal.status === "rejected" && (
                          <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
                            ✗ This proposal was not approved
                            {proposal.rejectionReason && (
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
                                  {proposal.rejectionReason}
                                </Typography>
                              </Box>
                            )}
                          </Alert>
                        )}
                      </Box>

                      {proposal.status === "rejected" && (
                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setEditingProposal(proposal);
                              setProposalForm({
                                title: proposal.title,
                                description: proposal.description,
                                proposalType:
                                  proposal.proposalType as ProposalType,
                              });
                              setProposalFormOpen(true);
                            }}
                          >
                            Edit & Resubmit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
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
                      )}
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip
                          label={proposalTypeLabel(proposal.proposalType)}
                          size="small"
                          variant="outlined"
                        />
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: "center", color: "text.secondary" }}
                        >
                          <CalendarTodayIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 3: Voting */}
          <TabPanel value={tabValue} index={2}>
            {votingEligibleProposals.length > 0 && (
              <ViewToggle
                value={votingView}
                onChange={setVotingView}
                currentCount={currentVotingProposals.length}
                pastCount={pastVotingProposals.length}
              />
            )}
            {votingEligibleProposals.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title="No proposals in voting yet"
                description="Check back soon for proposals to vote on"
              />
            ) : displayedVotingProposals.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  votingView === "current"
                    ? "No proposals currently open for voting"
                    : "No past voting results yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedVotingProposals.map((proposal) => {
                  const votes = proposal.votes || [];
                  const yesVotes = votes.filter((v) => v.vote === "yes").length;
                  const noVotes = votes.filter((v) => v.vote === "no").length;
                  const totalVotes = yesVotes + noVotes;
                  const isOpen = proposal.status === "voting";
                  const daysLabel = getDaysRemainingLabel(
                    proposal.votingDeadline
                  );
                  const userVote = getUserVote(proposal);
                  const isVotingThis = votingInFlight?.id === proposal._id;
                  const yesLoading =
                    isVotingThis && votingInFlight?.vote === "yes";
                  const noLoading =
                    isVotingThis && votingInFlight?.vote === "no";

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
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            mb: 1.5,
                            gap: 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, fontSize: "1.05rem" }}
                            >
                              {proposal.title}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ alignItems: "center", color: "text.secondary" }}
                            >
                              <PersonIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {proposal.proposedBy?.name || "Community Member"}
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                          >
                            <StatusChip status={proposal.status} />
                            {isOpen && daysLabel && (
                              <Chip
                                label={daysLabel}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            )}
                          </Stack>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {proposal.description}
                        </Typography>

                        <Chip
                          label={proposalTypeLabel(proposal.proposalType)}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1, fontWeight: 600 }}
                        >
                          {isOpen
                            ? "Vote on this proposal:"
                            : "Final result:"}
                        </Typography>

                        {totalVotes > 0 && (
                          <>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ mb: 1, alignItems: "center" }}
                            >
                              <Box
                                sx={{
                                  flex: yesVotes || 0.05,
                                  height: 8,
                                  borderRadius: 999,
                                  bgcolor: "success.main",
                                }}
                              />
                              <Box
                                sx={{
                                  flex: noVotes || 0.05,
                                  height: 8,
                                  borderRadius: 999,
                                  bgcolor: "error.main",
                                }}
                              />
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 2 }}
                            >
                              Yes: {yesVotes} | No: {noVotes} | Total:{" "}
                              {totalVotes}
                            </Typography>
                          </>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {isOpen ? (
                          <>
                            <Stack direction="row" spacing={2}>
                              <Button
                                fullWidth
                                variant={
                                  userVote === "yes" ? "contained" : "outlined"
                                }
                                disableElevation
                                color="success"
                                disabled={isVotingThis || userVote === "yes"}
                                startIcon={
                                  yesLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <ThumbUpIcon fontSize="small" />
                                  )
                                }
                                onClick={() => handleVote(proposal._id, "yes")}
                              >
                                {yesLoading ? "Voting..." : "Vote Yes"}
                              </Button>
                              <Button
                                fullWidth
                                variant={
                                  userVote === "no" ? "contained" : "outlined"
                                }
                                disableElevation
                                color="error"
                                disabled={isVotingThis || userVote === "no"}
                                startIcon={
                                  noLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <ThumbDownIcon fontSize="small" />
                                  )
                                }
                                onClick={() => handleVote(proposal._id, "no")}
                              >
                                {noLoading ? "Voting..." : "Vote No"}
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
                                You voted: {userVote === "yes" ? "Yes 👍" : "No 👎"}
                              </Typography>
                            )}
                          </>
                        ) : proposal.status === "approved" ? (
                          <Alert severity="success">
                            🎉 The community approved this proposal.
                          </Alert>
                        ) : (
                          <Alert severity="error">
                            ✗ This proposal was not approved
                            {proposal.rejectionReason && (
                              <Box sx={{ mt: 1 }}>
                                <strong>Reason:</strong>{" "}
                                {proposal.rejectionReason}
                              </Box>
                            )}
                          </Alert>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>
        </Box>
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
          <Stack spacing={3}>
            {/* Proposal type picker */}
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

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Details
              </Typography>
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
            </Box>
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
    </Box>
  );
}
