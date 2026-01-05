"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
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
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useSession } from "next-auth/react";

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
}

export default function AssistancePage() {
  const { data: session } = useSession();
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
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [requestForm, setRequestForm] = React.useState({
    title: "",
    description: "",
    assistanceType: "financial",
  });

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

        // Filter voting requests
        const votingReqs = allRequests.filter(
          (r: AssistanceRequest) =>
            r.status === "Voting" || r.status === "Approved"
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
        setSuccess("Assistance request created successfully");
        setRequestForm({
          title: "",
          description: "",
          assistanceType: "financial",
        });
        setRequestFormOpen(false);
        loadRequests();
      } else {
        setError("Failed to create assistance request");
      }
    } catch (err) {
      setError("Error creating assistance request");
    }
  };

  const handleVote = async (
    requestId: string,
    vote: "assist" | "not-assist"
  ) => {
    try {
      const res = await fetch(`/api/assistance/${requestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, userId: session?.user?.email }),
      });

      if (res.ok) {
        setSuccess(
          `Vote recorded: ${vote === "assist" ? "ASSIST" : "NOT ASSIST"}`
        );
        loadRequests();
      } else {
        setError("Failed to record vote");
      }
    } catch (err) {
      setError("Error recording vote");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Community Assistance
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Request assistance and help other community members
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRequestFormOpen(true)}
          >
            Request Assistance
          </Button>
        </Box>
      </Box>

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

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Assistance tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Community Requests (${communityRequests.length})`}
            id="assistance-tab-0"
            aria-controls="assistance-tabpanel-0"
          />
          <Tab
            label={`My Requests (${userRequests.length})`}
            id="assistance-tab-1"
            aria-controls="assistance-tabpanel-1"
          />
          <Tab
            label={`Voting (${votingRequests.length})`}
            id="assistance-tab-2"
            aria-controls="assistance-tabpanel-2"
          />
        </Tabs>

        {/* Tab 1: Community Requests */}
        <TabPanel value={tabValue} index={0}>
          {communityRequests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No assistance requests yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Be the first to request assistance
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {communityRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {request.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          By: {request.requestedBy?.name || "Community Member"}
                        </Typography>
                      </Box>
                      <Chip
                        label={request.status}
                        color={
                          request.status === "Approved"
                            ? "success"
                            : request.status === "Rejected"
                            ? "error"
                            : request.status === "Voting"
                            ? "info"
                            : "default"
                        }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {request.description}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        label={request.assistanceType}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 2: My Requests */}
        <TabPanel value={tabValue} index={1}>
          {userRequests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                You haven't requested assistance yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by requesting assistance from your community
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRequestFormOpen(true)}
              >
                Request Assistance
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {userRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {request.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={request.status}
                        color={
                          request.status === "Approved"
                            ? "success"
                            : request.status === "Rejected"
                            ? "error"
                            : request.status === "Voting"
                            ? "info"
                            : "default"
                        }
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {request.description}
                    </Typography>
                    {request.status === "Rejected" &&
                      request.rejectionReason && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          <Typography variant="caption">
                            <strong>Rejection Reason:</strong>{" "}
                            {request.rejectionReason}
                          </Typography>
                        </Alert>
                      )}
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Chip
                        label={request.assistanceType}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>

        {/* Tab 3: Voting */}
        <TabPanel value={tabValue} index={2}>
          {votingRequests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No assistance requests in voting yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Check back soon for assistance requests to vote on
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {votingRequests.map((request) => {
                const votes = request.votes || [];
                const assistVotes = votes.filter(
                  (v) => v.vote === "assist"
                ).length;
                const notAssistVotes = votes.filter(
                  (v) => v.vote === "not-assist"
                ).length;
                const totalVotes = assistVotes + notAssistVotes;

                return (
                  <Card key={request._id} sx={{ border: "2px solid #1976d2" }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {request.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            By:{" "}
                            {request.requestedBy?.name || "Community Member"}
                          </Typography>
                        </Box>
                        <Chip label={request.status} color="info" />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {request.description}
                      </Typography>

                      {/* Voting Progress */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: "block", mb: 1 }}
                        >
                          Assistance Voting ({totalVotes} votes)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Box
                            sx={{
                              flex: assistVotes,
                              bgcolor: "#4caf50",
                              height: 24,
                              borderRadius: 1,
                            }}
                          />
                          <Box
                            sx={{
                              flex: notAssistVotes,
                              bgcolor: "#f44336",
                              height: 24,
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Assist Votes
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color: "#4caf50", fontWeight: 600 }}
                          >
                            {assistVotes}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Not Assist Votes
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color: "#f44336", fontWeight: 600 }}
                          >
                            {notAssistVotes}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ThumbUpIcon />}
                          color="success"
                          onClick={() => handleVote(request._id, "assist")}
                        >
                          Assist
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ThumbDownIcon />}
                          color="error"
                          onClick={() => handleVote(request._id, "not-assist")}
                        >
                          Cannot Assist
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </TabPanel>
      </Paper>

      {/* Request Assistance Dialog */}
      <Dialog
        open={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Assistance</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
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
              select
              label="Type of Assistance Needed"
              value={requestForm.assistanceType}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  assistanceType: e.target.value,
                })
              }
              fullWidth
            >
              <option value="financial">Financial Assistance</option>
              <option value="physical">Physical Assistance</option>
              <option value="expertise">Expertise/Skills</option>
              <option value="emotional">Emotional Support</option>
              <option value="other">Other</option>
            </TextField>
            <TextField
              label="Description"
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe your assistance need in detail..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitRequest} variant="contained">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
