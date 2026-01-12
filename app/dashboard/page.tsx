"use client";

import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PieChartIcon from "@mui/icons-material/PieChart";
import EventIcon from "@mui/icons-material/Event";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
      </CardContent>
      {action && (
        <CardActions>
          <Button size="small" onClick={action.onClick}>
            {action.label}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

// Investment Card Component
function InvestmentCard({ investment }: any) {
  const router = useRouter();

  // Handle both MemberInvestment and community investment formats
  const progress = investment.currentValue
    ? (investment.currentValue / investment.totalInvested) * 100
    : 0;
  const title = investment.title || "Investment";
  const profitOrLoss = investment.profitOrLoss || 0;
  const profitOrLossPercentage = investment.profitOrLossPercentage || 0;
  const status = investment.status || "Active";

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {investment.investmentType &&
            `${
              investment.investmentType.charAt(0).toUpperCase() +
              investment.investmentType.slice(1)
            } Investment`}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Value</Typography>
            <Typography variant="body2">{progress.toFixed(1)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {formatNaira(investment.totalInvested || 0)} invested
          </Typography>
          <Chip
            label={status}
            size="small"
            color={
              status === "Active"
                ? "success"
                : status === "Completed"
                ? "warning"
                : "error"
            }
          />
        </Box>
        <Typography
          variant="caption"
          color={profitOrLoss >= 0 ? "success.main" : "error.main"}
        >
          Profit/Loss: {formatNaira(profitOrLoss)} (
          {profitOrLossPercentage.toFixed(2)}%)
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => router.push(`/dashboard/investments`)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}

export default function UserDashboard() {
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
  const [investments, setInvestments] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [userBalance, setUserBalance] = React.useState(0);
  const [openEventModal, setOpenEventModal] = React.useState(false);
  const [eventFormData, setEventFormData] = React.useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Community contribution stats
  const [totalCommunityContributions, setTotalCommunityContributions] =
    React.useState(0);
  const [memberContribution, setMemberContribution] = React.useState(0);
  const [contributionPercentage, setContributionPercentage] = React.useState(0);
  const [totalSpending, setTotalSpending] = React.useState(0);
  const [totalIncome, setTotalIncome] = React.useState(0);
  const [communityTotalWithdrawals, setCommunityTotalWithdrawals] =
    React.useState(0);
  const [communityRemainingIncome, setCommunityRemainingIncome] =
    React.useState(0);
  const [memberProfitShare, setMemberProfitShare] = React.useState(0);
  const [memberTotalWithdrawn, setMemberTotalWithdrawn] = React.useState(0);
  const [memberGrossProfitShare, setMemberGrossProfitShare] = React.useState(0);
  const [monthlyContributionStatus, setMonthlyContributionStatus] =
    React.useState({
      hasPaid: false,
      amount: 0,
      dueDate: "",
    });
  const [lastContribution, setLastContribution] = React.useState({
    amount: 0,
    date: "",
  });
  const [lastMonthContributors, setLastMonthContributors] = React.useState(0);
  const [upcomingEvents, setUpcomingEvents] = React.useState({
    count: 0,
    closestDate: "",
  });
  const [memberBusinessCount, setMemberBusinessCount] = React.useState(0);
  const [totalCommunityMembers, setTotalCommunityMembers] = React.useState(0);
  const [activeMembers, setActiveMembers] = React.useState(0);
  const [inactiveMembers, setInactiveMembers] = React.useState(0);
  const [myTotalWithdrawal, setMyTotalWithdrawal] = React.useState(0);

  // Define all async functions BEFORE useEffect
  const verifyPaymentIfReturned = React.useCallback(async () => {
    // Check if user returned from payment redirect
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    const paymentStatus = params.get("payment");

    if (reference || paymentStatus) {
      // Wait a brief moment for webhook to process, then refetch data
      setTimeout(() => {
        fetchDashboardData();
      }, 1500);

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkMonthlyContributions = React.useCallback(async () => {
    try {
      // Trigger monthly contribution notification check
      await fetch("/api/contributions/check-monthly", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to check monthly contributions:", error);
      // Silent fail - don't disrupt user experience
    }
  }, []);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setIsRefreshing(true);

      // Get user's community ID
      const userCommunityId = session?.user?.community;

      // Fetch investments filtered by user's community
      const investmentsRes = await fetch(
        userCommunityId
          ? `/api/investments?community=${userCommunityId}`
          : "/api/investments"
      );
      const investmentsData = await investmentsRes.json();
      setInvestments(
        investmentsData
          .filter((inv: any) => inv.status === "Active")
          .slice(0, 3)
      );

      // Fetch transactions
      const transactionsRes = await fetch("/api/transactions");
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      // Fetch events
      const eventsRes = await fetch("/api/events");
      const eventsData = await eventsRes.json();

      // Filter to show only upcoming events, sorted by date
      const now = new Date();
      const upcomingEventsList = eventsData
        .filter((e: any) => new Date(e.eventDate) > now)
        .sort(
          (a: any, b: any) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        )
        .slice(0, 3);

      setEvents(upcomingEventsList);

      // Get user data and calculate contribution stats
      if (session?.user) {
        const userRes = await fetch(`/api/users?email=${session.user.email}`);
        const userData = await userRes.json();
        if (userData.length > 0) {
          const currentUser = userData[0];
          setUserBalance(currentUser.balance || 0);

          // Calculate member's total contributions
          const memberDeposits = transactionsData.filter(
            (t: any) =>
              t.userEmail === session.user.email &&
              (t.type === "Monthly_Contribution" ||
                t.type === "manual_deposit" ||
                t.type === "refund_deposit") &&
              t.status === "Completed"
          );
          const memberTotalContribution = memberDeposits.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );
          setMemberContribution(memberTotalContribution);

          // Calculate total community contributions (all members' deposits)
          const allDeposits = transactionsData.filter(
            (t: any) =>
              (t.type === "Monthly_Contribution" ||
                t.type === "manual_deposit" ||
                t.type === "refund_deposit") &&
              t.status === "Completed"
          );
          const communityTotal = allDeposits.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );
          setTotalCommunityContributions(communityTotal);

          // Calculate contribution percentage
          const percentage =
            communityTotal > 0
              ? (memberTotalContribution / communityTotal) * 100
              : 0;
          setContributionPercentage(percentage);

          // Calculate total spending (all admin withdrawal types)
          const spendingTransactions = transactionsData.filter(
            (t: any) =>
              t.isAdminTransaction === true &&
              ["Investment", "Profit Share", "Assistance", "Event"].includes(
                t.type
              ) &&
              t.status === "Completed"
          );
          const totalSpent = spendingTransactions.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );
          setTotalSpending(totalSpent);

          // Calculate total income from investments (Total Investment Income)
          // This includes profit_deposit transactions which represent actual investment profits
          const profitDepositTransactions = transactionsData.filter(
            (t: any) => t.type === "profit_deposit" && t.status === "Completed"
          );
          const totalInvestmentIncome = profitDepositTransactions.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );
          setTotalIncome(totalInvestmentIncome);

          // Calculate community-level withdrawals (all members)
          // Get all Profit Share transactions (positive = distributions, negative = withdrawals)
          const allProfitShareTransactions = transactionsData.filter(
            (t: any) => t.type === "Profit Share" && t.status === "Completed"
          );

          // Calculate total withdrawals by all members (negative amounts)
          const communityWithdrawals = Math.abs(
            allProfitShareTransactions
              .filter((t: any) => t.amount < 0)
              .reduce((sum: number, t: any) => sum + t.amount, 0)
          );
          setCommunityTotalWithdrawals(communityWithdrawals);

          // Calculate remaining investment income after withdrawals
          const remainingIncome = totalInvestmentIncome - communityWithdrawals;
          setCommunityRemainingIncome(remainingIncome);

          // Calculate member's profit share from actual Profit Share transactions
          // Positive amounts = profit distributions, Negative amounts = withdrawals/contributions
          const memberProfitShareTransactions = transactionsData.filter(
            (t: any) =>
              t.userEmail === session.user.email &&
              t.type === "Profit Share" &&
              t.status === "Completed"
          );

          // Calculate gross profit share (only positive transactions - distributions)
          const grossProfitShare = memberProfitShareTransactions
            .filter((t: any) => t.amount > 0)
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          setMemberGrossProfitShare(grossProfitShare);

          // Calculate total withdrawn (only negative transactions - withdrawals/contributions)
          const totalWithdrawn = Math.abs(
            memberProfitShareTransactions
              .filter((t: any) => t.amount < 0)
              .reduce((sum: number, t: any) => sum + t.amount, 0)
          );
          setMemberTotalWithdrawn(totalWithdrawn);

          // Calculate available profit share (sum of all including negative)
          const availableProfitShare = memberProfitShareTransactions.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );

          console.log("Profit Share Calculation:", {
            contributionPercentage: percentage,
            profitShareTransactions: memberProfitShareTransactions.length,
            grossProfitShare,
            totalWithdrawn,
            availableProfitShare,
          });
          setMemberProfitShare(availableProfitShare);

          // Check monthly contribution status (only for Monthly_Contribution type)
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthlyContributions = transactionsData.filter(
            (t: any) =>
              t.userEmail === session.user.email &&
              t.type === "Monthly_Contribution" &&
              t.status === "Completed"
          );
          const monthlyContribution = monthlyContributions.find((t: any) => {
            const tDate = new Date(t.date);
            return (
              tDate.getMonth() === currentMonth &&
              tDate.getFullYear() === currentYear &&
              t.type === "Monthly_Contribution"
            );
          });

          setMonthlyContributionStatus({
            hasPaid: !!monthlyContribution,
            amount: monthlyContribution?.amount || 0,
            dueDate: new Date(currentYear, currentMonth + 1, 0).toDateString(),
          });

          // Get last contribution (from all deposit types)
          const lastDeposit = memberDeposits.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastContribution({
            amount: lastDeposit?.amount || 0,
            date: lastDeposit?.date
              ? new Date(lastDeposit.date).toLocaleDateString()
              : "Never",
          });

          // Calculate last month contributors
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

          console.log("Calculating last month contributors:", {
            currentMonth,
            currentYear,
            lastMonth,
            lastMonthYear,
            totalTransactions: transactionsData.length,
          });

          const lastMonthDeposits = transactionsData.filter((t: any) => {
            if (!t.type || !t.status) return false;
            if (t.type !== "Monthly_Contribution" || t.status !== "Completed")
              return false;
            if (!t.date) return false;
            const tDate = new Date(t.date);
            const matchesMonth = tDate.getMonth() === lastMonth;
            const matchesYear = tDate.getFullYear() === lastMonthYear;
            return matchesMonth && matchesYear;
          });

          console.log("Last month deposits:", {
            count: lastMonthDeposits.length,
            deposits: lastMonthDeposits.map((d: any) => ({
              email: d.userEmail,
              date: d.date,
              amount: d.amount,
            })),
          });

          const uniqueContributors = new Set(
            lastMonthDeposits.map((t: any) => t.userEmail)
          );

          console.log("Unique contributors:", {
            count: uniqueContributors.size,
            contributors: Array.from(uniqueContributors),
          });

          setLastMonthContributors(uniqueContributors.size);

          // Get upcoming events info
          const futureEvents = eventsData.filter(
            (e: any) => new Date(e.eventDate) > new Date()
          );
          const sortedEvents = futureEvents.sort(
            (a: any, b: any) =>
              new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          );
          setUpcomingEvents({
            count: futureEvents.length,
            closestDate: sortedEvents[0]?.eventDate
              ? new Date(sortedEvents[0].eventDate).toLocaleDateString()
              : "None scheduled",
          });

          // Get member businesses count
          if (currentUser.community) {
            const businessRes = await fetch(
              `/api/businesses?communityId=${
                currentUser.community._id || currentUser.community
              }`
            );
            const businessData = await businessRes.json();
            setMemberBusinessCount(
              Array.isArray(businessData) ? businessData.length : 0
            );

            // Get total community members
            const communityMembersRes = await fetch(
              `/api/users?communityId=${
                currentUser.community._id || currentUser.community
              }`
            );
            const communityMembersData = await communityMembersRes.json();
            const members = Array.isArray(communityMembersData)
              ? communityMembersData
              : [];
            setTotalCommunityMembers(members.length);

            // Calculate active and inactive members
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            let activeCount = 0;
            let inactiveCount = 0;

            for (const member of members) {
              const memberDeposits = transactionsData.filter(
                (t: any) =>
                  t.userEmail === member.email &&
                  t.type === "Monthly_Contribution" &&
                  t.status === "Completed" &&
                  new Date(t.date) >= threeMonthsAgo
              );

              if (memberDeposits.length > 0) {
                activeCount++;
              } else {
                // Count as inactive if no contributions in last 3 months
                // (includes those who never contributed)
                inactiveCount++;
              }
            }

            setActiveMembers(activeCount);
            setInactiveMembers(inactiveCount);
          }

          // Calculate member's total withdrawals (only Profit Share counts as withdrawal)
          const memberWithdrawals = transactionsData.filter(
            (t: any) =>
              t.userEmail === session.user.email &&
              t.isAdminTransaction === true &&
              t.type === "Profit Share" &&
              t.status === "Completed"
          );
          const totalWithdrawal = memberWithdrawals.reduce(
            (sum: number, t: any) => sum + t.amount,
            0
          );
          setMyTotalWithdrawal(totalWithdrawal);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [session]);

  React.useEffect(() => {
    fetchDashboardData();
    checkMonthlyContributions();
    verifyPaymentIfReturned();

    // Auto-refresh every 30 seconds to catch webhook updates
    const autoRefreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // Refetch when user focuses the window (tab/window comes to foreground)
    const handleWindowFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(autoRefreshInterval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [fetchDashboardData, checkMonthlyContributions, verifyPaymentIfReturned]);

  const handleSubmitEvent = React.useCallback(async () => {
    if (
      !eventFormData.title ||
      !eventFormData.date ||
      !eventFormData.location
    ) {
      showError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventFormData,
          createdBy: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit event");
      }

      // Reset form and close modal
      setEventFormData({ title: "", description: "", date: "", location: "" });
      setOpenEventModal(false);

      // Refresh events list
      fetchDashboardData();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to submit event"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [eventFormData, session?.user?.email, fetchDashboardData]);

  const handleEventInputChange = (field: string, value: string) => {
    setEventFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Guard against rendering before session is loaded
  if (!session?.user) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  const transactionColumns: GridColDef[] = [
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={
            params.value === "Monthly_Contribution"
              ? "Monthly Contribution"
              : params.value
          }
          size="small"
          color={
            params.value === "Monthly_Contribution"
              ? "success"
              : params.value === "Investment"
              ? "primary"
              : params.value === "Profit Share"
              ? "secondary"
              : params.value === "Assistance" || params.value === "Event"
              ? "warning"
              : "default"
          }
        />
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 130,
      valueFormatter: (value: any) => formatNaira(value as number),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "Completed"
              ? "success"
              : params.value === "Pending"
              ? "warning"
              : "error"
          }
        />
      ),
    },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Welcome back, {session?.user?.name}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's happening with your community today.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            sx={{ fontWeight: 600 }}
            startIcon={isRefreshing ? <CircularProgress size={16} /> : null}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>

          {/* Admin Dashboard Buttons */}
          {session?.user?.role === "General Admin" && (
            <Button
              variant="contained"
              color="error"
              onClick={() => router.push("/admin")}
              sx={{ fontWeight: 600 }}
            >
              Go to Admin Dashboard
            </Button>
          )}
          {session?.user?.role === "Community Admin" && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => router.push("/admin/community")}
              sx={{ fontWeight: 600 }}
            >
              Go to Community Admin Dashboard
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Community Contribution Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: "primary.dark", color: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Monthly Contribution Status
            </Typography>
            {monthlyContributionStatus.hasPaid ? (
              <Alert severity="success" sx={{ bgcolor: "success.light" }}>
                ✓ You've made your monthly contribution of ₦
                {monthlyContributionStatus.amount.toLocaleString()} for{" "}
                {new Date().toLocaleString("default", { month: "long" })}
              </Alert>
            ) : (
              <Box>
                <Alert
                  severity="warning"
                  sx={{ bgcolor: "warning.light", mb: 2 }}
                >
                  ⚠ Monthly contribution pending. Due by{" "}
                  {new Date(
                    new Date().getMonth() === 11
                      ? new Date().getFullYear() + 1
                      : new Date().getFullYear(),
                    new Date().getMonth() === 11
                      ? 0
                      : new Date().getMonth() + 1,
                    10
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Alert>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  💡 Contributions are due by the 10th of each month. Your
                  contribution percentage determines your profit share from
                  community investments.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Stats Cards Row 1: Contribution Stats */}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            My Contribution Overview
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="My Total Contribution"
            value={formatNaira(memberContribution)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
            action={{
              label: "Add Contribution",
              onClick: () => router.push("/dashboard/funds?tab=deposit"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="My Contribution %"
            value={`${contributionPercentage.toFixed(2)}%`}
            icon={<PieChartIcon />}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Community Total"
            value={formatNaira(totalCommunityContributions)}
            icon={<AccountBalanceWalletIcon />}
            color="secondary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                  My Last Contribution
                </Typography>
                <Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
                  <CalendarMonthIcon />
                </Avatar>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {formatNaira(lastContribution.amount)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {lastContribution.date}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards Row 2: Community Insights */}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Community Insights
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Last Month Contributors"
            value={lastMonthContributors}
            icon={<PeopleIcon />}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                  Upcoming Events
                </Typography>
                <Avatar sx={{ bgcolor: "warning.main", width: 48, height: 48 }}>
                  <EventIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {upcomingEvents.count}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Next: {upcomingEvents.closestDate}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => router.push("/dashboard/events")}
              >
                View Events
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Member Businesses"
            value={memberBusinessCount}
            icon={<BusinessIcon />}
            color="secondary.main"
            action={{
              label: "View All",
              onClick: () => router.push("/dashboard/member-businesses"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Investments"
            value={investments.length}
            icon={<TrendingUpIcon />}
            color="primary.main"
            action={{
              label: "View All",
              onClick: () => router.push("/dashboard/investments"),
            }}
          />
        </Grid>

        {/* Stats Cards Row 3: Member Statistics */}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Member Statistics
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Community Members"
            value={totalCommunityMembers}
            icon={<PeopleIcon />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Members"
            value={activeMembers}
            icon={<PeopleIcon />}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Inactive Members"
            value={inactiveMembers}
            icon={<PeopleIcon />}
            color="error.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="My Total Withdrawal"
            value={formatNaira(myTotalWithdrawal)}
            icon={<AccountBalanceWalletIcon />}
            color="warning.main"
          />
        </Grid>

        {/* Stats Cards Row 4: Financial Performance */}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Financial Performance
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Community Spending"
            value={formatNaira(totalSpending)}
            icon={<EventIcon />}
            color="error.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Investment Income"
            value={formatNaira(totalIncome)}
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="My Profit Share"
            value={formatNaira(memberProfitShare)}
            icon={<TrendingUpIcon />}
            color="warning.main"
            action={{
              label: "Withdraw",
              onClick: () => router.push("/dashboard/funds?tab=withdrawal"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Wallet Balance"
            value={formatNaira(userBalance)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
            action={{
              label: "Add Funds",
              onClick: () => router.push("/dashboard/funds?tab=deposit"),
            }}
          />
        </Grid>

        {/* Financial Summary Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Financial Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Available for Investment
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ₦
                    {(
                      totalCommunityContributions - totalSpending
                    ).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total contributions minus spending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Investment Income Ever Achieved
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: totalIncome > 0 ? "success.main" : "text.primary",
                    }}
                  >
                    {formatNaira(totalIncome)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    All profit deposits received by community
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Withdrawn by All Members
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color:
                        communityTotalWithdrawals > 0
                          ? "warning.main"
                          : "text.primary",
                    }}
                  >
                    {formatNaira(communityTotalWithdrawals)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Amount withdrawn or converted by members
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Current Investment Income Balance
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color:
                        communityRemainingIncome > 0
                          ? "primary.main"
                          : "text.primary",
                    }}
                  >
                    {formatNaira(communityRemainingIncome)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Remaining after all member withdrawals
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Active Investments */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Active Investment Opportunities
          </Typography>
        </Grid>

        {investments.map((investment: any, idx: number) => (
          <Grid item xs={12} md={4} key={idx}>
            <InvestmentCard investment={investment} />
          </Grid>
        ))}

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Transaction History
              </Typography>
              <Button
                size="small"
                onClick={() => router.push("/dashboard/transactions")}
              >
                View All
              </Button>
            </Box>
            <DataGrid
              rows={transactions
                .filter((t: any) => t.userEmail === session?.user?.email)
                .map((t: any, idx) => ({
                  id: t._id || idx,
                  ...t,
                }))}
              columns={transactionColumns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{ border: "none", minHeight: 400 }}
            />
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Upcoming Events
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenEventModal(true)}
              >
                Submit Event
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {events.length > 0 ? (
                events.map((event: any, idx: number) => (
                  <Box
                    key={idx}
                    sx={{ borderLeft: 3, borderColor: "primary.main", pl: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(event.eventDate).toLocaleDateString()} •{" "}
                      {event.location}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No upcoming events
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push("/dashboard/funds?tab=deposit")}
                >
                  Deposit Funds
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push("/dashboard/funds?tab=withdrawal")}
                >
                  Withdraw
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push("/dashboard/voting")}
                >
                  Vote on Proposals
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push("/dashboard/assistance")}
                >
                  Request Assistance
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Submit Event Modal */}
      <Dialog
        open={openEventModal}
        onClose={() => setOpenEventModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit New Event</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Event Title"
            fullWidth
            value={eventFormData.title}
            onChange={(e) => handleEventInputChange("title", e.target.value)}
            placeholder="Enter event title"
            required
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={eventFormData.description}
            onChange={(e) =>
              handleEventInputChange("description", e.target.value)
            }
            placeholder="Enter event description"
          />
          <TextField
            label="Date"
            fullWidth
            type="date"
            value={eventFormData.date}
            onChange={(e) => handleEventInputChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Location"
            fullWidth
            value={eventFormData.location}
            onChange={(e) => handleEventInputChange("location", e.target.value)}
            placeholder="Enter event location"
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEventModal(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitEvent}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Event"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
