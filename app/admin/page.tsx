"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  LinearProgress,
  Stack,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PieChartIcon from "@mui/icons-material/PieChart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HelpIcon from "@mui/icons-material/Help";
import PendingIcon from "@mui/icons-material/Pending";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

// Stats Card Component
function StatsCard({ title, value, icon, color, action, plainIcon }: any) {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
          {plainIcon ? (
            <Box
              sx={{
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 32 } })}
            </Box>
          ) : (
            <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {action && (
          <Button size="small" onClick={action.onClick} sx={{ mt: 1 }}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalMembers: 0,
    activeInvestments: 0,
    pendingInvestments: 0,
    upcomingEvents: 0,
    pendingProposals: 0,
    pendingBusinesses: 0,
    totalContributions: 0,
    totalSpending: 0,
    totalInvestmentIncome: 0,
    communityWithdrawals: 0,
    remainingIncome: 0,
    availableForInvestment: 0,
    pendingWithdrawals: 0,
    pendingAssistance: 0,
    kycPending: 0,
    kycApproved: 0,
  });

  React.useEffect(() => {
    // Only allow Admins to access this page
    if (session && session.user?.role !== "Admin") {
      router.push("/dashboard");
      return;
    }
    fetchCommunityData();
  }, [session, router]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      const communityRes = await fetch("/api/community");
      if (!communityRes.ok) {
        showError("Failed to fetch community data");
        return;
      }
      const community = await communityRes.json();
      const communityId = community._id;

      // Fetch all community members
      const membersRes = await fetch(`/api/users?communityId=${communityId}`);
      const members = await membersRes.json();

      // Fetch ALL transactions and investments from member's community transactions
      const transactionsRes = await fetch("/api/transactions");
      const allTransactions = await transactionsRes.json();

      // Filter transactions for this community by checking member emails
      const memberEmails = new Set(members.map((m: any) => m.email));
      const communityTransactions = allTransactions.filter((t: any) =>
        memberEmails.has(t.userEmail),
      );

      // Fetch investments
      const investmentsRes = await fetch(
        `/api/investments?community=${communityId}`,
      );
      const investments = await investmentsRes.json();

      // Fetch events
      const eventsRes = await fetch("/api/events");
      const allEvents = await eventsRes.json();

      // Fetch proposals
      const proposalsRes = await fetch("/api/proposals");
      const allProposals = await proposalsRes.json();
      const communityProposals = allProposals.filter(
        (p: any) =>
          (p.community && p.community.toString() === communityId) ||
          p.community === communityId,
      );

      // `community` comes back populated (as {_id, name}) from /api/businesses
      // and /api/events, but as a raw ObjectId string from the other list
      // endpoints below — handle both shapes so the comparison actually matches.
      const matchesCommunity = (communityField: any) => {
        if (!communityField) return false;
        const idStr =
          typeof communityField === "object"
            ? communityField._id?.toString()
            : communityField.toString();
        return idStr === communityId;
      };

      // Fetch businesses
      const businessesRes = await fetch("/api/businesses");
      const allBusinesses = await businessesRes.json();
      const communityBusinesses = allBusinesses.filter((b: any) =>
        matchesCommunity(b.community),
      );

      // Fetch withdrawals
      const withdrawalsRes = await fetch("/api/withdrawals");
      const allWithdrawals = await withdrawalsRes.json();
      const communityWithdrawals = allWithdrawals.filter(
        (w: any) =>
          (w.community && w.community.toString() === communityId) ||
          w.community === communityId,
      );

      // Fetch assistance requests
      const assistanceRes = await fetch("/api/assistance");
      const allAssistance = await assistanceRes.json();
      const communityAssistance = allAssistance.filter(
        (a: any) =>
          (a.community && a.community.toString() === communityId) ||
          a.community === communityId,
      );

      const communityEventsFiltered = allEvents.filter((e: any) =>
        matchesCommunity(e.community),
      );

      // Use the filtered events for all calculations
      const communityEvents = communityEventsFiltered;

      // Calculate total contributions (same logic as member dashboard)
      // Community Deposits: Monthly_Contribution, manual_deposit
      const memberDeposits = communityTransactions.filter(
        (t: any) =>
          (t.type === "Monthly_Contribution" ||
            t.type === "manual_deposit") &&
          t.status === "Completed",
      );

      const totalContributions = memberDeposits.reduce(
        (sum: number, t: any) => sum + t.amount,
        0,
      );

      // Calculate total spending (same logic as member dashboard)
      // Community Withdrawals: Investment, Assistance, Event
      const spendingTransactions = communityTransactions.filter(
        (t: any) =>
          ["Investment", "Assistance", "Event"].includes(t.type) &&
          t.status === "Completed",
      );

      const totalSpending = spendingTransactions.reduce(
        (sum: number, t: any) => sum + t.amount,
        0,
      );

      // Calculate total investment income (profit_deposit)
      const profitDepositTransactions = communityTransactions.filter(
        (t: any) => t.type === "profit_deposit" && t.status === "Completed",
      );

      const totalInvestmentIncome = profitDepositTransactions.reduce(
        (sum: number, t: any) => sum + t.amount,
        0,
      );

      // Calculate community-level withdrawals (all members' Profit Share withdrawals)
      const allProfitShareTransactions = communityTransactions.filter(
        (t: any) => t.type === "Profit Share" && t.status === "Completed",
      );

      const communityTotalWithdrawals = Math.abs(
        allProfitShareTransactions
          .filter((t: any) => t.amount < 0)
          .reduce((sum: number, t: any) => sum + t.amount, 0),
      );

      const remainingIncome = totalInvestmentIncome - communityTotalWithdrawals;
      const availableForInvestment = totalContributions - totalSpending;

      // Get active investments
      const activeInvestments = investments.filter(
        (i: any) => i.status === "Active",
      ).length;

      const pendingInvestments = investments.filter(
        (i: any) => i.status === "Pending",
      ).length;

      // Get upcoming events using same logic as member dashboard
      const now = new Date();
      const upcomingEventsList = communityEvents
        .filter((e: any) => new Date(e.eventDate) > now)
        .sort(
          (a: any, b: any) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
        );

      // Get pending proposals
      const pendingProposalsList = communityProposals.filter(
        (p: any) => p.status === "Pending",
      );

      const pendingBusinessesList = communityBusinesses.filter(
        (b: any) => b.status === "Pending",
      );

      const pendingWithdrawalsList = communityWithdrawals.filter(
        (w: any) => w.status === "Pending",
      );

      const pendingAssistanceList = communityAssistance.filter(
        (a: any) => a.status === "Pending",
      );

      // Calculate KYC stats (using kyc.isVerified instead of kycStatus)
      const kycApprovedCount = members.filter(
        (m: any) => m.kyc?.isVerified === true,
      ).length;

      const kycPendingCount = members.filter(
        (m: any) => !m.kyc?.isVerified,
      ).length;

      setStats({
        totalMembers: members.length,
        activeInvestments,
        pendingInvestments,
        upcomingEvents: upcomingEventsList.length,
        pendingProposals: pendingProposalsList.length,
        pendingBusinesses: pendingBusinessesList.length,
        totalContributions,
        totalSpending,
        totalInvestmentIncome,
        communityWithdrawals: communityTotalWithdrawals,
        remainingIncome: totalInvestmentIncome - communityTotalWithdrawals,
        availableForInvestment: totalContributions - totalSpending,
        pendingWithdrawals: pendingWithdrawalsList.length,
        pendingAssistance: pendingAssistanceList.length,
        kycPending: kycPendingCount,
        kycApproved: kycApprovedCount,
      });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to fetch community data",
      );
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (session?.user?.role !== "Admin") {
    return null;
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        pt: { xs: 1, sm: 1.5, md: 2 },
        pb: { xs: 2, sm: 4, md: 6 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Header */}
      {/* <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your community, members, and activities
        </Typography>
      </Box> */}
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={12}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "text.secondary", mb: 2 }}
          >
            Community Overview
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Community Members"
            value={stats.totalMembers}
            icon={<GroupsIcon />}
            color="primary.main"
            plainIcon
            action={{
              label: "Manage",
              onClick: () => router.push("/admin/users"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Active Investments"
            value={stats.activeInvestments}
            icon={<TrendingUpIcon />}
            color="success.main"
            plainIcon
            action={{
              label: "View All",
              onClick: () => router.push("/admin/investments"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Pending Investments"
            value={stats.pendingInvestments}
            icon={<PendingIcon />}
            color="warning.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/investments"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<EventIcon />}
            color="warning.main"
            plainIcon
            action={{
              label: "View All",
              onClick: () => router.push("/admin/events"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Pending Proposals"
            value={stats.pendingProposals}
            icon={<AssignmentIcon />}
            color="info.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/proposals"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Pending Businesses"
            value={stats.pendingBusinesses}
            icon={<LocationCityIcon />}
            color="warning.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/businesses"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            icon={<PendingIcon />}
            color="warning.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/withdrawals"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="Pending Assistance"
            value={stats.pendingAssistance}
            icon={<HelpIcon />}
            color="info.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/assistance"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="KYC Pending"
            value={stats.kycPending}
            icon={<PendingIcon />}
            color="warning.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/kyc"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4,
          }}
        >
          <StatsCard
            title="KYC Approved"
            value={stats.kycApproved}
            icon={<CheckCircleIcon />}
            color="success.main"
            plainIcon
            action={{
              label: "Review",
              onClick: () => router.push("/admin/kyc"),
            }}
          />
        </Grid>
      </Grid>
      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Financial Performance
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Total Contributions"
            value={formatNaira(stats.totalContributions)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
            plainIcon
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Total Spending"
            value={formatNaira(stats.totalSpending)}
            icon={<MonetizationOnIcon />}
            color="error.main"
            plainIcon
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Available for Investment"
            value={formatNaira(stats.availableForInvestment)}
            icon={<PieChartIcon />}
            color="success.main"
            plainIcon
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Total Investment Income"
            value={formatNaira(stats.totalInvestmentIncome)}
            icon={<TrendingUpIcon />}
            color="success.main"
            plainIcon
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Total Withdrawn by Members"
            value={formatNaira(stats.communityWithdrawals)}
            icon={<MonetizationOnIcon />}
            color="warning.main"
            plainIcon
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2,
          }}
        >
          <StatsCard
            title="Current Income Balance"
            value={formatNaira(stats.remainingIncome)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
            plainIcon
          />
        </Grid>
      </Grid>
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/users")}
              startIcon={<GroupsIcon />}
            >
              Manage Members
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/deposits")}
              startIcon={<MonetizationOnIcon />}
            >
              Manual Deposit
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/withdrawals")}
              startIcon={<PendingIcon />}
            >
              Review Withdrawals
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/investments")}
              startIcon={<TrendingUpIcon />}
            >
              Manage Investments
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/events")}
              startIcon={<EventIcon />}
            >
              Manage Events
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/kyc")}
              startIcon={<CheckCircleIcon />}
            >
              KYC Verification
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}
