"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { suggestInvestment } from "@/services/investmentService";

interface InvestmentSuggestionFormProps {
  open: boolean;
  onClose: () => void;
  communityId: string;
  userId: string;
  onSuccess: () => void;
}

export default function InvestmentSuggestionForm({
  open,
  onClose,
  communityId,
  userId,
  onSuccess,
}: InvestmentSuggestionFormProps) {
  const [formData, setFormData] = useState({
    investmentType: "",
    title: "",
    description: "",
    reason: "",
    amountRequired: "",
    timeframe: "",
    expectedReturn: "",
    riskLevel: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.investmentType) {
      setError("Please select an investment type");
      return false;
    }
    if (!formData.title.trim()) {
      setError("Please enter investment title");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Please enter investment description");
      return false;
    }
    if (!formData.reason.trim()) {
      setError("Please explain why you think this is a genuine opportunity");
      return false;
    }
    if (!formData.amountRequired || parseFloat(formData.amountRequired) <= 0) {
      setError("Please enter a valid amount required");
      return false;
    }
    if (!formData.timeframe.trim()) {
      setError("Please enter expected timeframe");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      await suggestInvestment({
        community: communityId as any,
        suggestedBy: userId as any,
        investmentType: formData.investmentType as any,
        title: formData.title,
        description: formData.description,
        reason: formData.reason,
        amountRequired: parseFloat(formData.amountRequired),
        timeframe: formData.timeframe,
        expectedReturn: formData.expectedReturn || undefined,
        riskLevel: formData.riskLevel as any,
        status: "Pending",
      });

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit suggestion"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      investmentType: "",
      title: "",
      description: "",
      reason: "",
      amountRequired: "",
      timeframe: "",
      expectedReturn: "",
      riskLevel: "Medium",
    });
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Suggest an Investment
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Help your community discover new investment opportunities
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">
              Investment suggestion submitted successfully! It will be reviewed
              by community admin.
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Investment Type *</InputLabel>
            <Select
              name="investmentType"
              value={formData.investmentType}
              onChange={handleSelectChange}
              label="Investment Type *"
              disabled={loading}
            >
              <MenuItem value="stock">Stock</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="real-estate">Real Estate</MenuItem>
            </Select>
            <FormHelperText>Select the type of investment</FormHelperText>
          </FormControl>

          <TextField
            label="Investment Title *"
            name="title"
            placeholder="e.g., Tesla Inc. Stock"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            helperText="Brief name for the investment"
          />

          <TextField
            label="Description *"
            name="description"
            placeholder="Describe the investment in detail"
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
            helperText="What is this investment? (company, property details, etc.)"
          />

          <TextField
            label="Why is this genuine & profitable? *"
            name="reason"
            placeholder="Explain your reasoning and market analysis"
            value={formData.reason}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            helperText="Convince others why this is a good opportunity"
          />

          <TextField
            label="Amount Required *"
            name="amountRequired"
            type="number"
            placeholder="0.00"
            value={formData.amountRequired}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            inputProps={{ step: "0.01", min: "0" }}
            helperText="Total capital needed for this investment"
          />

          <TextField
            label="Expected Timeframe *"
            name="timeframe"
            placeholder="e.g., 6 months, 2 years"
            value={formData.timeframe}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            helperText="How long until returns are expected?"
          />

          <TextField
            label="Expected Return (Optional)"
            name="expectedReturn"
            placeholder="e.g., 15% annually, $5000 profit"
            value={formData.expectedReturn}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            helperText="Estimated profits or ROI"
          />

          <FormControl fullWidth>
            <InputLabel>Risk Level *</InputLabel>
            <Select
              name="riskLevel"
              value={formData.riskLevel}
              onChange={handleSelectChange}
              label="Risk Level *"
              disabled={loading}
            >
              <MenuItem value="Low">Low Risk</MenuItem>
              <MenuItem value="Medium">Medium Risk</MenuItem>
              <MenuItem value="High">High Risk</MenuItem>
            </Select>
            <FormHelperText>
              How risky do you consider this investment?
            </FormHelperText>
          </FormControl>

          <Box sx={{ bgcolor: "#f5f5f5", p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              📋 <strong>Process:</strong> After submission, your suggestion
              will be reviewed by community admin. If approved, it will be sent
              to voting where members can vote to accept or decline the
              investment.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Suggestion"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
