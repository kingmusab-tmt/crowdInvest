"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

const communities = ["Northside", "Southside", "West End", "Downtown"];

export default function VerificationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [community, setCommunity] = useState("");
  const [verificationInfo, setVerificationInfo] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function handleVerificationSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (!session?.user?.email) {
      showError("No logged in user found.");
      return;
    }

    if (!community || !verificationInfo) {
      showError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          community,
          verificationInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit verification");
      }

      showSuccess("Verification submitted! Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      console.error("Verification submission error:", err);
      showError("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <HomeIcon sx={{ fontSize: 32 }} color="primary" />
              <Typography variant="h4" component="h1" sx={{
                fontWeight: "bold"
              }}>
                CROWD Invest
              </Typography>
            </Box>
          </Link>
        </Box>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                textAlign: "center"
              }}
            >
              Community Verification
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                mb: 4
              }}>
              Complete your profile by providing community details
            </Typography>

            <Box
              component="form"
              onSubmit={handleVerificationSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                select
                fullWidth
                label="Community"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                required
              >
                {communities.map((comm) => (
                  <MenuItem key={comm} value={comm}>
                    {comm}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Verification Information"
                placeholder="Provide information for your community admin to verify your identity (e.g., your address, family name, or a reference)."
                value={verificationInfo}
                onChange={(e) => setVerificationInfo(e.target.value)}
                required
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? "Submitting..." : "Submit Verification"}
              </Button>
            </Box>
          </CardContent>
        </Card>
        <SnackbarAlert
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </Container>
  );
}
