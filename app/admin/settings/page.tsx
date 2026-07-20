"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip,
  Grid,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BusinessIcon from "@mui/icons-material/Business";
import ExtensionIcon from "@mui/icons-material/Extension";
import PaidIcon from "@mui/icons-material/Paid";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SecurityIcon from "@mui/icons-material/Security";
import GavelIcon from "@mui/icons-material/Gavel";
import PaletteIcon from "@mui/icons-material/Palette";
import { INVESTMENT_TYPE_OPTIONS } from "@/lib/investmentTypes";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

const TABS = [
  { label: "General", icon: <BusinessIcon fontSize="small" /> },
  { label: "Community Modules", icon: <ExtensionIcon fontSize="small" /> },
  { label: "Financial", icon: <PaidIcon fontSize="small" /> },
  { label: "Investment Types", icon: <TrendingUpIcon fontSize="small" /> },
  { label: "KYC & Verification", icon: <VerifiedUserIcon fontSize="small" /> },
  { label: "Notifications", icon: <NotificationsIcon fontSize="small" /> },
  { label: "Payment Gateway", icon: <CreditCardIcon fontSize="small" /> },
  { label: "Security", icon: <SecurityIcon fontSize="small" /> },
  { label: "Legal & Compliance", icon: <GavelIcon fontSize="small" /> },
  { label: "Appearance", icon: <PaletteIcon fontSize="small" /> },
];

interface PlatformSettings {
  platformName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  currencyCode: string;
  currencySymbol: string;
  footerText?: string;
  minimumContribution: number;
  minimumWithdrawal: number;
  autoApproveWithdrawalUnder: number;
  enabledInvestmentTypes: string[];
  kyc: {
    requireBvn: boolean;
    requireNin: boolean;
    requireIdUpload: boolean;
    autoApprove: boolean;
  };
  notifications: {
    emailSenderName: string;
    emailSenderAddress?: string;
    smsProviderEnabled: boolean;
  };
  payment: {
    mode: "test" | "live";
    provider: string;
  };
  security: {
    sessionDurationHours: number;
    requireTwoFactorForAdmins: boolean;
    passwordMinLength: number;
  };
  legal: {
    termsAndConditions: string;
    privacyPolicy: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
  };
}

interface CommunityDoc {
  _id: string;
  name: string;
  description: string;
  status: "Active" | "Suspended";
  enabledFunctions: {
    investments: boolean;
    proposals: boolean;
    events: boolean;
    assistance: boolean;
    kyc: boolean;
    withdrawals: boolean;
  };
}

function SectionCard({
  title,
  description,
  children,
  onSave,
  saving,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {description}
        </Typography>
      )}
      <Stack spacing={2.5}>{children}</Stack>
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          size="large"
        >
          {saving ? <CircularProgress size={22} /> : "Save Changes"}
        </Button>
      </Box>
    </Paper>
  );
}

