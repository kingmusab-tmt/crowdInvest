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

export default function ManualDepositPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [formData, setFormData] = useState({
    transactionType: "",
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

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/users");
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
      formData.transactionType === "manual_deposit" &&
      !formData.selectedMember
    ) {
      showError("Please select a member for this deposit type");
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

  if (session.user.role !== "Admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Manual Deposit
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 4
          }}>
          Record manual deposits, refunds, and investment profits
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Transaction Type */}
            <Grid size={12}>
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
                </Select>
              </FormControl>
              {formData.transactionType && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    mt: 1,
                    display: "block"
                  }}>
                  {getTransactionTypeDescription(formData.transactionType)}
                </Typography>
              )}
            </Grid>

            {/* Member Selection (for manual_deposit) */}
            {formData.transactionType === "manual_deposit" && (
              <Grid size={12}>
                <FormControl fullWidth required>
                  <InputLabel>Member</InputLabel>
                  <Select
                    value={formData.selectedMember}
                    onChange={(e) =>
                      handleInputChange("selectedMember", e.target.value)
                    }
                    label="Member"
                    disabled={loadingMembers}
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
            <Grid size={12}>
              <TextField
                fullWidth
                required
                label="Amount (₦)"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                slotProps={{
                  htmlInput: { min: 0, step: "0.01" }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid size={12}>
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
            <Grid size={12}>
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
          <Typography variant="body2">
            • <strong>Manual Deposit:</strong> Records a member's payment made
            directly to admin (cash, bank transfer, etc.).
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
