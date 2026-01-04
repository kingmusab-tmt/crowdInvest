"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HelpIcon from "@mui/icons-material/Help";
import { useSession } from "next-auth/react";

interface AssistanceRequest {
  _id: string;
  userName: string;
  userEmail: string;
  community: string;
  purpose: string;
  amount: number;
  returnDate: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function AssistancePage() {
  const { data: session } = useSession();
  const [requests, setRequests] = React.useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [formData, setFormData] = React.useState({
    community: "",
    purpose: "",
    amount: "",
    returnDate: "",
  });
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/assistance");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Failed to load assistance requests", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null);

    if (
      !formData.community ||
      !formData.purpose ||
      !formData.amount ||
      !formData.returnDate
    ) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setSubmitError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community: formData.community,
          purpose: formData.purpose,
          amount,
          returnDate: formData.returnDate,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assistance request");
      }

      setFormData({
        community: "",
        purpose: "",
        amount: "",
        returnDate: "",
      });
      setOpenDialog(false);
      fetchRequests();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const userRequests = requests.filter(
    (r) => r.userEmail === session?.user?.email
  );
  const approved = requests.filter((r) => r.status === "Approved").length;
  const pending = requests.filter((r) => r.status === "Pending").length;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Request Assistance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request financial assistance from the community
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Request
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {userRequests.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Requests
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: 600 }}
            >
              {approved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: 600 }}
            >
              {pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Review
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Requests Grid */}
      {userRequests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <HelpIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No assistance requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Submit a request to get financial assistance from the community
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Submit Request
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {userRequests.map((request) => (
            <Grid item xs={12} md={6} key={request._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: 4,
                  borderLeftColor: `${getStatusColor(request.status)}.main`,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {request.purpose}
                    </Typography>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Amount Requested
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: "primary.main" }}
                      >
                        ₦{request.amount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Return Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDate(request.returnDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Community
                      </Typography>
                      <Typography variant="body2">
                        {request.community}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Submitted
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(request.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New Request Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submit Assistance Request</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <TextField
            label="Community"
            fullWidth
            select
            value={formData.community}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, community: e.target.value }))
            }
            placeholder="Select community"
            required
          >
            <MenuItem value="Tech Innovators">Tech Innovators</MenuItem>
            <MenuItem value="Business Leaders">Business Leaders</MenuItem>
            <MenuItem value="Social Impact">Social Impact</MenuItem>
            <MenuItem value="Education">Education</MenuItem>
            <MenuItem value="Healthcare">Healthcare</MenuItem>
          </TextField>

          <TextField
            label="Purpose of Assistance"
            fullWidth
            value={formData.purpose}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, purpose: e.target.value }))
            }
            placeholder="Describe why you need assistance"
            multiline
            rows={3}
            required
          />

          <TextField
            label="Amount Requested"
            fullWidth
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="Enter amount in Naira"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
            }}
            required
          />

          <TextField
            label="Expected Return Date"
            fullWidth
            type="date"
            value={formData.returnDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, returnDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
