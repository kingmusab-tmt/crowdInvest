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
  Chip,
  Avatar,
  CircularProgress,
  LinearProgress,
  Divider,
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
function StatsCard({ title, value, icon, color, action }: any) {
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
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
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

export default function CommunityAdminDashboard() {
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
  const [communityData, setCommunityData] = React.useState<any>(null);
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
    // Only allow Community Admins to access this page
    if (session && session.user?.role !== "Community Admin") {
      router.push("/dashboard");
      return;
    }
    fetchCommunityData();
  }, [session, router]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      // Fetch user's community and members
      if (session?.user?.email) {
        const userRes = await fetch(`/api/users?email=${session.user.email}`);
        const userData = await userRes.json();

        if (userData.length > 0 && userData[0].community) {
          // Extract community ID - could be string or object with _id
          const communityId =
            typeof userData[0].community === "string"
              ? userData[0].community
              : userData[0].community?._id;

          if (!communityId) {
            showError("Community ID not found");
            return;
          }

          // Fetch community details
          const communityRes = await fetch(`/api/communities/${communityId}`);
          if (communityRes.ok) {
            const community = await communityRes.json();
            setCommunityData(community);
          }

          // Fetch all community members
          const membersRes = await fetch(
            `/api/users?communityId=${communityId}`
          );
          const members = await membersRes.json();

          // Fetch ALL transactions and investments from member's community transactions
          const transactionsRes = await fetch("/api/transactions");
          const allTransactions = await transactionsRes.json();

          // Filter transactions for this community by checking member emails
          const memberEmails = new Set(members.map((m: any) => m.email));
          const communityTransactions = allTransactions.filter((t: any) =>
            memberEmails.has(t.userEmail)
          );

          console.log("Transaction filtering:", {
            totalMembers: members.length,
            memberEmails: Array.from(memberEmails),
            totalTransactions: allTransactions.length,
            communityTransactionsCount: communityTransactions.length,
          });

          // Fetch investments
          const investmentsRes = await fetch(
            `/api/investments?community=${communityId}`
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
              p.community === communityId
          );

          // Fetch businesses
          const businessesRes = await fetch("/api/businesses");
          const allBusinesses = await businessesRes.json();
          const communityBusinesses = allBusinesses.filter(
            (b: any) =>
              (b.community && b.community.toString() === communityId) ||
              b.community === communityId
          );

          // Fetch withdrawals
          const withdrawalsRes = await fetch("/api/withdrawals");
          const allWithdrawals = await withdrawalsRes.json();
          const communityWithdrawals = allWithdrawals.filter(
            (w: any) =>
              (w.community && w.community.toString() === communityId) ||
              w.community === communityId
          );

          // Fetch assistance requests
          const assistanceRes = await fetch("/api/assistance");
          const allAssistance = await assistanceRes.json();
          const communityAssistance = allAssistance.filter(
            (a: any) =>
              (a.community && a.community.toString() === communityId) ||
              a.community === communityId
          );

          console.log("Community ID:", communityId);
          console.log("Total transactions fetched:", allTransactions.length);
          console.log("Community transactions:", communityTransactions.length);
          console.log(
            "All events fetched:",
            allEvents.length,
            allEvents.map((e: any) => ({
              title: e.title,
              id: e._id,
              community: e.community,
              communityId_str: e.community?.toString?.(),
            }))
          );
          console.log(
            "Filtering events with communityId:",
            communityId,
            "type:",
            typeof communityId
          );

          const communityEventsFiltered = allEvents.filter((e: any) => {
            const eCommunityStr = e.community?.toString?.();
            const match =
              eCommunityStr === communityId || e.community === communityId;
            console.log(
              `Event ${e.title}: community=${eCommunityStr}, communityId=${communityId}, match=${match}`
            );
            return match;
          });

          console.log(
            "Filtered community events:",
            communityEventsFiltered.length
          );

          // Use the filtered events for all calculations
          const communityEvents = communityEventsFiltered;

          // Calculate total contributions (same logic as member dashboard)
          // Community Deposits: Monthly_Contribution, manual_deposit, refund_deposit
          const memberDeposits = communityTransactions.filter(
            (t: any) =>
              (t.type === "Monthly_Contribution" ||
                t.type === "manual_deposit" ||
                t.type === "refund_deposit") &&
              t.status === "Completed"
          );

          const totalContributions = memberDeposits.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );

          console.log("Total Contributions Calculation:", {
            depositTransactions: memberDeposits.length,
            total: totalContributions,
            breakdown: memberDeposits.map((t: any) => ({
              type: t.type,
              amount: t.amount,
              date: t.date,
              email: t.userEmail,
            })),
          });

          // Calculate total spending (same logic as member dashboard)
          // Community Withdrawals: Investment, Assistance, Event
          const spendingTransactions = communityTransactions.filter(
            (t: any) =>
              ["Investment", "Assistance", "Event"].includes(t.type) &&
              t.status === "Completed"
          );

          const totalSpending = spendingTransactions.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );

          console.log("Total Spending Calculation:", {
            spendingTransactions: spendingTransactions.length,
            total: totalSpending,
            breakdown: spendingTransactions.map((t: any) => ({
              type: t.type,
              amount: t.amount,
              date: t.date,
              email: t.userEmail,
            })),
          });

          // Calculate total investment income (profit_deposit)
          const profitDepositTransactions = communityTransactions.filter(
            (t: any) => t.type === "profit_deposit" && t.status === "Completed"
          );

          const totalInvestmentIncome = profitDepositTransactions.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );

          console.log("Total Investment Income:", {
            profitDeposits: profitDepositTransactions.length,
            total: totalInvestmentIncome,
            breakdown: profitDepositTransactions.map((t: any) => ({
              amount: t.amount,
              date: t.date,
            })),
          });

          // Calculate community-level withdrawals (all members' Profit Share withdrawals)
          const allProfitShareTransactions = communityTransactions.filter(
            (t: any) => t.type === "Profit Share" && t.status === "Completed"
          );

          const communityTotalWithdrawals = Math.abs(
            allProfitShareTransactions
              .filter((t: any) => t.amount < 0)
              .reduce((sum: number, t: any) => sum + t.amount, 0)
          );

          console.log("Community Withdrawals:", {
            profitShareTransactions: allProfitShareTransactions.length,
            negativeTransactions: allProfitShareTransactions.filter(
              (t: any) => t.amount < 0
            ).length,
            total: communityTotalWithdrawals,
          });

          const remainingIncome =
            totalInvestmentIncome - communityTotalWithdrawals;
          const availableForInvestment = totalContributions - totalSpending;

          // Calculate active and inactive members (based on Monthly_Contribution in last 3 months)
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

          let activeMembers = 0;
          let inactiveMembers = 0;

          for (const member of members) {
            const memberMonthlyContributions = communityTransactions.filter(
              (t: any) =>
                t.userEmail === member.email &&
                t.type === "Monthly_Contribution" &&
                t.status === "Completed" &&
                new Date(t.date) >= threeMonthsAgo
            );

            if (memberMonthlyContributions.length > 0) {
              activeMembers++;
            } else {
              inactiveMembers++;
            }
          }

          console.log("Member Activity:", {
            totalMembers: members.length,
            activeMembers,
            inactiveMembers,
            threeMonthsAgo: threeMonthsAgo.toISOString(),
          });

          // Get active investments
          const activeInvestments = investments.filter(
            (i: any) => i.status === "Active"
          ).length;

          const pendingInvestments = investments.filter(
            (i: any) => i.status === "Pending"
          ).length;

          // Get upcoming events using same logic as member dashboard
          const now = new Date();
          const upcomingEventsList = communityEvents
            .filter((e: any) => new Date(e.eventDate) > now)
            .sort(
              (a: any, b: any) =>
                new Date(a.eventDate).getTime() -
                new Date(b.eventDate).getTime()
            );

          console.log("Upcoming Events Debug:", {
            now: now.toISOString(),
            totalCommunityEvents: communityEvents.length,
            upcomingCount: upcomingEventsList.length,
            allEventsWithDates: communityEvents.map((e: any) => ({
              title: e.title,
              eventDate: e.eventDate,
              isUpcoming: new Date(e.eventDate) > now,
            })),
          });

          // Get pending proposals
          const pendingProposalsList = communityProposals.filter(
            (p: any) => p.status === "Pending"
          );

          const pendingBusinessesList = communityBusinesses.filter(
            (b: any) => b.status === "Pending"
          );

          const pendingWithdrawalsList = communityWithdrawals.filter(
            (w: any) => w.status === "Pending"
          );

          const pendingAssistanceList = communityAssistance.filter(
            (a: any) => a.status === "Pending"
          );

          // Calculate KYC stats (using kyc.isVerified instead of kycStatus)
          const kycApprovedCount = members.filter(
            (m: any) => m.kyc?.isVerified === true
          ).length;

          const kycPendingCount = members.filter(
            (m: any) => !m.kyc?.isVerified
          ).length;

          console.log("KYC Stats:", {
            totalMembers: members.length,
            kycApproved: kycApprovedCount,
            kycPending: kycPendingCount,
            memberDetails: members.map((m: any) => ({
              name: m.name,
              email: m.email,
              kycVerified: m.kyc?.isVerified,
            })),
          });

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
        }
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to fetch community data"
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

  if (session?.user?.role !== "Community Admin") {
    return null;
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4, md: 6 }, px: { xs: 1.5, sm: 2 } }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
          }}
        >
          Community Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your community, members, and activities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Community Overview
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Community Members"
            value={stats.totalMembers}
            icon={<GroupsIcon />}
            color="primary.main"
            action={{
              label: "Manage",
              onClick: () => router.push("/admin/community-members"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Investments"
            value={stats.activeInvestments}
            icon={<TrendingUpIcon />}
            color="success.main"
            action={{
              label: "View All",
              onClick: () => router.push("/admin/investments"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Investments"
            value={stats.pendingInvestments}
            icon={<PendingIcon />}
            color="warning.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/investments"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<EventIcon />}
            color="warning.main"
            action={{
              label: "View All",
              onClick: () => router.push("/admin/events"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Proposals"
            value={stats.pendingProposals}
            icon={<AssignmentIcon />}
            color="info.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/proposals"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Businesses"
            value={stats.pendingBusinesses}
            icon={<LocationCityIcon />}
            color="warning.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/businesses"),
            }}
          />
        </Grid>
      </Grid>

      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Financial Performance
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Contributions"
            value={formatNaira(stats.totalContributions)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Spending"
            value={formatNaira(stats.totalSpending)}
            icon={<MonetizationOnIcon />}
            color="error.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Available for Investment"
            value={formatNaira(stats.availableForInvestment)}
            icon={<PieChartIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Investment Income Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Investment Income
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Investment Income"
            value={formatNaira(stats.totalInvestmentIncome)}
            icon={<TrendingUpIcon />}
            color="success.main"
            action={{
              label: "Add Deposit",
              onClick: () => router.push("/admin/deposits"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Withdrawn by Members"
            value={formatNaira(stats.communityWithdrawals)}
            icon={<MonetizationOnIcon />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Current Income Balance"
            value={formatNaira(stats.remainingIncome)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
          />
        </Grid>
      </Grid>

      {/* Pending Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Pending Actions
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            icon={<PendingIcon />}
            color="warning.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/withdrawals"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Assistance"
            value={stats.pendingAssistance}
            icon={<HelpIcon />}
            color="info.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/assistance"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="KYC Pending"
            value={stats.kycPending}
            icon={<PendingIcon />}
            color="warning.main"
            action={{
              label: "Review",
              onClick: () => router.push("/admin/kyc"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="KYC Approved"
            value={stats.kycApproved}
            icon={<CheckCircleIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Community Info */}
      {communityData && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Community Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Community Name
              </Typography>
              <Typography variant="h6">{communityData.name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={communityData.status}
                color={communityData.status === "Active" ? "success" : "error"}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body1">
                {communityData.description || "No description"}
              </Typography>
            </Grid>
          </Grid>

          {communityData.enabledFunctions && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enabled Features
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {communityData.enabledFunctions.investments && (
                  <Chip
                    label="Investments"
                    size="small"
                    variant="outlined"
                    color="success"
                  />
                )}
                {communityData.enabledFunctions.proposals && (
                  <Chip
                    label="Proposals"
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                )}
                {communityData.enabledFunctions.events && (
                  <Chip
                    label="Events"
                    size="small"
                    variant="outlined"
                    color="warning"
                  />
                )}
                {communityData.enabledFunctions.assistance && (
                  <Chip
                    label="Assistance"
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                {communityData.enabledFunctions.kyc && (
                  <Chip
                    label="KYC"
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                )}
                {communityData.enabledFunctions.withdrawals && (
                  <Chip
                    label="Withdrawals"
                    size="small"
                    variant="outlined"
                    color="error"
                  />
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Financial Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Financial Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Community Contributions
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatNaira(stats.totalContributions)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                All member deposits and contributions
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Community Spending
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "error.main" }}
              >
                {formatNaira(stats.totalSpending)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Investments, events, assistance, etc.
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="textSecondary">
                Available for Investment
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "success.main" }}
              >
                {formatNaira(stats.availableForInvestment)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Contributions minus spending
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Investment Income Achieved
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "success.main" }}
              >
                {formatNaira(stats.totalInvestmentIncome)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                All profit deposits received
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Withdrawn by Members
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "warning.main" }}
              >
                {formatNaira(stats.communityWithdrawals)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Member withdrawals and contributions from profit share
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="textSecondary">
                Current Investment Income Balance
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "primary.main" }}
              >
                {formatNaira(stats.remainingIncome)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Remaining after member withdrawals
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/community-members")}
              startIcon={<GroupsIcon />}
            >
              Manage Members
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/deposits")}
              startIcon={<MonetizationOnIcon />}
            >
              Manual Deposit
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/withdrawals")}
              startIcon={<PendingIcon />}
            >
              Review Withdrawals
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/investments")}
              startIcon={<TrendingUpIcon />}
            >
              Manage Investments
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/events")}
              startIcon={<EventIcon />}
            >
              Manage Events
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
        <Button variant="outlined" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </Box>

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}