export default function AdminSettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [savingSection, setSavingSection] = React.useState<string | null>(
    null
  );
  const [settings, setSettings] = React.useState<PlatformSettings | null>(
    null
  );
  const [community, setCommunity] = React.useState<CommunityDoc | null>(null);
  const [paystackStatus, setPaystackStatus] = React.useState<{
    secretKeyConfigured: boolean;
    keyMode: "live" | "test" | "unknown";
  } | null>(null);

  const { snackbar, closeSnackbar, showError, showSuccess } = useSnackbar();

  React.useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [settingsRes, communityRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/community"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        if (data.paystackStatus) setPaystackStatus(data.paystackStatus);
      } else {
        showError("Failed to load platform settings");
      }

      if (communityRes.ok) {
        setCommunity(await communityRes.json());
      }
    } catch (err) {
      console.error("Failed to load settings", err);
      showError("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(
    sectionKey: string,
    payload: Partial<PlatformSettings>
  ) {
    setSavingSection(sectionKey);
    closeSnackbar();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        showSuccess("Settings saved successfully");
      } else {
        const err = await res.json();
        showError(err.error || "Failed to save settings");
      }
    } catch (err) {
      showError("Failed to save settings");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveCommunity(payload: Partial<CommunityDoc>) {
    setSavingSection("community");
    closeSnackbar();
    try {
      const res = await fetch("/api/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCommunity(await res.json());
        showSuccess("Community settings saved successfully");
      } else {
        const err = await res.json();
        showError(err.error || "Failed to save community settings");
      }
    } catch (err) {
      showError("Failed to save community settings");
    } finally {
      setSavingSection(null);
    }
  }

  if (loading || !settings) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      disableGutters={isMobile}
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.5rem", sm: "2rem" } }}
      >
        Platform Settings
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Full administrative control over platform configuration
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        <Paper
          sx={{
            borderRadius: 3,
            flexShrink: 0,
            width: { md: 240 },
            height: "fit-content",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            orientation={isMobile ? "horizontal" : "vertical"}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": {
                alignItems: "flex-start",
                textAlign: "left",
                minHeight: 48,
                flexDirection: "row",
                gap: 1,
                justifyContent: "flex-start",
              },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.label} icon={t.icon} iconPosition="start" label={t.label} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {tab === 0 && (
            <GeneralTab
              settings={settings}
              saving={savingSection === "general"}
              onSave={(payload) => saveSettings("general", payload)}
            />
          )}
          {tab === 1 && (
            <CommunityModulesTab
              community={community}
              saving={savingSection === "community"}
              onSave={saveCommunity}
            />
          )}
          {tab === 2 && (
            <FinancialTab
              settings={settings}
              saving={savingSection === "financial"}
              onSave={(payload) => saveSettings("financial", payload)}
            />
          )}
          {tab === 3 && (
            <InvestmentTypesTab
              settings={settings}
              saving={savingSection === "investmentTypes"}
              onSave={(payload) => saveSettings("investmentTypes", payload)}
            />
          )}
          {tab === 4 && (
            <KycTab
              settings={settings}
              saving={savingSection === "kyc"}
              onSave={(payload) => saveSettings("kyc", payload)}
            />
          )}
          {tab === 5 && (
            <NotificationsTab
              settings={settings}
              saving={savingSection === "notifications"}
              onSave={(payload) => saveSettings("notifications", payload)}
            />
          )}
          {tab === 6 && (
            <PaymentTab
              settings={settings}
              paystackStatus={paystackStatus}
              saving={savingSection === "payment"}
              onSave={(payload) => saveSettings("payment", payload)}
            />
          )}
          {tab === 7 && (
            <SecurityTab
              settings={settings}
              saving={savingSection === "security"}
              onSave={(payload) => saveSettings("security", payload)}
            />
          )}
          {tab === 8 && (
            <LegalTab
              settings={settings}
              saving={savingSection === "legal"}
              onSave={(payload) => saveSettings("legal", payload)}
            />
          )}
          {tab === 9 && (
            <AppearanceTab
              settings={settings}
              saving={savingSection === "appearance"}
              onSave={(payload) => saveSettings("appearance", payload)}
            />
          )}
        </Box>
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

/* ---------------------------- Tab 0: General ---------------------------- */

function GeneralTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState({
    platformName: settings.platformName || "",
    tagline: settings.tagline || "",
    supportEmail: settings.supportEmail || "",
    supportPhone: settings.supportPhone || "",
    currencyCode: settings.currencyCode || "NGN",
    currencySymbol: settings.currencySymbol || "₦",
    footerText: settings.footerText || "",
    logoUrl: settings.logoUrl || "",
    faviconUrl: settings.faviconUrl || "",
  });

  return (
    <SectionCard
      title="General & Branding"
      description="Core identity shown across the platform, emails, and browser tab"
      saving={saving}
      onSave={() => onSave(form)}
    >
      <TextField
        label="Platform Name"
        fullWidth
        value={form.platformName}
        onChange={(e) => setForm({ ...form, platformName: e.target.value })}
      />
      <TextField
        label="Tagline"
        fullWidth
        value={form.tagline}
        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Support Email"
            type="email"
            fullWidth
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Support Phone"
            fullWidth
            value={form.supportPhone}
            onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="Currency Code"
            fullWidth
            value={form.currencyCode}
            onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="Currency Symbol"
            fullWidth
            value={form.currencySymbol}
            onChange={(e) =>
              setForm({ ...form, currencySymbol: e.target.value })
            }
          />
        </Grid>
      </Grid>
      <TextField
        label="Logo URL"
        fullWidth
        placeholder="https://..."
        value={form.logoUrl}
        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
      />
      <TextField
        label="Favicon URL"
        fullWidth
        placeholder="https://..."
        value={form.faviconUrl}
        onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
      />
      <TextField
        label="Footer Text"
        fullWidth
        multiline
        rows={2}
        value={form.footerText}
        onChange={(e) => setForm({ ...form, footerText: e.target.value })}
      />
    </SectionCard>
  );
}

