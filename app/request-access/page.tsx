"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

const COMMUNITY_SIZE_OPTIONS = [
  "Under 20 members",
  "20-50 members",
  "50-100 members",
  "100-500 members",
  "500+ members",
];

export default function RequestAccessPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const { snackbar, closeSnackbar, showError } = useSnackbar();

  const [formData, setFormData] = React.useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    communitySize: "",
    message: "",
  });

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.organization || !formData.email) {
      showError("Please fill in your name, organization, and email");
      return;
    }

    setSubmitting(true);
    closeSnackbar();

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        showError(data.error || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      showError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, sm: 8 } }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", mb: 2 }}>
              <Image
                src="/android-chrome-192x192.png"
                alt="CrowdInvest"
                width={32}
                height={32}
                style={{ borderRadius: 8 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                CrowdInvest
              </Typography>
            </Stack>
          </Link>
        </Box>

        <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          {submitted ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                Request received
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
                Thank you for your interest in CrowdInvest. Our team will reach
                out to you shortly to discuss setting up your community.
              </Typography>
              <Button component={Link} href="/" variant="outlined" startIcon={<ArrowBackIcon />}>
                Back to Home
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                Request Access for Your Community
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                Tell us about your community and we'll be in touch to get you
                set up on CrowdInvest.
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={handleChange("name")}
                  />
                  <TextField
                    label="Organization / Community Name"
                    fullWidth
                    required
                    value={formData.organization}
                    onChange={handleChange("organization")}
                  />
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    onChange={handleChange("email")}
                  />
                  <TextField
                    label="Phone Number"
                    fullWidth
                    value={formData.phone}
                    onChange={handleChange("phone")}
                  />
                  <TextField
                    select
                    label="Community Size"
                    fullWidth
                    value={formData.communitySize}
                    onChange={handleChange("communitySize")}
                  >
                    {COMMUNITY_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Tell us more (optional)"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="What are you hoping to use CrowdInvest for?"
                    value={formData.message}
                    onChange={handleChange("message")}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{ py: 1.5 }}
                  >
                    {submitting ? <CircularProgress size={24} /> : "Submit Request"}
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Paper>
      </Container>

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
