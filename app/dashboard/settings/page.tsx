"use client";

import * as React from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormGroup,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useThemeRefresh } from "@/components/ThemeContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  placeOfWork?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  maritalStatus?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    accountDetails?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };
  };
  personalAccountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  settings?: {
    theme?: "light" | "dark" | "system";
    profileVisibility?: "public" | "private";
    notifications: {
      inApp: boolean;
      email: boolean;
      push: boolean;
    };
  };
  kyc?: {
    isVerified: boolean;
    submittedAt?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    rejectionDate?: string;
  };
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  };
}

const normalizeNotificationSettings = (data: any) => {
  return {
    inApp: Boolean(data?.inApp ?? true),
    email: Boolean(data?.email ?? true),
    push: Boolean(data?.push ?? true),
  };
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { refreshTheme } = useThemeRefresh();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showInfo,
  } = useSnackbar();
  const [tab, setTab] = React.useState(0);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] =
    React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    dateOfBirth: "",
    phoneNumber: "",
    whatsappNumber: "",
    placeOfWork: "",
    maritalStatus: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
    },
    personalAccountDetails: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
    nextOfKin: {
      name: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
      accountDetails: {
        bankName: "",
        accountNumber: "",
        accountName: "",
      },
    },
    avatarFile: null as File | null,
  });
  const defaultNotificationSettings = normalizeNotificationSettings({});

  const [notificationSettings, setNotificationSettings] = React.useState(
    defaultNotificationSettings
  );
  const [themePreference, setThemePreference] = React.useState<
    "light" | "dark" | "system"
  >("system");
  const [profileVisibility, setProfileVisibility] = React.useState<
    "public" | "private"
  >("public");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth).toISOString().split("T")[0]
            : "",
          phoneNumber: data.phoneNumber || "",
          whatsappNumber: data.whatsappNumber || "",
          placeOfWork: data.placeOfWork || "",
          maritalStatus: data.maritalStatus || "",
          address: data.address || {
            street: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
          },
          socialMedia: data.socialMedia || {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
          },
          personalAccountDetails: data.personalAccountDetails || {
            bankName: "",
            accountNumber: "",
            accountName: "",
          },
          nextOfKin: data.nextOfKin || {
            name: "",
            relationship: "",
            phoneNumber: "",
            email: "",
            address: "",
            accountDetails: {
              bankName: "",
              accountNumber: "",
              accountName: "",
            },
          },
          avatarFile: null,
        });
        setNotificationSettings(
          normalizeNotificationSettings(data.settings?.notifications)
        );
        setThemePreference(data.settings?.theme || "system");
        setProfileVisibility(data.settings?.profileVisibility || "public");
      } else {
        showError("Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("dateOfBirth", formData.dateOfBirth);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("whatsappNumber", formData.whatsappNumber);
      submitData.append("placeOfWork", formData.placeOfWork);
      submitData.append("maritalStatus", formData.maritalStatus);
      submitData.append("address", JSON.stringify(formData.address));
      submitData.append("socialMedia", JSON.stringify(formData.socialMedia));
      submitData.append(
        "personalAccountDetails",
        JSON.stringify(formData.personalAccountDetails)
      );
      submitData.append("nextOfKin", JSON.stringify(formData.nextOfKin));
      if (formData.avatarFile) {
        submitData.append("avatar", formData.avatarFile);
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        body: submitData,
      });

      if (res.ok) {
        showSuccess("Profile updated successfully!");
        setUpdateDialogOpen(false);
        setTimeout(() => {
          fetchProfile();
        }, 2000);
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: notificationSettings }),
      });

      if (res.ok) {
        showSuccess("Notification preferences updated successfully!");

        // Refresh the session so the push notification gate picks up the change immediately
        if (updateSession) {
          await updateSession();
        }

        setTimeout(() => {
          fetchProfile();
        }, 2000);
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to update settings");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themePreference,
          profileVisibility: profileVisibility,
        }),
      });

      if (res.ok) {
        showSuccess("Privacy settings updated successfully!");

        // Update the session to reflect theme changes immediately
        if (updateSession) {
          await updateSession();
        }

        // Trigger theme refresh in ThemeRegistry
        refreshTheme();

        setTimeout(() => {
          fetchProfile();
        }, 2000);
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to update settings");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const res = await fetch("/api/users/export-data");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crowdinvest-data-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess("Data downloaded successfully!");
      } else {
        showError("Failed to download data");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to download data");
    }
  };

  const handleRequestAccountDeletion = async () => {
    setDeletingAccount(true);

    try {
      const res = await fetch("/api/users/delete-account", {
        method: "POST",
      });

      if (res.ok) {
        setDeleteAccountDialogOpen(false);
        showSuccess(
          "Account deletion request submitted. An administrator will review your request."
        );
      } else {
        const errorData = await res.json();
        showError(errorData.error || "Failed to submit deletion request");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to submit request"
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 600, mb: 2, fontSize: { xs: "1.5rem", sm: "2rem" } }}
      >
        Settings
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 4
        }}>
        Manage your profile and verification details.
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="settings tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Profile" {...a11yProps(0)} />
          <Tab label="Notifications" {...a11yProps(1)} />
          <Tab label="Privacy & Appearance" {...a11yProps(2)} />
          <Tab label="Data & Privacy" {...a11yProps(3)} />
        </Tabs>

        {tab === 0 && (
          <Box>
            {profile && (
              <Stack spacing={4}>
                {/* Profile Header Card */}
                <Card sx={{ bgcolor: "background.paper" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "center", sm: "flex-start" },
                        gap: 3,
                      }}
                    >
                      <Avatar
                        src={profile.avatarUrl}
                        alt={profile.name}
                        sx={{
                          width: 120,
                          height: 120,
                          border: "4px solid",
                          borderColor: "primary.main",
                          boxShadow: 3,
                        }}
                      >
                        {profile.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: { xs: "center", sm: "left" },
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {profile.name}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: "text.secondary",
                            mb: 2
                          }}>
                          {profile.email}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            justifyContent: { xs: "center", sm: "flex-start" },
                          }}
                        >
                          {profile.kyc?.isVerified && (
                            <Chip
                              label="KYC Verified"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                          <Chip
                            label={
                              profile.settings?.profileVisibility === "private"
                                ? "Private"
                                : "Public"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setUpdateDialogOpen(true)}
                        sx={{ minWidth: 120 }}
                      >
                        Edit Profile
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Personal Information Card */}
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Personal Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            Full Name
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            Date of Birth
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.dateOfBirth
                              ? new Date(
                                  profile.dateOfBirth
                                ).toLocaleDateString()
                              : "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            Phone Number
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.phoneNumber || "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            WhatsApp Number
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.whatsappNumber || "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            Marital Status
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.maritalStatus || "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6
                        }}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5
                            }}>
                            Place of Work
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {profile.placeOfWork || "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid size={12}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              mb: 1,
                              display: "block"
                            }}>
                            Address
                          </Typography>
                          <Typography variant="body1">
                            {profile.address &&
                            (profile.address.street ||
                              profile.address.city ||
                              profile.address.state ||
                              profile.address.country)
                              ? `${profile.address.street || ""}, ${
                                  profile.address.city || ""
                                }, ${profile.address.state || ""}, ${
                                  profile.address.country || ""
                                } ${profile.address.postalCode || ""}`
                                  .replace(/,\s*,/g, ",")
                                  .trim()
                              : "Not provided"}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Social Media Card */}
                {profile.socialMedia && (
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Social Media Links
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                minWidth: 80
                              }}>
                              Facebook:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {profile.socialMedia.facebook || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                minWidth: 80
                              }}>
                              Twitter:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {profile.socialMedia.twitter || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                minWidth: 80
                              }}>
                              LinkedIn:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {profile.socialMedia.linkedin || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                minWidth: 80
                              }}>
                              Instagram:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {profile.socialMedia.instagram || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Personal Account Details Card */}
                {profile.personalAccountDetails &&
                  (profile.personalAccountDetails.bankName ||
                    profile.personalAccountDetails.accountNumber ||
                    profile.personalAccountDetails.accountName) && (
                    <Card>
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ mb: 3, fontWeight: 600 }}
                        >
                          Personal Account Details
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Bank Name
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {profile.personalAccountDetails.bankName ||
                                  "Not provided"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Account Number
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {profile.personalAccountDetails
                                  .accountNumber || "Not provided"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Account Name
                              </Typography>
                              <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {profile.personalAccountDetails.accountName ||
                                  "Not provided"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                {/* Next of Kin Card */}
                {profile.nextOfKin && (
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Next of Kin Information
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                              }}>
                              Name
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {profile.nextOfKin.name || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                              }}>
                              Relationship
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {profile.nextOfKin.relationship || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                              }}>
                              Phone Number
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {profile.nextOfKin.phoneNumber || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            sm: 6
                          }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                              }}>
                              Email
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {profile.nextOfKin.email || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={12}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                mb: 1,
                                display: "block"
                              }}>
                              Address
                            </Typography>
                            <Typography variant="body1">
                              {profile.nextOfKin.address || "Not provided"}
                            </Typography>
                          </Box>
                        </Grid>
                        {profile.nextOfKin.accountDetails &&
                          (profile.nextOfKin.accountDetails.bankName ||
                            profile.nextOfKin.accountDetails.accountNumber ||
                            profile.nextOfKin.accountDetails.accountName) && (
                            <>
                              <Grid size={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mb: 1 }}
                                >
                                  Bank Account Details
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Bank Name
                                  </Typography>
                                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {profile.nextOfKin.accountDetails
                                      .bankName || "Not provided"}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Account Number
                                  </Typography>
                                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {profile.nextOfKin.accountDetails
                                      .accountNumber || "Not provided"}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    Account Name
                                  </Typography>
                                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {profile.nextOfKin.accountDetails
                                      .accountName || "Not provided"}
                                  </Typography>
                                </Box>
                              </Grid>
                            </>
                          )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Notification Preferences
            </Typography>

            {profile && (
              <Stack spacing={4}>
                {/* General Notification Settings */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Notification Channels
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.inApp}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              inApp: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            In-App Notifications
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            Receive notifications within the dashboard
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.email}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            Email Notifications
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            Receive all notification updates via email
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.push}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              push: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            Push Notifications
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: "text.secondary"
                          }}>
                            Receive push notifications on this device
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleSaveNotificationSettings}
                  disabled={saving}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {saving ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Save Notification Preferences"
                  )}
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Privacy & Appearance Settings
            </Typography>

            {profile && (
              <Stack spacing={4}>
                {/* Theme Settings */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Theme Preference
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 2
                    }}>
                    Choose your preferred theme for the dashboard
                  </Typography>
                  <ToggleButtonGroup
                    value={themePreference}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) setThemePreference(newValue);
                    }}
                    color="primary"
                  >
                    <ToggleButton value="light">
                      <LightModeIcon sx={{ mr: 1 }} fontSize="small" />
                      Light
                    </ToggleButton>
                    <ToggleButton value="dark">
                      <DarkModeIcon sx={{ mr: 1 }} fontSize="small" />
                      Dark
                    </ToggleButton>
                    <ToggleButton value="system">
                      <SettingsBrightnessIcon sx={{ mr: 1 }} fontSize="small" />
                      System Default
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Divider />

                {/* Profile Visibility Settings */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Profile Visibility
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 2
                    }}>
                    Control whether your profile appears in the community
                    members directory
                  </Typography>
                  <ToggleButtonGroup
                    value={profileVisibility}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) setProfileVisibility(newValue);
                    }}
                    color="primary"
                  >
                    <ToggleButton value="public">
                      <PublicIcon sx={{ mr: 1 }} fontSize="small" />
                      Public
                    </ToggleButton>
                    <ToggleButton value="private">
                      <LockIcon sx={{ mr: 1 }} fontSize="small" />
                      Private
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      mt: 1,
                      display: "block"
                    }}>
                    {profileVisibility === "private"
                      ? "Your profile is hidden from the members directory."
                      : "Your profile is visible to other members in the directory."}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleSavePrivacySettings}
                  disabled={saving}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {saving ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Save Privacy Settings"
                  )}
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Data & Privacy Management
            </Typography>

            {profile && (
              <Stack spacing={3}>
                {/* Download Data */}
                <Card>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Download Your Data
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2
                      }}>
                      Download a copy of all your personal data, including
                      profile information, investments, transactions, and
                      activity history.
                    </Typography>
                    <Button variant="outlined" onClick={handleDownloadData}>
                      Download Data
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Management */}
                <Card>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Account Deletion
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2
                      }}>
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteAccountDialogOpen(true)}
                    >
                      Request Account Deletion
                    </Button>
                  </CardContent>
                </Card>

                <Divider />

                {/* Privacy Policy & Terms */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Legal Documents
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Privacy Policy
                      </Typography>
                      <Typography variant="caption" sx={{
                        color: "text.secondary"
                      }}>
                        Last accepted:{" "}
                        {profile.privacyAccepted
                          ? new Date().toLocaleDateString()
                          : "Not accepted"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Terms of Service
                      </Typography>
                      <Typography variant="caption" sx={{
                        color: "text.secondary"
                      }}>
                        Last accepted:{" "}
                        {profile.termsAccepted
                          ? new Date().toLocaleDateString()
                          : "Not accepted"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        )}
      </Paper>
      {/* Update Profile Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Update Profile Information
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, maxHeight: "70vh", overflow: "auto" }}>
          <Stack spacing={2}>
            {/* Profile Picture Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Profile Picture
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={
                    formData.avatarFile
                      ? URL.createObjectURL(formData.avatarFile)
                      : profile?.avatarUrl
                  }
                  sx={{ width: 80, height: 80 }}
                >
                  {profile?.name?.charAt(0)}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="avatar-input"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFormData({
                        ...formData,
                        avatarFile: e.target.files[0],
                      });
                    }
                  }}
                />
                <label htmlFor="avatar-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                  >
                    Change Photo
                  </Button>
                </label>
              </Box>
            </Box>

            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
              fullWidth
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="WhatsApp Number"
              value={formData.whatsappNumber}
              onChange={(e) =>
                setFormData({ ...formData, whatsappNumber: e.target.value })
              }
              fullWidth
              placeholder="Enter your WhatsApp number"
            />
            <TextField
              label="Place of Work"
              value={formData.placeOfWork}
              onChange={(e) =>
                setFormData({ ...formData, placeOfWork: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Street Address"
              value={formData.address?.street || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="City"
              value={formData.address?.city || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="State/Province"
              value={formData.address?.state || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Country"
              value={formData.address?.country || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Postal Code"
              value={formData.address?.postalCode || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, postalCode: e.target.value },
                })
              }
              fullWidth
            />

            <TextField
              select
              label="Marital Status"
              value={formData.maritalStatus}
              onChange={(e) =>
                setFormData({ ...formData, maritalStatus: e.target.value })
              }
              fullWidth
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </TextField>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              Social Media
            </Typography>
            <TextField
              label="Facebook"
              value={formData.socialMedia?.facebook || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialMedia: {
                    ...formData.socialMedia,
                    facebook: e.target.value,
                  },
                })
              }
              fullWidth
              placeholder="Facebook URL"
            />
            <TextField
              label="Twitter"
              value={formData.socialMedia?.twitter || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialMedia: {
                    ...formData.socialMedia,
                    twitter: e.target.value,
                  },
                })
              }
              fullWidth
              placeholder="Twitter URL"
            />
            <TextField
              label="LinkedIn"
              value={formData.socialMedia?.linkedin || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialMedia: {
                    ...formData.socialMedia,
                    linkedin: e.target.value,
                  },
                })
              }
              fullWidth
              placeholder="LinkedIn URL"
            />
            <TextField
              label="Instagram"
              value={formData.socialMedia?.instagram || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialMedia: {
                    ...formData.socialMedia,
                    instagram: e.target.value,
                  },
                })
              }
              fullWidth
              placeholder="Instagram URL"
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              Personal Account Details
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mb: 2
              }}>
              Bank account information for withdrawals
            </Typography>
            <TextField
              label="Bank Name"
              value={formData.personalAccountDetails?.bankName || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personalAccountDetails: {
                    ...formData.personalAccountDetails,
                    bankName: e.target.value,
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Account Number"
              value={formData.personalAccountDetails?.accountNumber || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personalAccountDetails: {
                    ...formData.personalAccountDetails,
                    accountNumber: e.target.value,
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Account Name"
              value={formData.personalAccountDetails?.accountName || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personalAccountDetails: {
                    ...formData.personalAccountDetails,
                    accountName: e.target.value,
                  },
                })
              }
              fullWidth
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              Next of Kin
            </Typography>
            <TextField
              label="Name"
              value={formData.nextOfKin?.name || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: { ...formData.nextOfKin, name: e.target.value },
                })
              }
              fullWidth
            />
            <TextField
              label="Relationship"
              value={formData.nextOfKin?.relationship || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: {
                    ...formData.nextOfKin,
                    relationship: e.target.value,
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={formData.nextOfKin?.phoneNumber || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: {
                    ...formData.nextOfKin,
                    phoneNumber: e.target.value,
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.nextOfKin?.email || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: { ...formData.nextOfKin, email: e.target.value },
                })
              }
              fullWidth
              type="email"
            />
            <TextField
              label="Address"
              value={formData.nextOfKin?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: { ...formData.nextOfKin, address: e.target.value },
                })
              }
              fullWidth
              multiline
              rows={2}
            />

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 2
              }}>
              Next of Kin Bank Account Details (Optional)
            </Typography>
            <TextField
              label="Bank Name"
              value={formData.nextOfKin?.accountDetails?.bankName || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: {
                    ...formData.nextOfKin,
                    accountDetails: {
                      ...formData.nextOfKin?.accountDetails,
                      bankName: e.target.value,
                    },
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Account Number"
              value={formData.nextOfKin?.accountDetails?.accountNumber || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: {
                    ...formData.nextOfKin,
                    accountDetails: {
                      ...formData.nextOfKin?.accountDetails,
                      accountNumber: e.target.value,
                    },
                  },
                })
              }
              fullWidth
            />
            <TextField
              label="Account Name"
              value={formData.nextOfKin?.accountDetails?.accountName || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nextOfKin: {
                    ...formData.nextOfKin,
                    accountDetails: {
                      ...formData.nextOfKin?.accountDetails,
                      accountName: e.target.value,
                    },
                  },
                })
              }
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={() => {
          if (!deletingAccount) setDeleteAccountDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Delete Your Account?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. Once processed, your account and
            all associated data will be permanently deleted.
          </Alert>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to request deletion of your account? An
            administrator will review and process your request.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteAccountDialogOpen(false)}
            disabled={deletingAccount}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestAccountDeletion}
            variant="contained"
            color="error"
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <CircularProgress size={24} />
            ) : (
              "Yes, Delete My Account"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