/* ------------------------ Tab 1: Community Modules ----------------------- */

function CommunityModulesTab({
  community,
  saving,
  onSave,
}: {
  community: CommunityDoc | null;
  saving: boolean;
  onSave: (payload: Partial<CommunityDoc>) => void;
}) {
  const [form, setForm] = React.useState({
    name: community?.name || "",
    description: community?.description || "",
    status: community?.status || "Active",
    enabledFunctions: community?.enabledFunctions || {
      investments: true,
      proposals: true,
      events: true,
      assistance: true,
      kyc: true,
      withdrawals: true,
    },
  });

  React.useEffect(() => {
    if (community) {
      setForm({
        name: community.name,
        description: community.description,
        status: community.status,
        enabledFunctions: community.enabledFunctions,
      });
    }
  }, [community]);

  const moduleLabels: Record<
    keyof CommunityDoc["enabledFunctions"],
    string
  > = {
    investments: "Investments",
    proposals: "Proposals & Voting",
    events: "Events",
    assistance: "Assistance Requests",
    kyc: "KYC Verification",
    withdrawals: "Withdrawals",
  };

  return (
    <SectionCard
      title="Community Modules"
      description="Rename the community and turn entire feature modules on or off platform-wide"
      saving={saving}
      onSave={() => onSave(form)}
    >
      <TextField
        label="Community Name"
        fullWidth
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <TextField
        label="Community Description"
        fullWidth
        multiline
        rows={2}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.status === "Active"}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.checked ? "Active" : "Suspended",
              })
            }
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              Community {form.status === "Active" ? "Active" : "Suspended"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Suspending disables new member sign-ups
            </Typography>
          </Box>
        }
      />

      <Divider />
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Feature Modules
      </Typography>
      <FormGroup>
        {(
          Object.keys(moduleLabels) as Array<
            keyof CommunityDoc["enabledFunctions"]
          >
        ).map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                checked={form.enabledFunctions[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enabledFunctions: {
                      ...form.enabledFunctions,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
            }
            label={moduleLabels[key]}
          />
        ))}
      </FormGroup>
    </SectionCard>
  );
}

/* --------------------------- Tab 2: Financial ---------------------------- */

function FinancialTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState({
    minimumContribution: settings.minimumContribution,
    minimumWithdrawal: settings.minimumWithdrawal,
    autoApproveWithdrawalUnder: settings.autoApproveWithdrawalUnder,
  });

  return (
    <SectionCard
      title="Financial Settings"
      description="Minimum amounts enforced platform-wide for contributions and withdrawals"
      saving={saving}
      onSave={() =>
        onSave({
          minimumContribution: Number(form.minimumContribution) || 0,
          minimumWithdrawal: Number(form.minimumWithdrawal) || 0,
          autoApproveWithdrawalUnder:
            Number(form.autoApproveWithdrawalUnder) || 0,
        })
      }
    >
      <TextField
        label="Minimum Contribution Amount (₦)"
        type="number"
        fullWidth
        value={form.minimumContribution}
        onChange={(e) =>
          setForm({ ...form, minimumContribution: Number(e.target.value) })
        }
        helperText="Set to 0 for no minimum"
      />
      <TextField
        label="Minimum Withdrawal Amount (₦)"
        type="number"
        fullWidth
        value={form.minimumWithdrawal}
        onChange={(e) =>
          setForm({ ...form, minimumWithdrawal: Number(e.target.value) })
        }
        helperText="Set to 0 for no minimum"
      />
      <TextField
        label="Auto-Approve Withdrawals Under (₦)"
        type="number"
        fullWidth
        value={form.autoApproveWithdrawalUnder}
        onChange={(e) =>
          setForm({
            ...form,
            autoApproveWithdrawalUnder: Number(e.target.value),
          })
        }
        helperText="Withdrawal requests below this amount are approved automatically. Set to 0 to disable and always require manual review."
      />
    </SectionCard>
  );
}

/* ----------------------- Tab 3: Investment Types -------------------------- */

function InvestmentTypesTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [enabled, setEnabled] = React.useState<string[]>(
    settings.enabledInvestmentTypes || []
  );

  const toggle = (value: string) => {
    setEnabled((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <SectionCard
      title="Investment Types"
      description="Choose which investment types members and admins can create"
      saving={saving}
      onSave={() => onSave({ enabledInvestmentTypes: enabled })}
    >
      <FormGroup>
        {INVESTMENT_TYPE_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Switch
                checked={enabled.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
            }
            label={
              <Box>
                <Typography variant="body1">{option.label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {option.description}
                </Typography>
              </Box>
            }
          />
        ))}
      </FormGroup>
      {enabled.length === 0 && (
        <Alert severity="warning">
          No investment types are enabled — members won't be able to create
          any new investments.
        </Alert>
      )}
    </SectionCard>
  );
}

