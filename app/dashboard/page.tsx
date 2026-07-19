"use client";

import * as React from "react";
import Grid from "@mui/material/Grid";
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
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { CONTRIBUTION_MODAL_SESSION_KEY } from "@/lib/dashboardConstants";

// Stats Card Component
function StatsCard({ title, value, icon, color, action, caption }: any) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
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
          <Box sx={{ color, display: "flex" }}>
            {React.cloneElement(icon, { sx: { fontSize: 32 } })}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="textSecondary">
            {caption}
          </Typography>
        )}
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
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showContributionModal, setShowContributionModal] =
    React.useState(false);
  const hasShownContributionModal = React.useRef(false);

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

      // Get user data and calculate contribution stats
      if (session?.user) {
        const userRes = await fetch(`/api/users?email=${session.user.email}`);
        const userData = await userRes.json();
        if (userData.length > 0) {
          const currentUser = userData[0];

          // Calculate member's total contributions: automatic deposits
          // (recurring payment, one-time card, or reserved account — all
          // recorded as "Monthly_Contribution") plus manual deposits
          // recorded by an admin.
          const memberDeposits = transactionsData.filter(
            (t: any) =>
              t.userEmail === session.user.email &&
              (t.type === "Monthly_Contribution" ||
                t.type === "manual_deposit") &&
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
                t.type === "manual_deposit") &&
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

      // Show the contribution status modal once per login, on the first
      // successful data load only (not on manual "Refresh Data" reloads).
      if (
        !hasShownContributionModal.current &&
        typeof window !== "undefined"
      ) {
        hasShownContributionModal.current = true;
        if (!sessionStorage.getItem(CONTRIBUTION_MODAL_SESSION_KEY)) {
          sessionStorage.setItem(CONTRIBUTION_MODAL_SESSION_KEY, "1");
          setShowContributionModal(true);
        }
      }
    }
  }, [session]);

  // Auto-close the contribution modal after 5 seconds
  React.useEffect(() => {
    if (!showContributionModal) return;
    const timer = setTimeout(() => setShowContributionModal(false), 5000);
    return () => clearTimeout(timer);
  }, [showContributionModal]);

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

  // Guard against rendering before session is loaded
  if (!session?.user) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

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

          {/* Admin Dashboard Button */}
          {session?.user?.role === "Admin" && (
            <Button
              variant="contained"
              color="error"
              onClick={() => router.push("/admin")}
              sx={{ fontWeight: 600 }}
            >
              Go to Admin Dashboard
            </Button>
          )}
        </Box>
      </Box>
      <Dialog
        open={showContributionModal}
        onClose={() => setShowContributionModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Monthly Contribution Status
          <IconButton
            onClick={() => setShowContributionModal(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {monthlyContributionStatus.hasPaid ? (
            <Alert severity="success">
              ✓ You've made your monthly contribution of ₦
              {monthlyContributionStatus.amount.toLocaleString()} for{" "}
              {new Date().toLocaleString("default", { month: "long" })}
            </Alert>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠ Monthly contribution pending. Due by{" "}
                {new Date(
                  new Date().getMonth() === 11
                    ? new Date().getFullYear() + 1
                    : new Date().getFullYear(),
                  new Date().getMonth() === 11 ? 0 : new Date().getMonth() + 1,
                  10
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Alert>
              <Typography variant="body2" color="textSecondary">
                💡 Contributions are due by the 10th of each month. Your
                contribution percentage determines your profit share from
                community investments.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContributionModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Grid container spacing={3}>
        {/* Stats Cards Row 1: My Contribution Overview */}
        <Grid size={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            My Contribution Overview
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4
          }}>
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

        <Grid
          size={{
            xs: 6,
            lg: 2.4
          }}>
          <StatsCard
            title="My Contribution %"
            value={`${contributionPercentage.toFixed(2)}%`}
            icon={<PieChartIcon />}
            color="info.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4
          }}>
          <StatsCard
            title="My Last Contribution"
            value={formatNaira(lastContribution.amount)}
            icon={<CalendarMonthIcon />}
            color="success.main"
            caption={lastContribution.date}
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4
          }}>
          <StatsCard
            title="My Total Withdrawal"
            value={formatNaira(myTotalWithdrawal)}
            icon={<AccountBalanceWalletIcon />}
            color="warning.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 6,
            lg: 2.4
          }}>
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

        {/* Stats Cards Row 2: Community Insights */}
        <Grid size={12}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
          >
            Community Insights
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <StatsCard
            title="Last Month Contributors"
            value={lastMonthContributors}
            icon={<PeopleIcon />}
            color="info.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <StatsCard
            title="Community Total"
            value={formatNaira(totalCommunityContributions)}
            icon={<AccountBalanceWalletIcon />}
            color="secondary.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <StatsCard
            title="Total Community Spending"
            value={formatNaira(totalSpending)}
            icon={<EventIcon />}
            color="error.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <StatsCard
            title="Total Investment Income"
            value={formatNaira(totalIncome)}
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents.count}
            icon={<EventIcon />}
            color="warning.main"
            caption={`Next: ${upcomingEvents.closestDate}`}
            action={{
              label: "View Events",
              onClick: () => router.push("/dashboard/events"),
            }}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
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

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
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

      </Grid>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
