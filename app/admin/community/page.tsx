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
  Alert,
  CircularProgress,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";

// Stats Card Component
function StatsCard({ title, value, icon, color }: any) {
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
    </Card>
  );
}

export default function CommunityAdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [communityData, setCommunityData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      setError(null);

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
            setError("Community ID not found");
            return;
          }

          // Fetch community details
          const communityRes = await fetch(`/api/communities/${communityId}`);
          if (communityRes.ok) {
            const community = await communityRes.json();
            setCommunityData(community);
          }
        }
      }
    } catch (err) {
      setError(
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Community Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your community, members, and activities
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Community Members"
            value={communityData?.memberCount || 0}
            icon={<GroupsIcon />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Investments"
            value="0"
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Upcoming Events"
            value="0"
            icon={<EventIcon />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Proposals"
            value="0"
            icon={<AssignmentIcon />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* Community Info */}
      {communityData && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Community Information
          </Typography>
          <Grid container spacing={2}>
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
                  <Chip label="Investments" size="small" variant="outlined" />
                )}
                {communityData.enabledFunctions.proposals && (
                  <Chip label="Proposals" size="small" variant="outlined" />
                )}
                {communityData.enabledFunctions.events && (
                  <Chip label="Events" size="small" variant="outlined" />
                )}
                {communityData.enabledFunctions.assistance && (
                  <Chip label="Assistance" size="small" variant="outlined" />
                )}
                {communityData.enabledFunctions.kyc && (
                  <Chip label="KYC" size="small" variant="outlined" />
                )}
                {communityData.enabledFunctions.withdrawals && (
                  <Chip label="Withdrawals" size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
        <Button variant="outlined" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