/* --------------------------- Tab 4: KYC ----------------------------------- */

function KycTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState(settings.kyc);

  return (
    <SectionCard
      title="KYC & Verification"
      description="Control identity verification requirements for new members"
      saving={saving}
      onSave={() => onSave({ kyc: form })}
    >
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={form.requireBvn}
              onChange={(e) =>
                setForm({ ...form, requireBvn: e.target.checked })
              }
            />
          }
          label="Require BVN"
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.requireNin}
              onChange={(e) =>
                setForm({ ...form, requireNin: e.target.checked })
              }
            />
          }
          label="Require NIN"
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.requireIdUpload}
              onChange={(e) =>
                setForm({ ...form, requireIdUpload: e.target.checked })
              }
            />
          }
          label="Require Government ID Upload"
        />
      </FormGroup>
      <Divider />
      <FormControlLabel
        control={
          <Switch
            checked={form.autoApprove}
            onChange={(e) =>
              setForm({ ...form, autoApprove: e.target.checked })
            }
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              Auto-Approve KYC on Profile Completion
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              When enabled, members are automatically verified once they
              complete onboarding, skipping manual admin review
            </Typography>
          </Box>
        }
      />
    </SectionCard>
  );
}

/* ----------------------- Tab 5: Notifications ------------------------------ */

function NotificationsTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState(settings.notifications);

  return (
    <SectionCard
      title="Notifications"
      description="Branding used in outbound email notifications"
      saving={saving}
      onSave={() => onSave({ notifications: form })}
    >
      <TextField
        label="Email Sender Name"
        fullWidth
        value={form.emailSenderName}
        onChange={(e) =>
          setForm({ ...form, emailSenderName: e.target.value })
        }
      />
      <TextField
        label="Email Sender Address"
        type="email"
        fullWidth
        value={form.emailSenderAddress || ""}
        onChange={(e) =>
          setForm({ ...form, emailSenderAddress: e.target.value })
        }
        helperText="Requires matching SMTP configuration in environment variables"
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.smsProviderEnabled}
            onChange={(e) =>
              setForm({ ...form, smsProviderEnabled: e.target.checked })
            }
          />
        }
        label={
          <Box>
            <Typography variant="body1">SMS Notifications</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Requires an SMS provider configured in environment variables
            </Typography>
          </Box>
        }
      />
    </SectionCard>
  );
}

/* ------------------------ Tab 6: Payment Gateway ---------------------------- */

