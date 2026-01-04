"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import HomeIcon from "@mui/icons-material/Home";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { redirect: true, callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Could not sign in with Google. Please try again.");
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

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

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
    </Container>
  );
}
