"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import GoogleIcon from "@mui/icons-material/Google";
import LockIcon from "@mui/icons-material/Lock";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { usePlatformSettings } from "@/components/PlatformSettingsContext";

const BRAND_POINTS = [
  { icon: TrendingUpIcon, label: "Track contributions and investments in real time" },
  { icon: HowToVoteIcon, label: "Vote on proposals shaping your community" },
  { icon: VerifiedUserIcon, label: "KYC-verified, secure member accounts" },
];

function LoginPageContent() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const { settings } = usePlatformSettings();
  const [isLoading, setIsLoading] = useState(false);
  const { snackbar, closeSnackbar, showError } = useSnackbar();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          showError(
            "This email is already associated with another sign-in method. Please use your original sign-in method or contact support."
          );
          break;
        case "OAuthSignin":
          showError("Error occurred during sign in. Please try again.");
          break;
        case "OAuthCallback":
          showError(
            "Error occurred during authentication callback. Please try again."
          );
          break;
        case "OAuthCreateAccount":
          showError("Could not create account. Please try again.");
          break;
        case "EmailCreateAccount":
          showError("Could not create account with email. Please try again.");
          break;
        case "Callback":
          showError("Authentication callback error. Please try again.");
          break;
        case "EmailSignin":
          showError("Check your email address or try another sign-in method.");
          break;
        case "CredentialsSignin":
          showError("Sign in failed. Please check your credentials.");
          break;
        case "SessionRequired":
          showError("Please sign in to continue.");
          break;
        default:
          showError("An authentication error occurred. Please try again.");
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    closeSnackbar();
    try {
      await signIn("google", { redirect: true, callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      showError("Could not sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Grid container sx={{ flexGrow: 1 }}>
        {/* Branding panel — desktop only */}
        <Grid
          size={{ xs: 0, md: 5, lg: 6 }}
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            p: 6,
            background: (t) =>
              `radial-gradient(circle at 20% 20%, ${alpha(
                t.palette.primary.main,
                t.palette.mode === "dark" ? 0.35 : 0.16
              )}, transparent 50%), radial-gradient(circle at 80% 80%, ${alpha(
                t.palette.secondary.main,
                t.palette.mode === "dark" ? 0.3 : 0.14
              )}, transparent 50%)`,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ maxWidth: 440 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 4 }}>
              <Image
                src="/android-chrome-192x192.png"
                alt={settings.platformName}
                width={44}
                height={44}
                style={{ borderRadius: 10 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {settings.platformName}
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { md: "2.25rem", lg: "2.5rem" }, lineHeight: 1.2 }}>
              Welcome back to your community
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 5 }}>
              Sign in to keep track of your contributions, investments, and
              everything your community is building together.
            </Typography>

            <Stack spacing={2.5}>
              {BRAND_POINTS.map((point) => (
                <Stack key={point.label} direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.2 : 0.1),
                      flexShrink: 0,
                    }}
                  >
                    <point.icon sx={{ color: "primary.main", fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {point.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>

        {/* Sign-in panel */}
        <Grid
          size={{ xs: 12, md: 7, lg: 6 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            p: { xs: 2, sm: 4 },
          }}
        >
          <Container maxWidth="xs" disableGutters>
            <Box sx={{ textAlign: "center", mb: 4, display: { xs: "block", md: "none" } }}>
              <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "center" }}>
                  <Image
                    src="/android-chrome-192x192.png"
                    alt={settings.platformName}
                    width={36}
                    height={36}
                    style={{ borderRadius: 8 }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {settings.platformName}
                  </Typography>
                </Stack>
              </Link>
            </Box>

            <Box
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: theme.palette.mode === "light" ? "0 8px 32px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Sign in
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                Use your Google account to access your dashboard
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={!isLoading ? <GoogleIcon /> : undefined}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                sx={{ py: 1.5, mb: 3 }}
              >
                {isLoading ? <CircularProgress size={22} /> : "Continue with Google"}
              </Button>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", mb: 3 }}>
                <LockIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Secured sign-in — your data is encrypted
                </Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={2} sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  New to {settings.platformName}?{" "}
                  <Typography
                    component={Link}
                    href="/signup"
                    variant="body2"
                    sx={{ fontWeight: 600, color: "primary.main", textDecoration: "none" }}
                  >
                    Create an account
                  </Typography>
                </Typography>
                <Typography
                  component={Link}
                  href="/"
                  variant="body2"
                  sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
                >
                  ← Back to home
                </Typography>
              </Stack>
            </Box>
          </Container>
        </Grid>
      </Grid>

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
