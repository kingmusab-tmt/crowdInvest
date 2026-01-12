"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

interface CommunityMember {
  _id: string;
  name: string;
  email: string;
}

interface Community {
  _id: string;
  name: string;
}

export default function ManualDepositPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [formData, setFormData] = useState({
    transactionType: "",
    selectedCommunity: "",
    selectedMember: "",
    amount: "",
    description: "",
  });

  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();

  const isGeneralAdmin = session?.user?.role === "General Admin";

  useEffect(() => {
    if (isGeneralAdmin) {
      fetchCommunities();
    } else if (session?.user?.community) {
      // Community admin - fetch their community members directly
      fetchMembers(session.user.community);
      setFormData((prev) => ({
        ...prev,
        selectedCommunity: session.user.community || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    if (formData.selectedCommunity) {
      fetchMembers(formData.selectedCommunity);
    }
  }, [formData.selectedCommunity]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchMembers = async (communityId: string) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/users?communityId=${communityId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    closeSnackbar();

    // Validation
    if (!formData.transactionType) {
      showError("Please select a transaction type");
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    if (
      (formData.transactionType === "manual_deposit" ||
        formData.transactionType === "refund_deposit") &&
      !formData.selectedMember
    ) {
      showError("Please select a member for this deposit type");
      setLoading(false);
      return;
    }

    if (!formData.selectedCommunity) {
      showError("Please select a community");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionType: formData.transactionType,
          communityId: formData.selectedCommunity,
          memberId: formData.selectedMember || null,
          amount: parseFloat(formData.amount),
          description: formData.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process deposit");
      }

      showSuccess(
        `Deposit of ${formatNaira(
          parseFloat(formData.amount)
        )} processed successfully!`
      );

      // Reset form
      setFormData({
        transactionType: "",
        selectedCommunity: isGeneralAdmin ? "" : session?.user?.community || "",
        selectedMember: "",
        amount: "",
        description: "",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to process deposit"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "profit_deposit":
        return "Profit Deposit (Investment Income)";
      case "manual_deposit":
        return "Manual Deposit (Member Payment)";
      case "refund_deposit":
        return "Refund Deposit";
      default:
        return type;
    }
  };

  const getTransactionTypeDescription = (type: string) => {
    switch (type) {
      case "profit_deposit":
        return "Record profit from investments. This will be distributed to members based on their contribution percentage.";
      case "manual_deposit":
        return "Record payment made directly by a member to admin. Select the member who made the payment.";
      case "refund_deposit":
        return "Record a refund to the community. Select the member this refund is for.";
      default:
        return "";
    }
  };

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (
    session.user.role !== "General Admin" &&
    session.user.role !== "Community Admin"
  ) {
    router.push("/dashboard");
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Manual Deposit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Record manual deposits, refunds, and investment profits
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Transaction Type */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={formData.transactionType}
                  onChange={(e) =>
                    handleInputChange("transactionType", e.target.value)
                  }
                  label="Transaction Type"
                >
                  <MenuItem value="profit_deposit">
                    {getTransactionTypeLabel("profit_deposit")}
                  </MenuItem>
                  <MenuItem value="manual_deposit">
                    {getTransactionTypeLabel("manual_deposit")}
                  </MenuItem>
                  <MenuItem value="refund_deposit">
                    {getTransactionTypeLabel("refund_deposit")}
                  </MenuItem>
                </Select>
              </FormControl>
              {formData.transactionType && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {getTransactionTypeDescription(formData.transactionType)}
                </Typography>
              )}
            </Grid>

            {/* Community Selection (General Admin only) */}
            {isGeneralAdmin && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Community</InputLabel>
                  <Select
                    value={formData.selectedCommunity}
                    onChange={(e) =>
                      handleInputChange("selectedCommunity", e.target.value)
                    }
                    label="Community"
                  >
                    {communities.map((community) => (
                      <MenuItem key={community._id} value={community._id}>
                        {community.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Member Selection (for manual_deposit and refund_deposit) */}
            {(formData.transactionType === "manual_deposit" ||
              formData.transactionType === "refund_deposit") && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Member</InputLabel>
                  <Select
                    value={formData.selectedMember}
                    onChange={(e) =>
                      handleInputChange("selectedMember", e.target.value)
                    }
                    label="Member"
                    disabled={loadingMembers || !formData.selectedCommunity}
                  >
                    {loadingMembers ? (
                      <MenuItem disabled>Loading members...</MenuItem>
                    ) : (
                      members.map((member) => (
                        <MenuItem key={member._id} value={member._id}>
                          {member.name} ({member.email})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Amount */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Amount (₦)"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Add any additional notes about this deposit..."
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
              >
                {loading ? "Processing..." : "Process Deposit"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Info Box */}
        <Box sx={{ mt: 4, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Transaction Type Guide:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • <strong>Profit Deposit:</strong> Records investment profits that
            will be shared among all members based on their contribution
            percentage.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • <strong>Manual Deposit:</strong> Records a member's payment made
            directly to admin (cash, bank transfer, etc.).
          </Typography>
          <Typography variant="body2">
            • <strong>Refund Deposit:</strong> Records a refund being added back
            to community funds.
          </Typography>
        </Box>

        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Paper>
    </Container>
  );
}
