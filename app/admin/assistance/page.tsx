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
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

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
  status: string;
  requestedBy: { name: string; email: string };
  community: string;
  createdAt: string;
  rejectionReason?: string;
  votes?: Array<{
    userId: string;
    vote: "assist" | "not-assist";
  }>;
}

interface VoteData {
  _id: string;
  assistanceId: string;
  title: string;
  assistVotes: number;
  notAssistVotes: number;
  totalVoters: number;
  status: string;
  community: string;
}

export default function AssistancePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [requests, setRequests] = React.useState<AssistanceRequest[]>([]);
  const [activeRequests, setActiveRequests] = React.useState<
    AssistanceRequest[]
  >([]);
  const [votes, setVotes] = React.useState<VoteData[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialogs
  const [editRequestDialog, setEditRequestDialog] = React.useState(false);
  const [createRequestDialog, setCreateRequestDialog] = React.useState(false);
  const [selectedRequest, setSelectedRequest] =
    React.useState<AssistanceRequest | null>(null);
  const [rejectionReasonDialog, setRejectionReasonDialog] =
    React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Form states
  const [requestForm, setRequestForm] = React.useState({
    title: "",
    description: "",
    assistanceType: "financial",
  });

  React.useEffect(() => {
    if (session?.user?.role) {
      loadData();
    }
  }, [session?.user?.role, session?.user?.community]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const isGeneralAdmin = session?.user?.role === "General Admin";
      const queryParams = isGeneralAdmin
        ? ""
        : `?community=${session?.user?.community}`;

      const [requestsRes, votesRes] = await Promise.all([
        fetch(`/api/assistance${queryParams}`),
        fetch(`/api/assistance/votes${queryParams}`),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        // Separate requests by status
        const pending = data.filter(
          (r: AssistanceRequest) => r.status === "Pending"
        );
        const active = data.filter(
          (r: AssistanceRequest) =>
            r.status === "Approved" || r.status === "Voting"
        );
        setRequests(pending);
        setActiveRequests(active);
      }

      if (votesRes.ok) {
        const data = await votesRes.json();
        setVotes(data);
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
      assistanceType: request.assistanceType,
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
        setRequestForm({
          title: "",
          description: "",
          assistanceType: "financial",
        });
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
    if (!confirm("Are you sure you want to delete this assistance request?"))
      return;
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
  };

  const getStatusColor = (status: string): any => {
    if (status === "Pending") return "warning";
    if (status === "Approved" || status === "Voting") return "success";
    if (status === "Rejected") return "error";
    return "default";
  };

  const calculateVotes = (request: AssistanceRequest) => {
    if (!request.votes) return { assist: 0, notAssist: 0 };
    const assist = request.votes.filter((v: any) => v.vote === "assist").length;
    const notAssist = request.votes.filter(
      (v: any) => v.vote === "not-assist"
    ).length;
    return { assist, notAssist };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Assistance Requests Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setRequestForm({
              title: "",
              description: "",
              assistanceType: "financial",
            });
            setCreateRequestDialog(true);
          }}
        >
          New Request
        </Button>
      </Box>

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

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Pending Requests (${requests.length})`} />
              <Tab label={`Active Requests (${activeRequests.length})`} />
              <Tab label={`Voting Overview (${votes.length})`} />
            </Tabs>
          </Box>

          {/* Pending Requests Tab */}
          <TabPanel value={tabValue} index={0}>
            {requests.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No pending assistance requests
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {requests.map((request) => (
                  <Card key={request._id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {request.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 1 }}
                          >
                            {request.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip label={request.assistanceType} size="small" />
                            <Chip
                              label={request.status}
                              color={getStatusColor(request.status)}
                              size="small"
                            />
                            <Typography
                              variant="caption"
                              sx={{ alignSelf: "center" }}
                            >
                              Requested by: {request.requestedBy.name}
                            </Typography>
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
                        <Stack direction="row" spacing={1}>
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
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Active Requests Tab */}
          <TabPanel value={tabValue} index={1}>
            {activeRequests.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No active assistance requests
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {activeRequests.map((request) => {
                  const { assist, notAssist } = calculateVotes(request);
                  return (
                    <Card key={request._id}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {request.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {request.description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip
                                label={request.assistanceType}
                                size="small"
                              />
                              <Chip
                                label={request.status}
                                color={getStatusColor(request.status)}
                                size="small"
                              />
                            </Stack>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Assist Votes: <strong>{assist}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Not Assist Votes: <strong>{notAssist}</strong>
                              </Typography>
                              <Typography variant="caption">
                                Total: <strong>{assist + notAssist}</strong>
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
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
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>

          {/* Voting Overview Tab */}
          <TabPanel value={tabValue} index={2}>
            {votes.length === 0 ? (
              <Typography color="textSecondary" sx={{ p: 2 }}>
                No voting data available
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ p: 2 }}>
                {votes.map((vote) => (
                  <Card key={vote._id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {vote.title}
                          </Typography>
                          <Stack direction="row" spacing={3}>
                            <Typography variant="body2">
                              Assist Votes:{" "}
                              <Chip
                                label={vote.assistVotes}
                                size="small"
                                color="success"
                              />
                            </Typography>
                            <Typography variant="body2">
                              Not Assist Votes:{" "}
                              <Chip
                                label={vote.notAssistVotes}
                                size="small"
                                color="error"
                              />
                            </Typography>
                            <Typography variant="body2">
                              Total Voters:{" "}
                              <Chip label={vote.totalVoters} size="small" />
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </Paper>
      )}

      {/* Edit Request Dialog */}
      <Dialog
        open={editRequestDialog}
        onClose={() => setEditRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Assistance Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={requestForm.title}
            onChange={(e) =>
              setRequestForm({ ...requestForm, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={requestForm.description}
            onChange={(e) =>
              setRequestForm({ ...requestForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assistance Type</InputLabel>
            <Select
              value={requestForm.assistanceType}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  assistanceType: e.target.value,
                })
              }
              label="Assistance Type"
            >
              <MenuItem value="financial">Financial</MenuItem>
              <MenuItem value="physical">Physical</MenuItem>
              <MenuItem value="expertise">Expertise</MenuItem>
              <MenuItem value="emotional">Emotional</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
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
          <TextField
            fullWidth
            label="Title"
            value={requestForm.title}
            onChange={(e) =>
              setRequestForm({ ...requestForm, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={requestForm.description}
            onChange={(e) =>
              setRequestForm({ ...requestForm, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assistance Type</InputLabel>
            <Select
              value={requestForm.assistanceType}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  assistanceType: e.target.value,
                })
              }
              label="Assistance Type"
            >
              <MenuItem value="financial">Financial</MenuItem>
              <MenuItem value="physical">Physical</MenuItem>
              <MenuItem value="expertise">Expertise</MenuItem>
              <MenuItem value="emotional">Emotional</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
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
