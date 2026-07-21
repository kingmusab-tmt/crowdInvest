"use client";

import * as React from "react";
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
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const PLATFORM_NAME = "CrowdInvest";
const PLATFORM_TAGLINE = "Contribute together, invest together, grow together.";
const CONTACT_EMAIL = "info@triplemultipurposetechnology.com.ng";
const CONTACT_PHONES = ["+2348162552901", "+2349049376773"];
const DEVELOPER_NAME = "Triple Multipurpose Technology";
const DEVELOPER_URL = "https://www.triplemultipurposetechnology.com.ng";

const TERMS_TEXT = `1. About This Site
This website is a marketing site for CrowdInvest, a community investment platform developed and operated by ${DEVELOPER_NAME}.

2. Requesting Access
Submitting the "Request Access" form expresses interest in CrowdInvest for your community and authorizes us to contact you using the details provided.

3. Use of Information
Information submitted through this site is used solely to respond to your inquiry and is not sold or shared with third parties.

4. Intellectual Property
CrowdInvest and its branding are the property of ${DEVELOPER_NAME}. All rights reserved.`;

const PRIVACY_TEXT = `1. Information We Collect
When you submit the "Request Access" form, we collect your name, organization, email address, phone number, and any message you provide.

2. How We Use It
Your information is used only to respond to your access request and discuss setting up CrowdInvest for your community.

3. Data Protection
We do not sell or share your information with third parties. Data is stored securely and only used for the purpose you submitted it for.

4. Contact
Questions about this policy can be sent to ${CONTACT_EMAIL}.`;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
];

const FEATURES = [
  {
    icon: TrendingUpIcon,
    title: "Multi-Asset Investments",
    description:
      "Diversify community capital across stocks, business equity, crypto, real estate, bonds, and mutual funds.",
  },
  {
    icon: AccountBalanceWalletIcon,
    title: "Flexible Contributions",
    description:
      "One-time deposits, reserved accounts, or automatic recurring debits — contribute however works for your members.",
  },
  {
    icon: HowToVoteIcon,
    title: "Proposals & Voting",
    description:
      "Every major decision goes through a transparent, auditable member vote before it happens.",
  },
  {
    icon: VolunteerActivismIcon,
    title: "Community Assistance",
    description:
      "Members can request and receive financial support directly from the community fund.",
  },
  {
    icon: VerifiedUserIcon,
    title: "KYC & Verification",
    description:
      "Built-in identity verification protects every member's contribution and keeps the community trustworthy.",
  },
  {
    icon: NotificationsActiveIcon,
    title: "Real-Time Notifications",
    description:
      "In-app, email, and push alerts keep every member instantly informed of activity that matters to them.",
  },
  {
    icon: PeopleAltIcon,
    title: "Member Directory",
    description:
      "Discover and connect with fellow members directly via WhatsApp or their social profiles.",
  },
  {
    icon: InstallMobileIcon,
    title: "Install Anywhere",
    description:
      "A full progressive web app — install it like a native app on any phone, tablet, or desktop.",
  },
];

const STEPS = [
  {
    title: "Join & Verify",
    description:
      "Members sign up and complete a quick onboarding flow with identity verification.",
  },
  {
    title: "Contribute",
    description:
      "Set up one-time or recurring contributions to the community fund in a few clicks.",
  },
  {
    title: "Vote & Invest",
    description:
      "Propose ideas, vote as a community, and deploy pooled capital into real investments.",
  },
  {
    title: "Track & Withdraw",
    description:
      "Watch returns grow in real time and withdraw profit share whenever needed.",
  },
];

const USE_CASES = [
  {
    icon: GroupsIcon,
    title: "Savings Cooperatives",
    description:
      "Ajo, esusu, and other rotating savings groups ready to formalize how they pool, protect, and grow member funds.",
  },
  {
    icon: PeopleAltIcon,
    title: "Community Organizations",
    description:
      "Associations and clubs that need transparent, auditable management of shared community finances.",
  },
  {
    icon: TrendingUpIcon,
    title: "Investment Clubs",
    description:
      "Groups that want to pool capital and make collective investment decisions democratically, with a full paper trail.",
  },
];

const SECURITY_POINTS = [
  { icon: VerifiedUserIcon, label: "Identity verification (KYC) for every member" },
  { icon: LockIcon, label: "Encrypted data storage for sensitive information" },
  { icon: PaymentsIcon, label: "Secure payment processing via Paystack" },
  { icon: CheckCircleIcon, label: "Full audit trail on every transaction and vote" },
  { icon: SecurityIcon, label: "Configurable profile privacy — public or private" },
  { icon: AdminPanelSettingsIcon, label: "Admin oversight on every withdrawal and deposit" },
];

