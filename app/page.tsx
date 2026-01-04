"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";

export default function Home() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}
          >
            <HomeIcon />
            <Typography variant="h6" component="span" fontWeight="bold">
              CROWD Invest
            </Typography>
          </Box>
          <Button color="inherit" component={Link} href="/login">
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{ py: { xs: 6, md: 12, lg: 16 }, bgcolor: "background.default" }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                    }}
                  >
                    Invest Together, Grow Together
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                  >
                    CROWD Invest is a platform for community-based investments
                    for events and projects. Deposit funds, track profits, and
                    see your contributions make a difference.
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="large"
                  sx={{ py: 1.5, px: 4 }}
                >
                  Get Started
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  component="img"
                  src="https://picsum.photos/600/400"
                  alt="Hero"
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: { xs: 6, md: 12 }, bgcolor: "background.paper" }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              textAlign="center"
              fontWeight="bold"
              sx={{ mb: 6 }}
            >
              Why Choose CROWD Invest?
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <TrendingUpIcon
                      sx={{ fontSize: 40, color: "primary.main", mb: 2 }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Grow Your Wealth
                    </Typography>
                    <Typography color="text.secondary">
                      Invest in community projects and events with transparent
                      returns and real impact.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <GroupsIcon
                      sx={{ fontSize: 40, color: "success.main", mb: 2 }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Community Driven
                    </Typography>
                    <Typography color="text.secondary">
                      Join your community members in collective investments that
                      create shared value.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <SecurityIcon
                      sx={{ fontSize: 40, color: "warning.main", mb: 2 }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Secure & Transparent
                    </Typography>
                    <Typography color="text.secondary">
                      Track all investments, profits, and community votes with
                      complete transparency.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: "background.paper",
          py: 3,
          borderTop: "1px solid",
          borderColor: "divider",
          mt: "auto",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                &copy; 2024 CROWD Invest. All rights reserved.
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              sx={{ textAlign: { xs: "left", sm: "right" } }}
            >
              <Link
                href="#"
                style={{ textDecoration: "none", marginRight: 16 }}
              >
                <Typography component="span" variant="body2" color="primary">
                  Terms of Service
                </Typography>
              </Link>
              <Link href="#" style={{ textDecoration: "none" }}>
                <Typography component="span" variant="body2" color="primary">
                  Privacy
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