function PaymentTab({
  settings,
  paystackStatus,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  paystackStatus: {
    secretKeyConfigured: boolean;
    keyMode: "live" | "test" | "unknown";
  } | null;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [mode, setMode] = React.useState(settings.payment.mode);

  return (
    <SectionCard
      title="Payment Gateway"
      description="Paystack connection status and mode"
      saving={saving}
      onSave={() => onSave({ payment: { ...settings.payment, mode } })}
    >
      <Stack
        spacing={1}
        useFlexGap
        sx={{ flexDirection: "row", flexWrap: "wrap" }}
      >
        <Chip
          label={`Secret Key: ${
            paystackStatus?.secretKeyConfigured ? "Configured" : "Missing"
          }`}
          color={paystackStatus?.secretKeyConfigured ? "success" : "error"}
          size="small"
        />
        {paystackStatus?.secretKeyConfigured && (
          <Chip
            label={`Detected: ${paystackStatus.keyMode} key`}
            color={paystackStatus.keyMode === "live" ? "warning" : "default"}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>
      <Alert severity="info">
        The actual API key is managed via the PAYSTACK_SECRET_KEY
        environment variable for security and isn't editable here — this
        app initializes payments server-side, so no public key is needed.
        The toggle below is a record of your intended mode; make sure it
        matches the key actually configured in your environment.
      </Alert>
      <FormControlLabel
        control={
          <Switch
            checked={mode === "live"}
            onChange={(e) => setMode(e.target.checked ? "live" : "test")}
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              {mode === "live" ? "Live Mode" : "Test Mode"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Reflects which Paystack keys should be in use. Ensure your
              environment variables match this mode.
            </Typography>
          </Box>
        }
      />
    </SectionCard>
  );
}

/* -------------------------- Tab 7: Security --------------------------------- */

function SecurityTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState(settings.security);

  return (
    <SectionCard
      title="Security"
      description="Session and password policy for all accounts"
      saving={saving}
      onSave={() => onSave({ security: form })}
    >
      <Alert severity="info">
        Changes here take effect for new sign-ins after the next server
        deployment/restart, since session configuration is applied at
        server startup.
      </Alert>
      <TextField
        label="Session Duration (hours)"
        type="number"
        fullWidth
        value={form.sessionDurationHours}
        onChange={(e) =>
          setForm({
            ...form,
            sessionDurationHours: Number(e.target.value),
          })
        }
      />
      <TextField
        label="Minimum Password Length"
        type="number"
        fullWidth
        value={form.passwordMinLength}
        onChange={(e) =>
          setForm({ ...form, passwordMinLength: Number(e.target.value) })
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={form.requireTwoFactorForAdmins}
            onChange={(e) =>
              setForm({
                ...form,
                requireTwoFactorForAdmins: e.target.checked,
              })
            }
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              Require Two-Factor Authentication for Admins
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Reserved for future use — 2FA is not yet implemented
            </Typography>
          </Box>
        }
      />
    </SectionCard>
  );
}

/* ---------------------- Tab 8: Legal & Compliance ---------------------------- */

function LegalTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState(settings.legal);

  return (
    <SectionCard
      title="Legal & Compliance"
      description="Terms, privacy policy, and platform-wide maintenance mode"
      saving={saving}
      onSave={() => onSave({ legal: form })}
    >
      <FormControlLabel
        control={
          <Switch
            checked={form.maintenanceMode}
            onChange={(e) =>
              setForm({ ...form, maintenanceMode: e.target.checked })
            }
            color="warning"
          />
        }
        label={
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Maintenance Mode
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Blocks all non-admin access to the platform
            </Typography>
          </Box>
        }
      />
      {form.maintenanceMode && (
        <Alert severity="warning">
          Maintenance mode is ON. Only admins can access the platform right
          now.
        </Alert>
      )}
      <TextField
        label="Maintenance Message"
        fullWidth
        multiline
        rows={2}
        value={form.maintenanceMessage || ""}
        onChange={(e) =>
          setForm({ ...form, maintenanceMessage: e.target.value })
        }
      />
      <Divider />
      <TextField
        label="Terms & Conditions"
        fullWidth
        multiline
        rows={8}
        value={form.termsAndConditions}
        onChange={(e) =>
          setForm({ ...form, termsAndConditions: e.target.value })
        }
      />
      <TextField
        label="Privacy Policy"
        fullWidth
        multiline
        rows={8}
        value={form.privacyPolicy}
        onChange={(e) => setForm({ ...form, privacyPolicy: e.target.value })}
      />
    </SectionCard>
  );
}

/* -------------------------- Tab 9: Appearance -------------------------------- */

function AppearanceTab({
  settings,
  saving,
  onSave,
}: {
  settings: PlatformSettings;
  saving: boolean;
  onSave: (payload: Partial<PlatformSettings>) => void;
}) {
  const [form, setForm] = React.useState(settings.appearance);

  return (
    <SectionCard
      title="Appearance"
      description="Brand colors applied across the platform theme"
      saving={saving}
      onSave={() => onSave({ appearance: form })}
    >
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Primary Color
          </Typography>
          <Stack
            spacing={1.5}
            sx={{ flexDirection: "row", alignItems: "center" }}
          >
            <Box
              component="input"
              type="color"
              value={form.primaryColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              sx={{
                width: 48,
                height: 48,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                p: 0,
              }}
            />
            <TextField
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              fullWidth
            />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Secondary Color
          </Typography>
          <Stack
            spacing={1.5}
            sx={{ flexDirection: "row", alignItems: "center" }}
          >
            <Box
              component="input"
              type="color"
              value={form.secondaryColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, secondaryColor: e.target.value })
              }
              sx={{
                width: 48,
                height: 48,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                p: 0,
              }}
            />
            <TextField
              value={form.secondaryColor}
              onChange={(e) =>
                setForm({ ...form, secondaryColor: e.target.value })
              }
              fullWidth
            />
          </Stack>
        </Grid>
      </Grid>
      <Alert severity="info">
        Changes apply the next time a page loads for each user (theme is
        cached for the session).
      </Alert>
    </SectionCard>
  );
}
