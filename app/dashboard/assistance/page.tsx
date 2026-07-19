"use client";

import * as React from "react";
import {
  Box,
  Button,
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
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DescriptionIcon from "@mui/icons-material/Description";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useSession } from "next-auth/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  ASSISTANCE_TYPE_CONFIG,
  ASSISTANCE_TYPE_OPTIONS,
  AssistanceType,
} from "@/lib/assistanceTypes";

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
      id={`assistance-tabpanel-${index}`}
      aria-labelledby={`assistance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface AssistanceRequest {
  _id: string;
  title: string;
  description: string;
  assistanceType: string;
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  requestedBy: { name?: string; email?: string } | any;
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votes?: Array<{
    userId: string;
    vote: "assist" | "not-assist";
  }>;
  votingDeadline?: string;
}

function assistanceTypeLabel(type: string): string {
  return ASSISTANCE_TYPE_CONFIG[type as AssistanceType]?.label || type;
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

function getStatusMeta(status: AssistanceRequest["status"]) {
  switch (status) {
    case "Approved":
      return { color: "success" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "Rejected":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    case "Voting":
      return { color: "info" as StatColor, icon: <HowToVoteIcon fontSize="small" /> };
    default:
      return { color: "warning" as StatColor, icon: <HourglassEmptyIcon fontSize="small" /> };
  }
}

const EMPTY_REQUEST_FORM = {
  title: "",
  description: "",
  assistanceType: "financial" as AssistanceType,
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

function StatusChip({ status }: { status: AssistanceRequest["status"] }) {
  const meta = getStatusMeta(status);
  return (
    <Chip
      label={status}
      size="small"
      icon={meta.icon as any}
      sx={{
        fontWeight: 600,
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

export default function AssistancePage() {
  const { data: session } = useSession();
  const { snackbar, closeSnackbar, showWarning, showError, showSuccess } =
    useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [tabValue, setTabValue] = React.useState(0);
  const [communityRequests, setCommunityRequests] = React.useState<
    AssistanceRequest[]
  >([]);
  const [userRequests, setUserRequests] = React.useState<AssistanceRequest[]>(
    []
  );
  const [votingRequests, setVotingRequests] = React.useState<
    AssistanceRequest[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [requestFormOpen, setRequestFormOpen] = React.useState(false);
  const [editingRequest, setEditingRequest] =
    React.useState<AssistanceRequest | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [requestForm, setRequestForm] = React.useState(EMPTY_REQUEST_FORM);
  const [votingInFlight, setVotingInFlight] = React.useState<{
    id: string;
    vote: "assist" | "not-assist";
  } | null>(null);

  // Current vs Past view toggles, one per tab
  const [communityView, setCommunityView] = React.useState<"current" | "past">(
    "current"
  );
  const [myView, setMyView] = React.useState<"current" | "past">("current");
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );

  const selectedTypeConfig = ASSISTANCE_TYPE_CONFIG[requestForm.assistanceType];

  React.useEffect(() => {
    if (session?.user?.community) {
      loadRequests();
    }
  }, [session?.user?.community]);

  async function loadRequests() {
    try {
      setError(null);
      setLoading(true);

      const queryParams = `?community=${session?.user?.community}`;
      const userQueryParams = `?community=${session?.user?.community}&email=${session?.user?.email}`;

      const [allRes, userRes] = await Promise.all([
        fetch(`/api/assistance${queryParams}`),
        fetch(`/api/assistance/user${userQueryParams}`),
      ]);

      if (allRes.ok) {
        const allRequests = await allRes.json();
        setCommunityRequests(allRequests);

        // Voting-eligible requests: anything the admin has already reviewed
        // (i.e. not still Pending) — current = still voting, past = decided
        const votingReqs = allRequests.filter(
          (r: AssistanceRequest) => r.status !== "Pending"
        );
        setVotingRequests(votingReqs);
      }

      if (userRes.ok) {
        const userReqs = await userRes.json();
        setUserRequests(userReqs);
      }
    } catch (err) {
      console.error("Failed to load assistance requests", err);
      setError("Failed to load assistance requests");
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.title || !requestForm.description) {
      setError("Please fill in all fields");
      return;
    }

    const isEditing = !!editingRequest;

    try {
      const url = isEditing
        ? `/api/assistance/${editingRequest!._id}`
        : "/api/assistance";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        ...requestForm,
        community: session?.user?.community,
        requestedBy: session?.user?.email,
      };
      if (isEditing) {
        payload.status = "Pending";
        payload.rejectionReason = "";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(
          isEditing
            ? "Assistance request updated and resubmitted"
            : "Assistance request created successfully"
        );
        setRequestForm(EMPTY_REQUEST_FORM);
        setRequestFormOpen(false);
        setEditingRequest(null);
        loadRequests();
      } else {
        setError(
          isEditing
            ? "Failed to update assistance request"
            : "Failed to create assistance request"
        );
      }
    } catch (err) {
      setError(
        isEditing
          ? "Error updating assistance request"
          : "Error creating assistance request"
      );
    }
  };

  const handleVote = async (
    requestId: string,
    vote: "assist" | "not-assist"
  ) => {
    setVotingInFlight({ id: requestId, vote });
    try {
      const res = await fetch(`/api/assistance/${requestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, userId: session?.user?.id }),
      });

      if (res.ok) {
        setSuccess(
          `Vote recorded: ${vote === "assist" ? "ASSIST" : "NOT ASSIST"}`
        );
        await loadRequests();
      } else {
        setError("Failed to record vote");
      }
    } catch (err) {
      setError("Error recording vote");
    } finally {
      setVotingInFlight(null);
    }
  };

  const getUserVote = (
    request: AssistanceRequest
  ): "assist" | "not-assist" | null => {
    if (!session?.user?.id || !request.votes) return null;
    const userVote = request.votes.find((v) => v.userId === session.user.id);
    return userVote ? userVote.vote : null;
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingCount = communityRequests.filter(
    (r) => r.status === "Pending"
  ).length;
  const activeCount = communityRequests.filter(
    (r) => r.status === "Voting"
  ).length;
  const rejectedCount = communityRequests.filter(
    (r) => r.status === "Rejected"
  ).length;

  // Community Requests: only show requests the admin has already acted on
  // — a pending request that hasn't been approved (sent to voting) or
  // rejected yet is only visible to its own creator, under "My Requests".
  // current = still in the 3-day voting window, past = decided
  const visibleCommunityRequests = communityRequests.filter(
    (r) => r.status !== "Pending"
  );
  const currentCommunityRequests = visibleCommunityRequests.filter(
    (r) => r.status === "Voting"
  );
  const pastCommunityRequests = visibleCommunityRequests.filter(
    (r) => r.status === "Approved" || r.status === "Rejected"
  );
  const displayedCommunityRequests =
    communityView === "current"
      ? currentCommunityRequests
      : pastCommunityRequests;

  // My Requests: same current/past split
  const currentUserRequests = userRequests.filter(
    (r) => r.status === "Pending" || r.status === "Voting"
  );
  const pastUserRequests = userRequests.filter(
    (r) => r.status === "Approved" || r.status === "Rejected"
  );
  const displayedUserRequests =
    myView === "current" ? currentUserRequests : pastUserRequests;

  // Voting: only requests the admin has reviewed (i.e. not still Pending) —
  // current = still in the 3-day voting window, past = decided
  const currentVotingRequests = votingRequests.filter(
    (r) => r.status === "Voting"
  );
  const pastVotingRequests = votingRequests.filter(
    (r) => r.status === "Approved" || r.status === "Rejected"
  );
  const displayedVotingRequests =
    votingView === "current" ? currentVotingRequests : pastVotingRequests;

  return (
    <Box>
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
            <VolunteerActivismIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Community Assistance
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Request assistance and help other community members
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
              setEditingRequest(null);
              setRequestForm(EMPTY_REQUEST_FORM);
              setRequestFormOpen(true);
            }}
          >
            Request Assistance
          </Button>
        </Stack>
      </Stack>

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

      {/* Overall Stats */}
      {communityRequests.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<DescriptionIcon fontSize="small" />}
              label="Total Requests"
              value={communityRequests.length}
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
          aria-label="Assistance tabs"
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
            icon={<VolunteerActivismIcon fontSize="small" />}
            iconPosition="start"
            label={`Community Requests (${visibleCommunityRequests.length})`}
            id="assistance-tab-0"
            aria-controls="assistance-tabpanel-0"
          />
          <Tab
            icon={<AssignmentIcon fontSize="small" />}
            iconPosition="start"
            label={`My Requests (${userRequests.length})`}
            id="assistance-tab-1"
            aria-controls="assistance-tabpanel-1"
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Voting (${votingRequests.length})`}
            id="assistance-tab-2"
            aria-controls="assistance-tabpanel-2"
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Tab 1: Community Requests */}
          <TabPanel value={tabValue} index={0}>
            {visibleCommunityRequests.length > 0 && (
              <ViewToggle
                value={communityView}
                onChange={setCommunityView}
                currentCount={currentCommunityRequests.length}
                pastCount={pastCommunityRequests.length}
              />
            )}
            {visibleCommunityRequests.length === 0 ? (
              <EmptyState
                icon={<VolunteerActivismIcon />}
                title="No assistance requests yet"
                description="Be the first to request assistance"
              />
            ) : displayedCommunityRequests.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  communityView === "current"
                    ? "No current requests"
                    : "No past requests yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedCommunityRequests.map((request) => (
                  <Grid key={request._id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderLeft: (theme) =>
                          `4px solid ${
                            theme.palette[getStatusMeta(request.status).color]
                              .main
                          }`,
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
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
                          {request.title}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                        >
                          <StatusChip status={request.status} />
                          {request.status === "Voting" &&
                            getDaysRemainingLabel(request.votingDeadline) && (
                              <Chip
                                label={getDaysRemainingLabel(
                                  request.votingDeadline
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
                          {request.requestedBy?.name || "Community Member"}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
                        {request.description}
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip
                          label={assistanceTypeLabel(request.assistanceType)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 2: My Requests */}
          <TabPanel value={tabValue} index={1}>
            {userRequests.length > 0 && (
              <ViewToggle
                value={myView}
                onChange={setMyView}
                currentCount={currentUserRequests.length}
                pastCount={pastUserRequests.length}
              />
            )}
            {userRequests.length === 0 ? (
              <EmptyState
                icon={<AssignmentIcon />}
                title="You haven't requested assistance yet"
                description="Start by requesting assistance from your community"
                action={
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingRequest(null);
                      setRequestForm(EMPTY_REQUEST_FORM);
                      setRequestFormOpen(true);
                    }}
                  >
                    Request Assistance
                  </Button>
                }
              />
            ) : displayedUserRequests.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  myView === "current"
                    ? "No requests awaiting a decision"
                    : "No past requests yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedUserRequests.map((request) => (
                  <Grid key={request._id} size={{ xs: 12, lg: 6 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        height: "100%",
                        borderLeft: (theme) =>
                          `4px solid ${
                            theme.palette[getStatusMeta(request.status).color]
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
                          {request.title}
                        </Typography>
                        <StatusChip status={request.status} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {request.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1, fontWeight: 600 }}
                        >
                          Status Updates
                        </Typography>
                        {request.status === "Pending" && (
                          <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                            ⏳ Awaiting review by community admin
                          </Alert>
                        )}
                        {request.status === "Voting" && (
                          <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                            🗳️ Approved! Your request is now open for
                            community voting
                            {getDaysRemainingLabel(request.votingDeadline) && (
                              <>
                                {" "}
                                — {getDaysRemainingLabel(request.votingDeadline)}
                              </>
                            )}
                          </Alert>
                        )}
                        {request.status === "Approved" && (
                          <Alert severity="success" sx={{ fontSize: "0.875rem" }}>
                            🎉 Voting closed — the community approved this
                            request!
                          </Alert>
                        )}
                        {request.status === "Rejected" && (
                          <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
                            ✗ This request was not approved
                            {request.rejectionReason && (
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
                                  {request.rejectionReason}
                                </Typography>
                              </Box>
                            )}
                          </Alert>
                        )}
                      </Box>

                      {request.status === "Rejected" && (
                        <>
                          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                setEditingRequest(request);
                                setRequestForm({
                                  title: request.title,
                                  description: request.description,
                                  assistanceType:
                                    request.assistanceType as AssistanceType,
                                });
                                setRequestFormOpen(true);
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
                                  "Delete Assistance Request",
                                  "Are you sure you want to delete this assistance request? This action cannot be undone.",
                                  async () => {
                                    try {
                                      const res = await fetch(
                                        `/api/assistance/${request._id}`,
                                        { method: "DELETE" }
                                      );
                                      if (res.ok) {
                                        showSuccess("Assistance request deleted");
                                        loadRequests();
                                      } else {
                                        setError(
                                          "Failed to delete assistance request"
                                        );
                                      }
                                    } catch (e) {
                                      setError(
                                        "Error deleting assistance request"
                                      );
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
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip
                          label={assistanceTypeLabel(request.assistanceType)}
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
                            {new Date(request.createdAt).toLocaleDateString()}
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
            {votingRequests.length > 0 && (
              <ViewToggle
                value={votingView}
                onChange={setVotingView}
                currentCount={currentVotingRequests.length}
                pastCount={pastVotingRequests.length}
              />
            )}
            {votingRequests.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title="No assistance requests in voting yet"
                description="Check back soon for assistance requests to vote on"
              />
            ) : displayedVotingRequests.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  votingView === "current"
                    ? "No requests currently open for voting"
                    : "No past voting results yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedVotingRequests.map((request) => {
                  const votes = request.votes || [];
                  const assistVotes = votes.filter(
                    (v) => v.vote === "assist"
                  ).length;
                  const notAssistVotes = votes.filter(
                    (v) => v.vote === "not-assist"
                  ).length;
                  const totalVotes = assistVotes + notAssistVotes;
                  const isOpen = request.status === "Voting";
                  const daysLabel = getDaysRemainingLabel(
                    request.votingDeadline
                  );
                  const userVote = getUserVote(request);
                  const isVotingThis = votingInFlight?.id === request._id;
                  const assistLoading =
                    isVotingThis && votingInFlight?.vote === "assist";
                  const notAssistLoading =
                    isVotingThis && votingInFlight?.vote === "not-assist";

                  return (
                    <Grid key={request._id} size={{ xs: 12, lg: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          height: "100%",
                          borderLeft: (theme) =>
                            `4px solid ${
                              theme.palette[getStatusMeta(request.status).color]
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
                              {request.title}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ alignItems: "center", color: "text.secondary" }}
                            >
                              <PersonIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {request.requestedBy?.name || "Community Member"}
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                          >
                            <StatusChip status={request.status} />
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
                          {request.description}
                        </Typography>

                        <Chip
                          label={assistanceTypeLabel(request.assistanceType)}
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
                            ? `Assistance Voting (${totalVotes} votes)`
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
                                  flex: assistVotes || 0.05,
                                  height: 8,
                                  borderRadius: 999,
                                  bgcolor: "success.main",
                                }}
                              />
                              <Box
                                sx={{
                                  flex: notAssistVotes || 0.05,
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
                              Assist: {assistVotes} | Not Assist: {notAssistVotes}{" "}
                              | Total: {totalVotes}
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
                                  userVote === "assist" ? "contained" : "outlined"
                                }
                                disableElevation
                                color="success"
                                disabled={isVotingThis || userVote === "assist"}
                                startIcon={
                                  assistLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <ThumbUpIcon fontSize="small" />
                                  )
                                }
                                onClick={() => handleVote(request._id, "assist")}
                              >
                                {assistLoading ? "Voting..." : "Assist"}
                              </Button>
                              <Button
                                fullWidth
                                variant={
                                  userVote === "not-assist"
                                    ? "contained"
                                    : "outlined"
                                }
                                disableElevation
                                color="error"
                                disabled={
                                  isVotingThis || userVote === "not-assist"
                                }
                                startIcon={
                                  notAssistLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <ThumbDownIcon fontSize="small" />
                                  )
                                }
                                onClick={() =>
                                  handleVote(request._id, "not-assist")
                                }
                              >
                                {notAssistLoading ? "Voting..." : "Cannot Assist"}
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
                                {userVote === "assist"
                                  ? "Assist 👍"
                                  : "Cannot Assist 👎"}
                              </Typography>
                            )}
                          </>
                        ) : request.status === "Approved" ? (
                          <Alert severity="success">
                            🎉 The community approved this request.
                          </Alert>
                        ) : (
                          <Alert severity="error">
                            ✗ This request was not approved
                            {request.rejectionReason && (
                              <Box sx={{ mt: 1 }}>
                                <strong>Reason:</strong>{" "}
                                {request.rejectionReason}
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

      {/* Request Assistance Dialog */}
      <Dialog
        open={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRequest ? "Edit Assistance Request" : "Request Assistance"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Assistance type picker */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Type of Assistance Needed
              </Typography>
              <Grid container spacing={1}>
                {ASSISTANCE_TYPE_OPTIONS.map((opt) => {
                  const selected = requestForm.assistanceType === opt.value;
                  return (
                    <Grid key={opt.value} size={{ xs: 6, sm: 4 }}>
                      <Paper
                        onClick={() =>
                          setRequestForm({
                            ...requestForm,
                            assistanceType: opt.value,
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
                  label="Request Title"
                  value={requestForm.title}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, title: e.target.value })
                  }
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={requestForm.description}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={4}
                  required
                  placeholder="Describe your assistance need in detail..."
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitRequest} variant="contained">
            {editingRequest ? "Save & Resubmit" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
