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
  Alert,
  Chip,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import PaidIcon from "@mui/icons-material/Paid";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SellIcon from "@mui/icons-material/Sell";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SecurityIcon from "@mui/icons-material/Security";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  INVESTMENT_TYPE_CONFIG,
  INVESTMENT_TYPE_OPTIONS,
  InvestmentType,
} from "@/lib/investmentTypes";
import { usePlatformSettings } from "@/components/PlatformSettingsContext";

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
  reason: string;
  investmentType: string;
  amountRequired: number;
  timeframe: string;
  expectedReturn?: string;
  riskLevel: string;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Voting"
    | "Approved for Investing";
  suggestedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votingDeadline?: string;
  votes?: Array<{ userId: string; vote: "yes" | "no"; votedAt: string }>;
}

interface Investment {
  _id: string;
  title: string;
  description?: string;
  investmentType: string;
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold" | "Cancelled";
  community: string;
  user?: string;
  currentValue?: number;
  profitOrLoss?: number;
  profitOrLossPercentage?: number;
  purchaseDate?: string;
  createdAt: string;
  metadata?: Record<string, any>;
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

function investmentTypeLabel(type: string): string {
  return INVESTMENT_TYPE_CONFIG[type as InvestmentType]?.label || type;
}

function getInvestmentStatusMeta(status: Investment["status"]) {
  switch (status) {
    case "Active":
      return { color: "success" as StatColor, icon: <TrendingUpIcon fontSize="small" /> };
    case "Completed":
      return { color: "primary" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "Sold":
      return { color: "info" as StatColor, icon: <SellIcon fontSize="small" /> };
    case "Cancelled":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    default:
      return { color: "info" as StatColor, icon: undefined };
  }
}

function getSuggestionStatusMeta(status: InvestmentSuggestion["status"]) {
  switch (status) {
    case "Approved for Investing":
      return { color: "success" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "Voting":
      return { color: "info" as StatColor, icon: <HowToVoteIcon fontSize="small" /> };
    case "Rejected":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    default:
      return { color: "warning" as StatColor, icon: <HourglassEmptyIcon fontSize="small" /> };
  }
}

const EMPTY_INVESTMENT_FORM = {
  title: "",
  description: "",
  investmentType: "stock" as InvestmentType,
  basePrice: 0,
  currentPrice: 0,
  quantity: 0,
  totalInvested: 0,
  dividendReceived: 0,
  status: "Active" as "Active" | "Completed" | "Sold" | "Cancelled",
  metadata: {} as Record<string, string>,
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

function InvestmentStatusChip({ status }: { status: Investment["status"] }) {
  const meta = getInvestmentStatusMeta(status);
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

function SuggestionStatusChip({
  status,
}: {
  status: InvestmentSuggestion["status"];
}) {
  const meta = getSuggestionStatusMeta(status);
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

function ReasonBox({ reason }: { reason: string }) {
  return (
    <Box
      sx={{
        mb: 2,
        p: 1.75,
        bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.06),
        borderLeft: (theme: Theme) => `3px solid ${theme.palette.primary.main}`,
        borderRadius: 1,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
        <FormatQuoteIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Why this is genuine &amp; profitable
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {reason}
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

export default function InvestmentsPage() {
  const { data: session } = useSession();
  const { settings: platformSettings } = usePlatformSettings();
  const availableInvestmentTypes = React.useMemo(
    () =>
      platformSettings.enabledInvestmentTypes.length > 0
        ? INVESTMENT_TYPE_OPTIONS.filter((opt) =>
            platformSettings.enabledInvestmentTypes.includes(opt.value)
          )
        : INVESTMENT_TYPE_OPTIONS,
    [platformSettings.enabledInvestmentTypes]
  );
  const router = useRouter();
  const { snackbar, closeSnackbar, showWarning } = useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<InvestmentSuggestion[]>(
    []
  );
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Current vs Past view toggles
  const [investmentsView, setInvestmentsView] = React.useState<
    "current" | "past"
  >("current");
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );

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

  // Form state
  const [investmentForm, setInvestmentForm] = React.useState(
    EMPTY_INVESTMENT_FORM
  );

  const selectedTypeConfig =
    INVESTMENT_TYPE_CONFIG[investmentForm.investmentType];

  React.useEffect(() => {
    if (session?.user?.role) {
      loadData();
    }
  }, [session?.user?.role, session?.user?.community]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [suggestionsRes, investmentsRes] = await Promise.all([
        fetch("/api/investments/suggestions"),
        fetch("/api/investments"),
      ]);

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data);
      }
      if (investmentsRes.ok) {
        const data = await investmentsRes.json();
        setInvestments(data);
      } else {
        console.error("Investments fetch failed:", investmentsRes.status);
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

  const handleDeleteSuggestion = (suggestionId: string) => {
    openConfirmDialog(
      "Delete Suggestion",
      "Are you sure you want to delete this investment suggestion? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(
            `/api/investments/suggestions/${suggestionId}`,
            { method: "DELETE" }
          );
          if (res.ok) {
            setSuccess("Suggestion deleted");
            loadData();
          } else {
            setError("Failed to delete suggestion");
          }
        } catch (err) {
          setError("Failed to delete suggestion");
        }
      }
    );
  };

  const handleTypeChange = (type: InvestmentType) => {
    setInvestmentForm((prev) => ({
      ...prev,
      investmentType: type,
      metadata: {},
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setInvestmentForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }));
  };

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setInvestmentForm({
      title: investment.title,
      description: investment.description || "",
      investmentType: investment.investmentType as InvestmentType,
      basePrice: investment.basePrice,
      currentPrice: investment.currentPrice,
      quantity: investment.quantity,
      totalInvested: investment.totalInvested,
      dividendReceived: investment.dividendReceived,
      status: investment.status,
      metadata: investment.metadata || {},
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
    if (!investmentForm.title || !investmentForm.totalInvested) {
      setError("Please fill in the required fields");
      return;
    }
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(investmentForm),
      });
      if (res.ok) {
        setSuccess(
          `Investment created — ${formatNaira(
            investmentForm.totalInvested
          )} deducted from funds available for investment`
        );
        setCreateInvestmentDialog(false);
        setInvestmentForm(EMPTY_INVESTMENT_FORM);
        loadData();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create investment");
      }
    } catch (err) {
      setError("Error creating investment");
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    openConfirmDialog(
      "Delete Investment",
      "Are you sure you want to delete this investment? This action cannot be undone.",
      async () => {
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
      }
    );
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === "Pending");

  // Investments: current = still ongoing (Active), past = no longer active
  // (Completed or Cancelled — also covers legacy "Sold")
  const currentInvestments = investments.filter((i) => i.status === "Active");
  const pastInvestments = investments.filter(
    (i) =>
      i.status === "Completed" ||
      i.status === "Cancelled" ||
      i.status === "Sold"
  );
  const displayedInvestments =
    investmentsView === "current" ? currentInvestments : pastInvestments;

  // Voting: only suggestions that actually went through voting (have a
  // votingDeadline) — current = still voting, past = resolved by vote
  const votingSuggestions = suggestions.filter((s) => s.votingDeadline);
  const currentVotingSuggestions = votingSuggestions.filter(
    (s) => s.status === "Voting"
  );
  const pastVotingSuggestions = votingSuggestions.filter(
    (s) =>
      s.status === "Approved for Investing" || s.status === "Rejected"
  );
  const displayedVoting =
    votingView === "current" ? currentVotingSuggestions : pastVotingSuggestions;

  const totalInvestedSum = investments.reduce(
    (sum, inv) => sum + (inv.totalInvested || 0),
    0
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

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
            <AccountBalanceWalletIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Investments Management
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Manage community investments and suggestions
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedInvestment(null);
            setInvestmentForm(EMPTY_INVESTMENT_FORM);
            setCreateInvestmentDialog(true);
          }}
        >
          Add Investment
        </Button>
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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HourglassEmptyIcon fontSize="small" />}
            label="Pending Suggestions"
            value={pendingSuggestions.length}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<AccountBalanceWalletIcon fontSize="small" />}
            label="Active Investments"
            value={currentInvestments.length}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<HowToVoteIcon fontSize="small" />}
            label="In Voting"
            value={currentVotingSuggestions.length}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<PaidIcon fontSize="small" />}
            label="Total Invested"
            value={formatNaira(totalInvestedSum, { maximumFractionDigits: 0 })}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Investment management tabs"
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
            label={`Manage Suggestions (${pendingSuggestions.length})`}
            id="investment-tab-0"
            aria-controls="investment-tabpanel-0"
          />
          <Tab
            icon={<AccountBalanceWalletIcon fontSize="small" />}
            iconPosition="start"
            label={`Investments (${investments.length})`}
            id="investment-tab-1"
            aria-controls="investment-tabpanel-1"
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Community Voting (${votingSuggestions.length})`}
            id="investment-tab-2"
            aria-controls="investment-tabpanel-2"
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Tab 1: Manage Suggestions */}
          <TabPanel value={tabValue} index={0}>
            {pendingSuggestions.length === 0 ? (
              <EmptyState
                icon={<HourglassEmptyIcon />}
                title="No pending investment suggestions"
                description="New member suggestions will show up here for review"
              />
            ) : (
              <Grid container spacing={2}>
                {pendingSuggestions.map((suggestion) => (
                  <Grid key={suggestion._id} size={{ xs: 12, lg: 6 }}>
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
                          mb: 1,
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, fontSize: "1.05rem" }}
                          >
                            {suggestion.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: "center", color: "text.secondary" }}
                          >
                            <PersonIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {suggestion.suggestedBy?.name || "Community Member"}
                            </Typography>
                          </Stack>
                        </Box>
                        <Chip
                          label={investmentTypeLabel(suggestion.investmentType)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.description}
                      </Typography>

                      <ReasonBox reason={suggestion.reason} />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<PaidIcon fontSize="inherit" />}
                            label="Amount"
                            value={formatNaira(suggestion.amountRequired)}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<ScheduleIcon fontSize="inherit" />}
                            label="Timeframe"
                            value={suggestion.timeframe}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<SecurityIcon fontSize="inherit" />}
                            label="Risk Level"
                            value={suggestion.riskLevel}
                            valueColor={
                              suggestion.riskLevel === "High"
                                ? "error.main"
                                : suggestion.riskLevel === "Medium"
                                ? "warning.main"
                                : "success.main"
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<CalendarTodayIcon fontSize="inherit" />}
                            label="Suggested On"
                            value={new Date(
                              suggestion.createdAt
                            ).toLocaleDateString()}
                          />
                        </Grid>
                        {suggestion.expectedReturn && (
                          <Grid size={12}>
                            <MetaItem
                              icon={<TrendingUpIcon fontSize="inherit" />}
                              label="Expected Return"
                              value={suggestion.expectedReturn}
                            />
                          </Grid>
                        )}
                      </Grid>

                      <Divider sx={{ mb: 2 }} />

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          disableElevation
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
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 2: Investments (Current / Past) */}
          <TabPanel value={tabValue} index={1}>
            <ViewToggle
              value={investmentsView}
              onChange={setInvestmentsView}
              currentCount={currentInvestments.length}
              pastCount={pastInvestments.length}
            />

            {displayedInvestments.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  investmentsView === "current"
                    ? "No current investments"
                    : "No past investments yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedInvestments.map((investment) => (
                  <Grid
                    key={investment._id}
                    size={{
                      xs: 12,
                      md: 6,
                      lg: 4,
                    }}
                  >
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
                            theme.palette[
                              getInvestmentStatusMeta(investment.status).color
                            ].main
                          }`,
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
                          {investment.title}
                        </Typography>
                        <Box sx={{ flexShrink: 0 }}>
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

                      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                        <Chip
                          label={investmentTypeLabel(investment.investmentType)}
                          size="small"
                          variant="outlined"
                        />
                        <InvestmentStatusChip status={investment.status} />
                      </Stack>

                      {investment.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {investment.description}
                        </Typography>
                      )}

                      <Grid container spacing={1.5}>
                        <Grid size={6}>
                          <MetaItem
                            icon={<PaidIcon fontSize="inherit" />}
                            label="Base Price"
                            value={formatNaira(investment.basePrice)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <MetaItem
                            icon={<ShowChartIcon fontSize="inherit" />}
                            label="Current Price"
                            value={formatNaira(investment.currentPrice)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <MetaItem
                            icon={<Inventory2Icon fontSize="inherit" />}
                            label="Quantity"
                            value={investment.quantity}
                          />
                        </Grid>
                        <Grid size={6}>
                          <MetaItem
                            icon={<AccountBalanceWalletIcon fontSize="inherit" />}
                            label="Total Invested"
                            value={formatNaira(investment.totalInvested)}
                          />
                        </Grid>
                        <Grid size={12}>
                          <MetaItem
                            icon={<TrendingUpIcon fontSize="inherit" />}
                            label="Dividend Received"
                            value={formatNaira(investment.dividendReceived)}
                            valueColor="success.main"
                          />
                        </Grid>
                      </Grid>

                      {investment.metadata &&
                        Object.keys(investment.metadata).length > 0 && (
                          <>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={0.5}>
                              {Object.entries(investment.metadata).map(
                                ([key, value]) =>
                                  value ? (
                                    <Box
                                      key={key}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {INVESTMENT_TYPE_CONFIG[
                                          investment.investmentType as InvestmentType
                                        ]?.fields.find((f) => f.name === key)
                                          ?.label || key}
                                      </Typography>
                                      <Typography variant="caption">
                                        {String(value)}
                                      </Typography>
                                    </Box>
                                  ) : null
                              )}
                            </Stack>
                          </>
                        )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 3: Community Voting (Current / Past) */}
          <TabPanel value={tabValue} index={2}>
            <ViewToggle
              value={votingView}
              onChange={setVotingView}
              currentCount={currentVotingSuggestions.length}
              pastCount={pastVotingSuggestions.length}
            />

            {displayedVoting.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title={
                  votingView === "current"
                    ? "No voting in progress"
                    : "No past voting results yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedVoting.map((suggestion) => {
                  const votes = suggestion.votes || [];
                  const yesVotes = votes.filter((v) => v.vote === "yes").length;
                  const noVotes = votes.filter((v) => v.vote === "no").length;
                  const totalVoters = votes.length;
                  const isCurrent = suggestion.status === "Voting";
                  const daysLabel = getDaysRemainingLabel(
                    suggestion.votingDeadline
                  );

                  return (
                    <Grid key={suggestion._id} size={{ xs: 12, lg: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          height: "100%",
                          borderLeft: (theme) =>
                            `4px solid ${
                              theme.palette[
                                getSuggestionStatusMeta(suggestion.status).color
                              ].main
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
                              {suggestion.title}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center", flexWrap: "wrap" }}
                            >
                              <SuggestionStatusChip status={suggestion.status} />
                              {isCurrent && daysLabel && (
                                <Chip
                                  label={daysLabel}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              )}
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Chip
                              label={`${yesVotes} Yes | ${noVotes} No`}
                              size="small"
                              color="primary"
                            />
                            <Tooltip title="Delete suggestion">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteSuggestion(suggestion._id)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1 }}
                        >
                          Voting Progress ({yesVotes + noVotes} of {totalVoters}{" "}
                          voters)
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mb: 2, alignItems: "center" }}
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

                        <Grid container spacing={2}>
                          <Grid size={6}>
                            <MetaItem
                              icon={<CheckCircleIcon fontSize="inherit" />}
                              label="Yes Votes"
                              value={yesVotes}
                              valueColor="success.main"
                            />
                          </Grid>
                          <Grid size={6}>
                            <MetaItem
                              icon={<CancelIcon fontSize="inherit" />}
                              label="No Votes"
                              value={noVotes}
                              valueColor="error.main"
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
              value={investmentTypeLabel(investmentForm.investmentType)}
              fullWidth
              disabled
            />
            <TextField
              select
              label="Status"
              value={investmentForm.status}
              onChange={(e) =>
                setInvestmentForm({
                  ...investmentForm,
                  status: e.target.value as
                    | "Active"
                    | "Completed"
                    | "Sold"
                    | "Cancelled",
                })
              }
              fullWidth
              helperText="Move this investment to Completed or Cancelled to close it out and show it under Past Investments"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Sold">Sold</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
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
          <Stack spacing={3}>
            {/* Investment type picker */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Investment Type
              </Typography>
              <Grid container spacing={1}>
                {availableInvestmentTypes.map((opt) => {
                  const selected = investmentForm.investmentType === opt.value;
                  return (
                    <Grid key={opt.value} size={{ xs: 6, sm: 4 }}>
                      <Paper
                        onClick={() => handleTypeChange(opt.value)}
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

            {/* Basic info */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Basic Information
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Investment Title"
                  value={investmentForm.title}
                  onChange={(e) =>
                    setInvestmentForm({
                      ...investmentForm,
                      title: e.target.value,
                    })
                  }
                  fullWidth
                  required
                />
                <TextField
                  label="Description (Optional)"
                  value={investmentForm.description}
                  onChange={(e) =>
                    setInvestmentForm({
                      ...investmentForm,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Financial details */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Financial Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Base Price"
                    type="number"
                    value={investmentForm.basePrice}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Current Price"
                    type="number"
                    value={investmentForm.currentPrice}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        currentPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={investmentForm.quantity}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Total Invested"
                    type="number"
                    value={investmentForm.totalInvested}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        totalInvested: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Dividend Received (Optional)"
                    type="number"
                    value={investmentForm.dividendReceived}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        dividendReceived: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>
              {investmentForm.totalInvested > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {formatNaira(investmentForm.totalInvested)} will
                  automatically be deducted from funds available for
                  investment and recorded as community spending.
                </Alert>
              )}
            </Box>

            {selectedTypeConfig && selectedTypeConfig.fields.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
                    {selectedTypeConfig.label} Details
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedTypeConfig.fields.map((field) => (
                      <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label={field.label}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={investmentForm.metadata[field.name] || ""}
                          onChange={(e) =>
                            handleMetadataChange(field.name, e.target.value)
                          }
                          fullWidth
                          slotProps={
                            field.type === "date"
                              ? { inputLabel: { shrink: true } }
                              : undefined
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </>
            )}
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
