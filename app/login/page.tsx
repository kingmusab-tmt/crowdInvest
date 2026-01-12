"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  CircularProgress,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import HomeIcon from "@mui/icons-material/Home";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  void showSuccess;
  void showWarning;
  void showInfo;

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
        case "OAuthAccountNotLinked":
          showError(
            "Account linking failed. This email may already be registered with a different provider."
          );
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
              <Typography variant="h4" component="h1" fontWeight="bold">
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
              textAlign="center"
              gutterBottom
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 4 }}
            >
              Sign in to your account to continue
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              sx={{ mb: 3, py: 1.5 }}
            >
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                New user?
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              component={Link}
              href="/signup"
              sx={{ mb: 2 }}
            >
              Create an account
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary">
                  Return to home
                </Typography>
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container
          maxWidth="sm"
          sx={{ py: { xs: 4, sm: 6 }, textAlign: "center" }}
        >
          <CircularProgress />
        </Container>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
