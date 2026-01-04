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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const progress = (investment.amount / investment.goal) * 100;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {investment.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {investment.description}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2">{progress.toFixed(1)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            ₦{investment.amount.toLocaleString()} raised
          </Typography>
          <Chip
            label={investment.risk}
            size="small"
            color={
              investment.risk === "Low"
                ? "success"
                : investment.risk === "Medium"
                ? "warning"
                : "error"
            }
          />
        </Box>
        <Typography variant="caption" color="textSecondary">
          {investment.investors} investors • {investment.projectedROI} ROI
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => router.push(`/dashboard/investments`)}
        >
          View Details
        </Button>
        <Button size="small" variant="contained">
          Invest Now
        </Button>
      </CardActions>
    </Card>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
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
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch investments
      const investmentsRes = await fetch("/api/investments");
      const investmentsData = await investmentsRes.json();
      setInvestments(
        investmentsData
          .filter((inv: any) => inv.status === "Active")
          .slice(0, 3)
      );

      // Fetch transactions
      const transactionsRes = await fetch("/api/transactions");
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.slice(0, 5));

      // Fetch events
      const eventsRes = await fetch("/api/events");
      const eventsData = await eventsRes.json();
      setEvents(eventsData.slice(0, 3));

      // Get user balance from session or API
      if (session?.user) {
        const userRes = await fetch(`/api/users?email=${session.user.email}`);
        const userData = await userRes.json();
        if (userData.length > 0) {
          setUserBalance(userData[0].balance || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const handleSubmitEvent = async () => {
    setSubmitError(null);

    if (
      !eventFormData.title ||
      !eventFormData.date ||
      !eventFormData.location
    ) {
      setSubmitError("Please fill in all required fields");
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
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventInputChange = (field: string, value: string) => {
    setEventFormData((prev) => ({ ...prev, [field]: value }));
  };

  const transactionColumns: GridColDef[] = [
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "Deposit"
              ? "success"
              : params.value === "Withdrawal"
              ? "warning"
              : params.value === "Investment"
              ? "primary"
              : "default"
          }
        />
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 130,
      valueFormatter: (value: any) => `₦${(value as number).toLocaleString()}`,
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Welcome back, {session?.user?.name}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's happening with your investments today.
          </Typography>
        </Box>
        
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

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Wallet Balance"
            value={`₦${userBalance.toLocaleString()}`}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
            action={{
              label: "Add Funds",
              onClick: () => router.push("/dashboard/deposit"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Investments"
            value="3"
            icon={<TrendingUpIcon />}
            color="success.main"
            action={{
              label: "View All",
              onClick: () => router.push("/dashboard/investments"),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Portfolio Value"
            value="₦250,000"
            icon={<PieChartIcon />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Upcoming Events"
            value={events.length}
            icon={<EventIcon />}
            color="error.main"
            action={{
              label: "View Events",
              onClick: () => router.push("/dashboard/events"),
            }}
          />
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
                Recent Transactions
              </Typography>
              <Button
                size="small"
                onClick={() => router.push("/dashboard/transactions")}
              >
                View All
              </Button>
            </Box>
            <DataGrid
              rows={transactions.map((t: any, idx) => ({
                id: t._id || idx,
                ...t,
              }))}
              columns={transactionColumns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              sx={{ border: "none", minHeight: 350 }}
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
                      {new Date(event.date).toLocaleDateString()} •{" "}
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
          {submitError && <Alert severity="error">{submitError}</Alert>}
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
    </Box>
  );
}
