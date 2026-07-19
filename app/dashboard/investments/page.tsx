"use client";

import * as React from "react";
import { formatNaira } from "@/lib/utils";
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
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import PaidIcon from "@mui/icons-material/Paid";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PercentIcon from "@mui/icons-material/Percent";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import { useSession } from "next-auth/react";
import MemberInvestmentCard from "@/components/MemberInvestmentCard";
import InvestmentSuggestionForm from "@/components/InvestmentSuggestionForm";
import {
  getCommunityInvestments,
  getCommunityInvestmentSuggestions,
} from "@/services/investmentService";

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
  status: "Active" | "Completed" | "Sold" | "Cancelled";
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
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Voting"
    | "Approved for Investing";
  rejectionReason?: string;
  votingDeadline?: string;
  votes?: Array<{
    userId: string | { _id: string; name?: string; email?: string };
    vote: "yes" | "no";
    votedAt: string;
  }>;
  suggestedBy: { name?: string; email?: string } | any;
  createdAt: string;
}

function getSuggestionStatusMeta(status: InvestmentSuggestion["status"]) {
  switch (status) {
    case "Approved for Investing":
      return { color: "success" as StatColor, icon: <CheckCircleIcon fontSize="small" /> };
    case "Voting":
      return { color: "primary" as StatColor, icon: <HowToVoteIcon fontSize="small" /> };
    case "Pending":
      return { color: "info" as StatColor, icon: <HourglassEmptyIcon fontSize="small" /> };
    case "Rejected":
      return { color: "error" as StatColor, icon: <CancelIcon fontSize="small" /> };
    default:
      return { color: "info" as StatColor, icon: undefined };
  }
}