function DashboardMockup() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: theme.palette.mode === "light" ? 8 : 2,
        bgcolor: "background.paper",
      }}
    >
      {/* Chrome bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 2,
          py: 1.25,
          bgcolor: "action.hover",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <Box
            key={c}
            sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c, opacity: 0.85 }}
          />
        ))}
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Community Overview
          </Typography>
          <Chip label="This Month" size="small" variant="outlined" />
        </Stack>

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {[
            { label: "Total Pooled", value: "₦24.8M", color: theme.palette.primary.main },
            { label: "Active Investments", value: "12", color: theme.palette.success.main },
            { label: "Profit Share", value: "₦3.2M", color: theme.palette.warning.main },
          ].map((stat) => (
            <Grid key={stat.label} size={4}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(stat.color, theme.palette.mode === "dark" ? 0.16 : 0.08),
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, fontSize: { xs: "0.95rem", sm: "1.25rem" }, color: stat.color }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          INVESTMENT ALLOCATION
        </Typography>
        <Box
          sx={{
            display: "flex",
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            my: 1,
          }}
        >
          {[
            { w: 40, color: theme.palette.primary.main },
            { w: 25, color: theme.palette.success.main },
            { w: 20, color: theme.palette.warning.main },
            { w: 15, color: theme.palette.secondary.main },
          ].map((seg, i) => (
            <Box key={i} sx={{ width: `${seg.w}%`, bgcolor: seg.color }} />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          RECENT ACTIVITY
        </Typography>
        <Stack spacing={1.25} sx={{ mt: 1 }}>
          {[
            { label: "Real Estate proposal approved", amount: "+₦850,000" },
            { label: "Monthly contribution received", amount: "+₦45,000" },
            { label: "Profit share withdrawal", amount: "-₦120,000" },
          ].map((row) => (
            <Stack
              key={row.label}
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" noWrap>
                  {row.label}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: row.amount.startsWith("-") ? "error.main" : "success.main",
                  flexShrink: 0,
                  pl: 1,
                }}
              >
                {row.amount}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [legalDialog, setLegalDialog] = React.useState<"terms" | "privacy" | null>(
    null
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.25, flexGrow: 1 }}
            >
              <Image
                src="/android-chrome-192x192.png"
                alt={PLATFORM_NAME}
                width={32}
                height={32}
                style={{ borderRadius: 8 }}
              />
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                {PLATFORM_NAME}
              </Typography>
            </Box>

            <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" }, mr: 2 }}>
              {NAV_LINKS.map((link) => (
                <Typography
                  key={link.href}
                  component="a"
                  href={link.href}
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    textDecoration: "none",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>

            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Button variant="contained" component={Link} href="/request-access">
                Request Access
              </Button>
            </Box>

            <IconButton
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="toggle menu"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>

          {mobileMenuOpen && (
            <Box sx={{ display: { sm: "none" }, pb: 2 }}>
              <Stack spacing={1.5}>
                {NAV_LINKS.map((link) => (
                  <Typography
                    key={link.href}
                    component="a"
                    href={link.href}
                    variant="body2"
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ fontWeight: 600, color: "text.primary", textDecoration: "none" }}
                  >
                    {link.label}
                  </Typography>
                ))}
                <Divider />
                <Button variant="contained" component={Link} href="/request-access" fullWidth>
                  Request Access
                </Button>
              </Stack>
            </Box>
          )}
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* Hero */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            py: { xs: 8, md: 14 },
            background: (t) =>
              `radial-gradient(circle at 15% 20%, ${alpha(
                t.palette.primary.main,
                t.palette.mode === "dark" ? 0.18 : 0.1
              )}, transparent 45%), radial-gradient(circle at 85% 10%, ${alpha(
                t.palette.secondary.main,
                t.palette.mode === "dark" ? 0.16 : 0.08
              )}, transparent 40%)`,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={6} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Chip
                  label="Community Investment Platform"
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2, fontWeight: 600 }}
                />
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.15,
                    mb: 2,
                    fontSize: { xs: "2.1rem", sm: "2.75rem", md: "3.25rem" },
                  }}
                >
                  Turn your community's savings into real investments
                </Typography>
                <Typography
                  variant="h6"
                  component="p"
                  sx={{ color: "text.secondary", fontWeight: 400, mb: 4, maxWidth: 520 }}
                >
                  {PLATFORM_NAME} helps savings groups, cooperatives, and
                  community organizations pool contributions, invest together, and
                  govern every decision through transparent member voting.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
                  <Button
                    component={Link}
                    href="/request-access"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ py: 1.5, px: 4 }}
                  >
                    Request Access for Your Community
                  </Button>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1, sm: 3 }}
                  sx={{ flexWrap: "wrap" }}
                >
                  {["No setup fees", "Secure payments via Paystack", "KYC-verified members"].map(
                    (item) => (
                      <Stack key={item} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {item}
                        </Typography>
                      </Stack>
                    )
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DashboardMockup />
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Capability band */}
        <Box sx={{ py: { xs: 3, md: 4 }, bgcolor: "background.paper", borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {[
                { icon: TrendingUpIcon, label: "6 Asset Classes to Invest In" },
                { icon: PaymentsIcon, label: "Secure Payments via Paystack" },
                { icon: AdminPanelSettingsIcon, label: "Full Admin Control" },
                { icon: InstallMobileIcon, label: "Installable on Any Device" },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 6, md: 3 }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: { xs: "flex-start", md: "center" } }}>
                    <item.icon sx={{ color: "primary.main", fontSize: 22, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Features */}
        <Box id="features" sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: 6, maxWidth: 640, mx: "auto" }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                Everything a community needs to invest together
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                From onboarding to payouts, every part of the process is built in.
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {FEATURES.map((feature) => (
                <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.18 : 0.1),
                          mb: 2,
                        }}
                      >
                        <feature.icon sx={{ color: "primary.main" }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* How it works */}
        <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.paper" }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                How it works
              </Typography>
            </Box>
            <Grid container spacing={4}>
              {STEPS.map((step, i) => (
                <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {step.description}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Use cases */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                Built for community-driven groups
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Whether you call it ajo, esusu, or an investment club — this is for you.
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {USE_CASES.map((useCase) => (
                <Grid key={useCase.title} size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={0}
                    sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1 }}
                  >
                    <CardContent>
                      <useCase.icon sx={{ fontSize: 36, color: "primary.main", mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {useCase.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {useCase.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Security */}
        <Box id="security" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.paper" }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Chip label="Security & Trust" color="primary" variant="outlined" size="small" sx={{ mb: 2, fontWeight: 600 }} />
                <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                  Built on trust, backed by verification
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Every contribution and payout is protected by identity verification,
                  encrypted storage, and a complete audit trail admins can review at
                  any time.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={2}>
                  {SECURITY_POINTS.map((point) => (
                    <Grid key={point.label} size={{ xs: 12, sm: 6 }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems: "center",
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.default",
                        }}
                      >
                        <point.icon sx={{ color: "primary.main", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {point.label}
                        </Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Admin control callout */}
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Container maxWidth="lg">
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.12 : 0.06),
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Grid container spacing={4} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                      <AdminPanelSettingsIcon sx={{ color: "primary.main", fontSize: 32 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Complete control for administrators
                      </Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                      Configure branding, feature modules, financial policies, KYC
                      rules, notification templates, and security settings — all
                      from one platform settings dashboard, no code required.
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <Button
                      component={Link}
                      href="/request-access"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                    >
                      Request Access
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* Final CTA */}
        <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "primary.main", color: "primary.contrastText" }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
              Ready to grow together?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Request access to {PLATFORM_NAME} and start pooling, investing, and
              growing with your community today.
            </Typography>
            <Button
              component={Link}
              href="/request-access"
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                px: 5,
                bgcolor: "background.paper",
                color: "primary.main",
                "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
              }}
            >
              Request Access for Your Community
            </Button>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: "background.paper", py: 6, borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                <Image
                  src="/android-chrome-192x192.png"
                  alt={PLATFORM_NAME}
                  width={28}
                  height={28}
                  style={{ borderRadius: 6 }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {PLATFORM_NAME}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 280 }}>
                {PLATFORM_TAGLINE}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Product
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="#features" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
                  Features
                </Typography>
                <Typography component="a" href="#how-it-works" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
                  How It Works
                </Typography>
                <Typography component="a" href="#security" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
                  Security
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Contact
              </Typography>
              <Stack spacing={1}>
                <Typography
                  component="a"
                  href={`mailto:${CONTACT_EMAIL}`}
                  variant="body2"
                  sx={{ color: "text.secondary", textDecoration: "none", wordBreak: "break-all", "&:hover": { color: "primary.main" } }}
                >
                  {CONTACT_EMAIL}
                </Typography>
                {CONTACT_PHONES.map((phone) => (
                  <Typography
                    key={phone}
                    component="a"
                    href={`tel:${phone}`}
                    variant="body2"
                    sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
                  >
                    {phone}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Typography
                  component="button"
                  onClick={() => setLegalDialog("terms")}
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    textDecoration: "none",
                    background: "none",
                    border: "none",
                    p: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    font: "inherit",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Terms & Conditions
                </Typography>
                <Typography
                  component="button"
                  onClick={() => setLegalDialog("privacy")}
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    textDecoration: "none",
                    background: "none",
                    border: "none",
                    p: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    font: "inherit",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Privacy Policy
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ justifyContent: "space-between", alignItems: "center", textAlign: "center" }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              &copy; {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Designed and developed by{" "}
              <Typography
                component="a"
                href={DEVELOPER_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                {DEVELOPER_NAME}
              </Typography>
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Legal dialogs */}
      <Dialog
        open={legalDialog === "terms"}
        onClose={() => setLegalDialog(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Terms and Conditions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {TERMS_TEXT}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLegalDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={legalDialog === "privacy"}
        onClose={() => setLegalDialog(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {PRIVACY_TEXT}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLegalDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
