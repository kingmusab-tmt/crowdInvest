"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  Home,
  ArrowBack,
  SentimentDissatisfied,
  SearchOff,
} from "@mui/icons-material";
import Link from "next/link";

const NotFoundPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Optional: Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          textAlign: "center",
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          width: "100%",
          maxWidth: 600,
        }}
      >
        {/* Animated Icon */}
        <Box
          sx={{
            position: "relative",
            display: "inline-block",
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: theme.palette.error.light,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": {
                  boxShadow: `0 0 0 0 ${theme.palette.error.light}40`,
                },
                "70%": {
                  boxShadow: `0 0 0 20px ${theme.palette.error.light}00`,
                },
                "100%": {
                  boxShadow: `0 0 0 0 ${theme.palette.error.light}00`,
                },
              },
            }}
          >
            <SearchOff
              sx={{
                fontSize: 48,
                color: "white",
              }}
            />
          </Box>
        </Box>

        {/* Main Title */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "3rem", md: "4rem" },
            fontWeight: "bold",
            color: theme.palette.text.primary,
            mb: 2,
            background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", md: "2rem" },
            fontWeight: "600",
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Oops! Page Not Found
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "1rem", md: "1.1rem" },
            color: theme.palette.text.secondary,
            mb: 4,
            lineHeight: 1.6,
            maxWidth: "80%",
            mx: "auto",
          }}
        >
          It seems you&apos;ve wandered off the path. The page you&apos;re
          looking for doesn&apos;t exist or has been moved.
        </Typography>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Button
            component={Link}
            href="/"
            variant="contained"
            size={isMobile ? "medium" : "large"}
            startIcon={<Home />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "600",
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[8],
              },
              transition: "all 0.3s ease",
            }}
          >
            Back to Home
          </Button>

          <Button
            variant="outlined"
            size={isMobile ? "medium" : "large"}
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "600",
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Go Back
          </Button>
        </Stack>

        {/* Auto-redirect Countdown */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontStyle: "italic",
            fontSize: "0.9rem",
          }}
        >
          Redirecting to homepage in 5 seconds...
        </Typography>

        {/* Decorative Elements */}
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
            zIndex: -1,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: `linear-gradient(45deg, ${theme.palette.error.light}10, ${theme.palette.warning.light}10)`,
            zIndex: -1,
          }}
        />
      </Paper>

      {/* Background Pattern */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(circle at 20% 80%, ${theme.palette.primary.light}10 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.light}10 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${theme.palette.error.light}05 0%, transparent 50%)
          `,
          zIndex: -2,
        }}
      />
    </Container>
  );
};

export default NotFoundPage;