function formatInvestmentType(type: string): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRiskColor(risk: string): StatColor {
  if (risk === "High") return "error";
  if (risk === "Medium") return "warning";
  return "success";
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

// --- Small presentational helpers -----------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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

function StatusChip({
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

export default function InvestmentsPage() {
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
  const [communityInvestments, setCommunityInvestments] = React.useState<
    CommunityInvestment[]
  >([]);
  const [suggestions, setSuggestions] = React.useState<InvestmentSuggestion[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);
  const [suggestionFormOpen, setSuggestionFormOpen] = React.useState(false);
  const [editingSuggestion, setEditingSuggestion] =
    React.useState<InvestmentSuggestion | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Current vs Past view toggles, one per tab
  const [investmentsView, setInvestmentsView] = React.useState<
    "current" | "past"
  >("current");
  const [suggestionsView, setSuggestionsView] = React.useState<
    "current" | "past"
  >("current");
  const [votingView, setVotingView] = React.useState<"current" | "past">(
    "current"
  );
  const [votingInFlight, setVotingInFlight] = React.useState<{
    id: string;
    vote: "yes" | "no";
  } | null>(null);

  const loadInvestments = React.useCallback(async () => {
    try {
      const [investments, suggestions] = await Promise.all([
        getCommunityInvestments(session?.user?.community || ""),
        getCommunityInvestmentSuggestions(session?.user?.community || ""),
      ]);
      setCommunityInvestments(investments as unknown as CommunityInvestment[]);
      setSuggestions(suggestions as unknown as InvestmentSuggestion[]);
    } catch (err) {
      console.error("Failed to load investments", err);
      showError("Failed to load investments");
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
    openConfirmDialog(
      "Delete Suggestion",
      "Are you sure you want to delete this suggestion? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(
            `/api/investments/suggestions/${suggestionId}`,
            {
              method: "DELETE",
            }
          );

          if (!res.ok) {
            throw new Error("Failed to delete suggestion");
          }

          // Refresh the suggestions list
          await loadInvestments();
          showSuccess("Suggestion deleted");
        } catch (error) {
          console.error("Error deleting suggestion:", error);
          showError("Failed to delete suggestion. Please try again.");
        }
      }
    );
  };

  const handleFormClose = () => {
    setSuggestionFormOpen(false);
    setEditingSuggestion(null);
  };

  const handleVote = async (suggestionId: string, vote: "yes" | "no") => {
    setVotingInFlight({ id: suggestionId, vote });
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
      showError(
        error instanceof Error
          ? error.message
          : "Failed to record vote. Please try again."
      );
    } finally {
      setVotingInFlight(null);
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

  // Community Investments: current = still ongoing (Active), past = no
  // longer active (Completed or Cancelled — also covers legacy "Sold")
  const currentInvestments = communityInvestments.filter(
    (inv) => inv.status === "Active"
  );
  const pastInvestments = communityInvestments.filter(
    (inv) =>
      inv.status === "Completed" ||
      inv.status === "Cancelled" ||
      inv.status === "Sold"
  );
  const displayedInvestments =
    investmentsView === "current" ? currentInvestments : pastInvestments;

  // Your Suggestions: current = still awaiting an admin decision (Pending
  // only); past = admin has decided one way or another — sent to voting,
  // approved for investing, or rejected. Already sorted recent-to-past by
  // the API (createdAt descending).
  const currentUserSuggestions = userSuggestions.filter(
    (s) => s.status === "Pending"
  );
  const pastUserSuggestions = userSuggestions.filter(
    (s) =>
      s.status === "Voting" ||
      s.status === "Rejected" ||
      s.status === "Approved for Investing"
  );
  const displayedUserSuggestions =
    suggestionsView === "current" ? currentUserSuggestions : pastUserSuggestions;

  // Investment Voting: only suggestions that actually went through voting
  // (i.e. have a votingDeadline) — current = still voting, past = resolved
  const votingSuggestions = suggestions.filter((s) => s.votingDeadline);
  const currentVotingSuggestions = votingSuggestions.filter(
    (s) => s.status === "Voting"
  );
  const pastVotingSuggestions = votingSuggestions.filter(
    (s) => s.status === "Approved for Investing" || s.status === "Rejected"
  );
  const displayedVotingSuggestions =
    votingView === "current" ? currentVotingSuggestions : pastVotingSuggestions;

  const stats = calculateTotalStats();
  const totalReturn = stats.totalProfitLoss + stats.totalDividends;
  const overallROI =
    stats.totalInvested > 0 ? (totalReturn / stats.totalInvested) * 100 : 0;
  const profitLossColor: StatColor =
    stats.totalProfitLoss >= 0 ? "success" : "error";
  const roiColor: StatColor = overallROI >= 0 ? "success" : "error";

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

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
            <AccountBalanceWalletIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Investments
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              View your portfolio and explore investment opportunities
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
            onClick={() => setSuggestionFormOpen(true)}
          >
            Suggest Investment
          </Button>
        </Stack>
      </Stack>

      {/* Overall Stats */}
      {communityInvestments.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<PaidIcon fontSize="small" />}
              label="Total Invested"
              value={formatNaira(stats.totalInvested, {
                maximumFractionDigits: 2,
              })}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<ShowChartIcon fontSize="small" />}
              label="Current Value"
              value={formatNaira(stats.totalCurrentValue, {
                maximumFractionDigits: 2,
              })}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={
                stats.totalProfitLoss >= 0 ? (
                  <TrendingUpIcon fontSize="small" />
                ) : (
                  <TrendingDownIcon fontSize="small" />
                )
              }
              label="Profit/Loss"
              value={formatNaira(stats.totalProfitLoss, {
                maximumFractionDigits: 2,
              })}
              color={profitLossColor}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<PercentIcon fontSize="small" />}
              label="Overall ROI"
              value={`${overallROI >= 0 ? "+" : ""}${overallROI.toFixed(2)}%`}
              color={roiColor}
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Investment tabs"
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
            icon={<AccountBalanceWalletIcon fontSize="small" />}
            iconPosition="start"
            label={`Community Investments (${communityInvestments.length})`}
            id="investment-tab-0"
            aria-controls="investment-tabpanel-0"
          />
          <Tab
            icon={<LightbulbIcon fontSize="small" />}
            iconPosition="start"
            label={`Your Suggestions (${userSuggestions.length})`}
            id="investment-tab-1"
            aria-controls="investment-tabpanel-1"
          />
          <Tab
            icon={<HowToVoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Investment Voting (${votingSuggestions.length})`}
            id="investment-tab-2"
            aria-controls="investment-tabpanel-2"
          />
        </Tabs>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3 }}>
          {/* Tab 1: Community Investments */}
          <TabPanel value={tabValue} index={0}>
            {communityInvestments.length > 0 && (
              <ViewToggle
                value={investmentsView}
                onChange={setInvestmentsView}
                currentCount={currentInvestments.length}
                pastCount={pastInvestments.length}
              />
            )}
            {communityInvestments.length === 0 ? (
              <EmptyState
                icon={<AccountBalanceWalletIcon />}
                title="No community investments yet"
                description="Start by suggesting an investment opportunity for your community"
                action={
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon />}
                    onClick={() => setSuggestionFormOpen(true)}
                  >
                    Suggest Investment
                  </Button>
                }
              />
            ) : displayedInvestments.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  investmentsView === "current"
                    ? "No current investments"
                    : "No past investments yet"
                }
              />
            ) : (
              <Grid container spacing={{ xs: 1.5, sm: 3 }}>
                {displayedInvestments.map((investment) => (
                  <Grid
                    key={investment.id}
                    size={{
                      xs: 6,
                      md: 6,
                      lg: 4,
                    }}
                  >
                    <MemberInvestmentCard {...investment} />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 2: Your Investment Suggestions */}
          <TabPanel value={tabValue} index={1}>
            {userSuggestions.length > 0 && (
              <ViewToggle
                value={suggestionsView}
                onChange={setSuggestionsView}
                currentCount={currentUserSuggestions.length}
                pastCount={pastUserSuggestions.length}
              />
            )}
            {userSuggestions.length === 0 ? (
              <EmptyState
                icon={<LightbulbIcon />}
                title="No investment suggestions yet"
                description="Be the first to suggest an investment opportunity"
                action={
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon />}
                    onClick={() => setSuggestionFormOpen(true)}
                  >
                    Suggest Investment
                  </Button>
                }
              />
            ) : displayedUserSuggestions.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  suggestionsView === "current"
                    ? "No suggestions awaiting a decision"
                    : "No past suggestions yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedUserSuggestions.map((suggestion) => (
                  <Grid key={suggestion.id} size={{ xs: 12, lg: 6 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        height: "100%",
                        borderLeft: (theme) =>
                          `4px solid ${
                            theme.palette[getSuggestionStatusMeta(suggestion.status).color]
                              .main
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
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: "1.05rem",
                              textDecoration:
                                suggestion.status === "Approved for Investing"
                                  ? "line-through"
                                  : "none",
                            }}
                          >
                            {suggestion.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Your Suggestion
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                        >
                          <Chip
                            label={formatInvestmentType(suggestion.investmentType)}
                            size="small"
                            variant="outlined"
                          />
                          <StatusChip status={suggestion.status} />
                        </Stack>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {suggestion.description}
                      </Typography>

                      <ReasonBox reason={suggestion.reason} />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<PaidIcon fontSize="inherit" />}
                            label="Amount"
                            value={formatNaira(suggestion.amountRequired, {
                              maximumFractionDigits: 2,
                            })}
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
                            valueColor={`${getRiskColor(suggestion.riskLevel)}.main`}
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
                      </Grid>

                      <Divider sx={{ mb: 2 }} />

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 1, fontWeight: 600 }}
                        >
                          Status Updates
                        </Typography>
                        {suggestion.status === "Pending" && (
                          <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                            ⏳ Awaiting review by community admin
                          </Alert>
                        )}
                        {suggestion.status === "Voting" && (
                          <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                            🗳️ Approved! Your suggestion is now open for
                            community voting
                            {getDaysRemainingLabel(suggestion.votingDeadline) && (
                              <>
                                {" "}
                                — {getDaysRemainingLabel(suggestion.votingDeadline)}
                              </>
                            )}
                          </Alert>
                        )}
                        {suggestion.status === "Approved for Investing" && (
                          <Alert severity="success" sx={{ fontSize: "0.875rem" }}>
                            🎉 Voting closed — the community approved this for
                            investing!
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

                      {/* Action Buttons: creator can only edit/delete before it's approved */}
                      {(suggestion.status === "Pending" ||
                        suggestion.status === "Rejected") && (
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
                            {suggestion.status === "Rejected"
                              ? "Edit & Resubmit"
                              : "Edit"}
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
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 3: Investment Voting */}
          <TabPanel value={tabValue} index={2}>
            {votingSuggestions.length > 0 && (
              <ViewToggle
                value={votingView}
                onChange={setVotingView}
                currentCount={currentVotingSuggestions.length}
                pastCount={pastVotingSuggestions.length}
              />
            )}
            {votingSuggestions.length === 0 ? (
              <EmptyState
                icon={<HowToVoteIcon />}
                title="No investments available for voting"
                description="Check back later when community members submit investment suggestions"
              />
            ) : displayedVotingSuggestions.length === 0 ? (
              <EmptyState
                icon={<Inventory2Icon />}
                title={
                  votingView === "current"
                    ? "No investments currently open for voting"
                    : "No past voting results yet"
                }
              />
            ) : (
              <Grid container spacing={2}>
                {displayedVotingSuggestions.map((suggestion) => (
                  <Grid key={suggestion.id} size={{ xs: 12, lg: 6 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        height: "100%",
                        borderLeft: (theme) =>
                          `4px solid ${
                            theme.palette[getSuggestionStatusMeta(suggestion.status).color]
                              .main
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
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                        >
                          <Chip
                            label={formatInvestmentType(suggestion.investmentType)}
                            size="small"
                            variant="outlined"
                          />
                          <StatusChip status={suggestion.status} />
                          {getDaysRemainingLabel(suggestion.votingDeadline) && (
                            <Chip
                              label={getDaysRemainingLabel(
                                suggestion.votingDeadline
                              )}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                        </Stack>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {suggestion.description}
                      </Typography>

                      <ReasonBox reason={suggestion.reason} />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <MetaItem
                            icon={<PaidIcon fontSize="inherit" />}
                            label="Amount"
                            value={formatNaira(suggestion.amountRequired, {
                              maximumFractionDigits: 2,
                            })}
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
                            valueColor={`${getRiskColor(suggestion.riskLevel)}.main`}
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
                      </Grid>

                      <Divider sx={{ mb: 2 }} />

                      {/* Vote counts */}
                      {(() => {
                        const voteCounts = getVoteCount(suggestion);
                        const userVote = getUserVote(suggestion);
                        const isOpen = suggestion.status === "Voting";

                        return (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 1.5, fontWeight: 600 }}
                            >
                              {isOpen
                                ? "Vote on this investment proposal:"
                                : "Final result:"}
                            </Typography>

                            {voteCounts.total > 0 && (
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ mb: 2, alignItems: "center" }}
                              >
                                <Box
                                  sx={{
                                    flex: voteCounts.yes || 0.05,
                                    height: 8,
                                    borderRadius: 999,
                                    bgcolor: "success.main",
                                  }}
                                />
                                <Box
                                  sx={{
                                    flex: voteCounts.no || 0.05,
                                    height: 8,
                                    borderRadius: 999,
                                    bgcolor: "error.main",
                                  }}
                                />
                              </Stack>
                            )}
                            {voteCounts.total > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 2 }}
                              >
                                Yes: {voteCounts.yes} | No: {voteCounts.no} |
                                Total: {voteCounts.total}
                              </Typography>
                            )}

                            {isOpen ? (
                              <>
                                {(() => {
                                  const isVotingThis =
                                    votingInFlight?.id === suggestion.id;
                                  const yesLoading =
                                    isVotingThis &&
                                    votingInFlight?.vote === "yes";
                                  const noLoading =
                                    isVotingThis &&
                                    votingInFlight?.vote === "no";

                                  return (
                                    <Stack direction="row" spacing={2}>
                                      <Button
                                        variant={
                                          userVote === "yes"
                                            ? "contained"
                                            : "outlined"
                                        }
                                        disableElevation
                                        color="success"
                                        sx={{ flex: 1 }}
                                        disabled={
                                          isVotingThis || userVote === "yes"
                                        }
                                        startIcon={
                                          yesLoading ? (
                                            <CircularProgress
                                              size={16}
                                              color="inherit"
                                            />
                                          ) : (
                                            <ThumbUpIcon fontSize="small" />
                                          )
                                        }
                                        onClick={() =>
                                          handleVote(suggestion.id, "yes")
                                        }
                                      >
                                        {yesLoading ? "Voting..." : "Vote Yes"}
                                      </Button>
                                      <Button
                                        variant={
                                          userVote === "no"
                                            ? "contained"
                                            : "outlined"
                                        }
                                        disableElevation
                                        color="error"
                                        sx={{ flex: 1 }}
                                        disabled={
                                          isVotingThis || userVote === "no"
                                        }
                                        startIcon={
                                          noLoading ? (
                                            <CircularProgress
                                              size={16}
                                              color="inherit"
                                            />
                                          ) : (
                                            <ThumbDownIcon fontSize="small" />
                                          )
                                        }
                                        onClick={() =>
                                          handleVote(suggestion.id, "no")
                                        }
                                      >
                                        {noLoading ? "Voting..." : "Vote No"}
                                      </Button>
                                    </Stack>
                                  );
                                })()}
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
                            ) : (
                              <Alert
                                severity={
                                  suggestion.status === "Approved for Investing"
                                    ? "success"
                                    : "error"
                                }
                              >
                                {suggestion.status === "Approved for Investing"
                                  ? "🎉 The community approved this for investing."
                                  : "✗ The community did not approve this investment."}
                              </Alert>
                            )}
                          </>
                        );
                      })()}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Box>
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
