"use client";

import * as React from "react";
import {
  Container,
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
} from "@mui/material";
import { useSession } from "next-auth/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
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
  };
  settings?: {
    notifications: {
      inApp: boolean;
      email: boolean;
      emailPreferences: {
        announcements: boolean;
        investments: boolean;
        withdrawals: boolean;
        kyc: boolean;
        proposals: boolean;
        events: boolean;
      };
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = React.useState(0);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    dateOfBirth: "",
    phoneNumber: "",
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
    nextOfKin: {
      name: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
    },
    avatarFile: null as File | null,
  });
  const [notificationSettings, setNotificationSettings] = React.useState({
    inApp: true,
    email: true,
    emailPreferences: {
      announcements: true,
      investments: true,
      withdrawals: true,
      kyc: true,
      proposals: true,
      events: true,
    },
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

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
          dateOfBirth: data.dateOfBirth || "",
          phoneNumber: data.phoneNumber || "",
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
          nextOfKin: data.nextOfKin || {
            name: "",
            relationship: "",
            phoneNumber: "",
            email: "",
            address: "",
          },
          avatarFile: null,
        });
        setNotificationSettings(
          data.settings?.notifications || {
            inApp: true,
            email: true,
            emailPreferences: {
              announcements: true,
              investments: true,
              withdrawals: true,
              kyc: true,
              proposals: true,
              events: true,
            },
          }
        );
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("dateOfBirth", formData.dateOfBirth);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("placeOfWork", formData.placeOfWork);
      submitData.append("maritalStatus", formData.maritalStatus);
      submitData.append("address", JSON.stringify(formData.address));
      submitData.append("socialMedia", JSON.stringify(formData.socialMedia));
      submitData.append("nextOfKin", JSON.stringify(formData.nextOfKin));
      if (formData.avatarFile) {
        submitData.append("avatar", formData.avatarFile);
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        body: submitData,
      });

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setUpdateDialogOpen(false);
        setTimeout(() => {
          setSuccess(null);
          fetchProfile();
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: notificationSettings }),
      });

      if (res.ok) {
        setSuccess("Notification preferences updated successfully!");
        setTimeout(() => {
          setSuccess(null);
          fetchProfile();
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update settings");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const getKYCStatus = () => {
    if (!profile?.kyc)
      return {
        status: "pending",
        label: "Not Submitted",
        icon: <PendingActionsIcon />,
      };
    if (profile.kyc.isVerified) {
      return {
        status: "verified",
        label: "Verified",
        icon: <CheckCircleIcon />,
      };
    } else if (profile.kyc.rejectionReason) {
      return {
        status: "rejected",
        label: "Rejected",
        icon: <HighlightOffIcon />,
      };
    }
    return {
      status: "pending",
      label: "Pending Review",
      icon: <PendingActionsIcon />,
    };
  };

  const kycStatus = getKYCStatus();

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile and verification details.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="settings tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Profile" {...a11yProps(0)} />
          <Tab label="KYC Verification" {...a11yProps(1)} />
          <Tab label="Notifications" {...a11yProps(2)} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Profile Information
            </Typography>

            {profile && (
              <Stack spacing={3}>
                {/* Profile Avatar */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={profile.avatarUrl}
                    sx={{ width: 100, height: 100 }}
                  >
                    {profile.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Profile Picture
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profile.avatarUrl ? "Uploaded" : "Not uploaded"}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Full Name
                  </Typography>
                  <Typography variant="body2">{profile.name}</Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Email Address
                  </Typography>
                  <Typography variant="body2">{profile.email}</Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Date of Birth
                  </Typography>
                  <Typography variant="body2">
                    {profile.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Phone Number
                  </Typography>
                  <Typography variant="body2">
                    {profile.phoneNumber || "Not provided"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Marital Status
                  </Typography>
                  <Typography variant="body2">
                    {profile.maritalStatus || "Not provided"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Place of Work
                  </Typography>
                  <Typography variant="body2">
                    {profile.placeOfWork || "Not provided"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Address
                  </Typography>
                  <Typography variant="body2">
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

                <Button
                  variant="contained"
                  onClick={() => setUpdateDialogOpen(true)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Update Profile
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              KYC Verification Status
            </Typography>

            {profile && (
              <Stack spacing={3}>
                {/* Status Card */}
                <Card
                  sx={{
                    bgcolor:
                      kycStatus.status === "verified"
                        ? "#e8f5e9"
                        : kycStatus.status === "rejected"
                        ? "#ffebee"
                        : "#fff3e0",
                    borderLeft:
                      kycStatus.status === "verified"
                        ? "4px solid #2e7d32"
                        : kycStatus.status === "rejected"
                        ? "4px solid #c62828"
                        : "4px solid #e65100",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          color:
                            kycStatus.status === "verified"
                              ? "#2e7d32"
                              : kycStatus.status === "rejected"
                              ? "#c62828"
                              : "#e65100",
                        }}
                      >
                        {kycStatus.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {kycStatus.label}
                        </Typography>
                        {profile.kyc?.verifiedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Verified on{" "}
                            {new Date(
                              profile.kyc.verifiedAt
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                        {profile.kyc?.rejectionDate && (
                          <Typography variant="caption" color="text.secondary">
                            Rejected on{" "}
                            {new Date(
                              profile.kyc.rejectionDate
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Rejection Reason */}
                {kycStatus.status === "rejected" &&
                  profile.kyc?.rejectionReason && (
                    <Alert severity="error">
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Reason for Rejection:
                      </Typography>
                      <Typography variant="body2">
                        {profile.kyc.rejectionReason}
                      </Typography>
                    </Alert>
                  )}

                <Divider />

                <Typography variant="body2" color="text.secondary">
                  {kycStatus.status === "verified"
                    ? "Your KYC verification is complete. You have full access to all community features."
                    : kycStatus.status === "rejected"
                    ? "Your KYC verification was rejected. Please review the reason above and update your information."
                    : "Your KYC verification is pending. An administrator will review your information shortly."}
                </Typography>

                {kycStatus.status === "rejected" && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setTab(0);
                      setUpdateDialogOpen(true);
                    }}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Update Information & Resubmit
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        )}

        {tab === 2 && (
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
                          <Typography variant="caption" color="text.secondary">
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
                          <Typography variant="caption" color="text.secondary">
                            Receive notifications via email
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Box>

                <Divider />

                {/* Email Notification Preferences */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Email Notification Types
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Choose which types of notifications you want to receive via
                    email
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailPreferences.kyc}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                kyc: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="KYC Verification Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            notificationSettings.emailPreferences.investments
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                investments: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="Investment Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            notificationSettings.emailPreferences.withdrawals
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                withdrawals: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="Withdrawal Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            notificationSettings.emailPreferences.proposals
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                proposals: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="Proposal Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailPreferences.events}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                events: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="Event Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            notificationSettings.emailPreferences.announcements
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              emailPreferences: {
                                ...notificationSettings.emailPreferences,
                                announcements: e.target.checked,
                              },
                            })
                          }
                          disabled={!notificationSettings.email}
                        />
                      }
                      label="Announcements"
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
      </Paper>

      {/* Update Profile Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
              InputLabelProps={{ shrink: true }}
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
    </Container>
  );
}
