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
  Alert,
  Divider,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import Inventory2Icon from "@mui/icons-material/Inventory2";
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
  requestedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votingDeadline?: string;
  votes?: Array<{
    userId: string;
    vote: "assist" | "not-assist";
  }>;
}

function assistanceTypeLabel(type: string): string {
  return ASSISTANCE_TYPE_CONFIG[type as AssistanceType]?.label || type;
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

function getDaysRemainingLabel(votingDeadline?: string): string | null {
  if (!votingDeadline) return null;
  const days = Math.ceil(
    (new Date(votingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
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

function AssistanceTypePicker({
  value,
  onChange,
}: {
  value: AssistanceType;
  onChange: (v: AssistanceType) => void;
}) {
  const selectedTypeConfig = ASSISTANCE_TYPE_CONFIG[value];
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Type of Assistance Needed
      </Typography>
      <Grid container spacing={1}>
        {ASSISTANCE_TYPE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Grid key={opt.value} size={{ xs: 6, sm: 4 }}>
              <Paper
                onClick={() => onChange(opt.value)}
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
  const [loading, setLoading] = React.useState(true);
  const [requests, setRequests] = React.useState<AssistanceRequest[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Current vs Past view toggles
  const [activeView, setActiveView] = React.useState<"current" | "past">(
    "current"
  );
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );

  // Dialogs
  const [editRequestDialog, setEditRequestDialog] = React.useState(false);
  const [createRequestDialog, setCreateRequestDialog] = React.useState(false);
  const [selectedRequest, setSelectedRequest] =
    React.useState<AssistanceRequest | null>(null);
  const [rejectionReasonDialog, setRejectionReasonDialog] =
    React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Form states
  const [requestForm, setRequestForm] = React.useState(EMPTY_REQUEST_FORM);

  React.useEffect(() => {
    if (session?.user?.role) {
      loadData();
    }
  }, [session?.user?.role, session?.user?.community]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/assistance");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
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

  const handleApproveRequest = async (request: AssistanceRequest) => {
    try {
      const res = await fetch(`/api/assistance/${request._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
      if (res.ok) {
        setSuccess("Assistance request approved");
        loadData();
      }
    } catch (err) {
      setError("Failed to approve assistance request");
    }
  };

  const handleRejectRequest = (request: AssistanceRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectionReasonDialog(true);
  };

  const confirmRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/assistance/${selectedRequest._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          rejectionReason,
        }),
      });
      if (res.ok) {
        setSuccess("Assistance request rejected");
        setRejectionReasonDialog(false);
        loadData();
      }
    } catch (err) {
      setError("Failed to reject assistance request");
    }
  };

  const handleEditRequest = (request: AssistanceRequest) => {
    setSelectedRequest(request);
    setRequestForm({
      title: request.title,
      description: request.description,
      assistanceType: request.assistanceType as AssistanceType,
    });
    setEditRequestDialog(true);
  };

  const handleSaveRequest = async () => {
    if (!selectedRequest) return;
    try {
      const res = await fetch(`/api/assistance/${selectedRequest._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });
      if (res.ok) {
        setSuccess("Assistance request updated");
        setEditRequestDialog(false);
        loadData();
      } else {
        setError("Failed to update assistance request");
      }
    } catch (err) {
      setError("Error updating assistance request");
    }
  };

  const handleCreateRequest = async () => {
    try {
      const res = await fetch("/api/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          community: session?.user?.community,
          requestedBy: session?.user?.email,
        }),
      });
      if (res.ok) {
        setSuccess("Assistance request created");
        setCreateRequestDialog(false);
        setRequestForm(EMPTY_REQUEST_FORM);
        loadData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create assistance request");
      }
    } catch (err) {
      setError("Error creating assistance request");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    openConfirmDialog(
      "Delete Assistance Request",
      "Are you sure you want to delete this assistance request? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/assistance/${requestId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setSuccess("Assistance request deleted");
            loadData();
          } else {
            setError("Failed to delete assistance request");
          }
        } catch (err) {
          setError("Error deleting assistance request");
        }
      }
    );
  };

  const calculateVotes = (request: AssistanceRequest) => {
    if (!request.votes) return { assist: 0, notAssist: 0 };
    const assist = request.votes.filter((v: any) => v.vote === "assist").length;
    const notAssist = request.votes.filter(
      (v: any) => v.vote === "not-assist"
    ).length;
    return { assist, notAssist };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "Pending");

  // Active Requests: current = still in the 3-day voting window, past =
  // decided (approved by vote, or rejected)
  const activeEligibleRequests = requests.filter((r) => r.status !== "Pending");
  const currentActiveRequests = activeEligibleRequests.filter(
    (r) => r.status === "Voting"
  );
  const pastActiveRequests = activeEligibleRequests.filter(
    (r) => r.status === "Approved" || r.status === "Rejected"
  );
  const displayedActiveRequests =
    activeView === "current" ? currentActiveRequests : pastActiveRequests;

  // Voting Overview: same eligible set, tallies computed inline
  const displayedVotingRequests =
    votingView === "current" ? currentActiveRequests : pastActiveRequests;

  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
              Assistance Requests Management
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Review, approve, and track community assistance requests
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => {
            setRequestForm(EMPTY_REQUEST_FORM);
            setCreateRequestDialog(true);
          }}
        >
          New Request
        </Button>
      </Stack>

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

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending Review"
            value={pendingRequests.length}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HowToVoteIcon fontSize="small" />}
            label="In Voting"
            value={currentActiveRequests.length}
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
            value={requests.filter((r) => r.status === "Rejected").length}
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
            label={`Pending Requests (${pendingRequests.length})`}
          />
          <Tab
            icon={<VolunteerActivismIcon fontSize="small" />}
            iconPosition="start"
            label={`Active Requests (${activeEligibleRequests.length})`}
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Voting Overview (${activeEligibleRequests.length})`}
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Pending Requests Tab */}
          <TabPanel value={tabValue} index={0}>
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<HourglassEmptyIcon />}
                title="No pending assistance requests"
                description="New member requests will show up here for review"
              />
            ) : (
              <Grid container spacing={2}>
                {pendingRequests.map((request) => (
                  <Grid key={request._id} size={{ xs: 12, lg: 6 }}>
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
                            {request.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1.5 }}
                          >
                            {request.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <Chip
                              label={assistanceTypeLabel(request.assistanceType)}
                              size="small"
                              variant="outlined"
                            />
                            <StatusChip status={request.status} />
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ alignItems: "center", color: "text.secondary" }}
                            >
                              <PersonIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {request.requestedBy.name}
                              </Typography>
                            </Stack>
                          </Stack>
                          {request.rejectionReason && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ display: "block", mt: 1 }}
                            >
                              Reason: {request.rejectionReason}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleApproveRequest(request)}
                            color="success"
                            title="Approve"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRejectRequest(request)}
                            color="error"
                            title="Reject"
                          >
                            <CloseIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditRequest(request)}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRequest(request._id)}
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

          {/* Active Requests Tab */}
          <TabPanel value={tabValue} index={1}>
            {activeEligibleRequests.length > 0 && (
              <ViewToggle
                value={activeView}
                onChange={setActiveView}
                currentCount={currentActiveRequests.length}
                pastCount={pastActiveRequests.length}
              />
            )}
            {activeEligibleRequests.length === 0 ? (
              <EmptyState
                icon={<VolunteerActivismIcon />}
                title="No active assistance requests"
              />
            ) : displayedActiveRequests.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  activeView === "current"
                    ? "No requests currently open"
                    : "No past requests yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedActiveRequests.map((request) => {
                  const { assist, notAssist } = calculateVotes(request);
                  const daysLabel = getDaysRemainingLabel(request.votingDeadline);
                  return (
                    <Grid key={request._id} size={{ xs: 12, md: 6 }}>
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
                            gap: 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, fontSize: "1.05rem", mb: 0.5 }}
                            >
                              {request.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1.5 }}
                            >
                              {request.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                              <Chip
                                label={assistanceTypeLabel(request.assistanceType)}
                                size="small"
                                variant="outlined"
                              />
                              <StatusChip status={request.status} />
                              {request.status === "Voting" && daysLabel && (
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
                                Assist: <strong>{assist}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Not Assist: <strong>{notAssist}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Total: <strong>{assist + notAssist}</strong>
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditRequest(request)}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRequest(request._id)}
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
            {activeEligibleRequests.length > 0 && (
              <ViewToggle
                value={votingView}
                onChange={setVotingView}
                currentCount={currentActiveRequests.length}
                pastCount={pastActiveRequests.length}
              />
            )}
            {activeEligibleRequests.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title="No voting data available"
              />
            ) : displayedVotingRequests.length === 0 ? (
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
                {displayedVotingRequests.map((request) => {
                  const { assist, notAssist } = calculateVotes(request);
                  const total = assist + notAssist;
                  const daysLabel = getDaysRemainingLabel(request.votingDeadline);
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
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                            {request.title}
                          </Typography>
                          <StatusChip status={request.status} />
                          {request.status === "Voting" && daysLabel && (
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
                              flex: assist || 0.05,
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "success.main",
                            }}
                          />
                          <Box
                            sx={{
                              flex: notAssist || 0.05,
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
                              label="Assist"
                              value={assist}
                              valueColor="success.main"
                            />
                          </Grid>
                          <Grid size={4}>
                            <MetaItem
                              icon={<CancelIcon fontSize="inherit" />}
                              label="Not Assist"
                              value={notAssist}
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

      {/* Edit Request Dialog */}
      <Dialog
        open={editRequestDialog}
        onClose={() => setEditRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Assistance Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <AssistanceTypePicker
              value={requestForm.assistanceType}
              onChange={(v) =>
                setRequestForm({ ...requestForm, assistanceType: v })
              }
            />
            <Divider />
            <TextField
              fullWidth
              label="Title"
              value={requestForm.title}
              onChange={(e) =>
                setRequestForm({ ...requestForm, title: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRequest} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Request Dialog */}
      <Dialog
        open={createRequestDialog}
        onClose={() => setCreateRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Assistance Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <AssistanceTypePicker
              value={requestForm.assistanceType}
              onChange={(v) =>
                setRequestForm({ ...requestForm, assistanceType: v })
              }
            />
            <Divider />
            <TextField
              fullWidth
              label="Title"
              value={requestForm.title}
              onChange={(e) =>
                setRequestForm({ ...requestForm, title: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRequest} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionReasonDialog}
        onClose={() => setRejectionReasonDialog(false)}
      >
        <DialogTitle>Reject Assistance Request</DialogTitle>
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
            onClick={confirmRejectRequest}
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
