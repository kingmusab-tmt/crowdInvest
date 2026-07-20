"use client";

import * as React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Autocomplete,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { Country, ICountry } from "country-state-city";
import NigeriaStates from "naija-state-local-government";
import { usePlatformSettings } from "@/components/PlatformSettingsContext";

const steps = [
  "Personal Information",
  "Contact Details",
  "Emergency Contact",
  "Terms & Conditions",
];

const ALL_COUNTRIES = Country.getAllCountries();
const NIGERIA_STATES = NigeriaStates.states();
const PHONE_REGEX = /^(0\d{10}|\+234\d{10})$/;
const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Guardian",
  "Relative",
  "Friend",
  "Other",
];

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const { settings: platformSettings } = usePlatformSettings();
  const router = useRouter();
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(
    session?.user?.image || null
  );
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

  const [formData, setFormData] = React.useState({
    profileImageUrl: session?.user?.image || "",
    name: session?.user?.name || "",
    dateOfBirth: null as Date | null,
    placeOfWork: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      postalCode: "",
    },
    phoneNumber: "",
    whatsappNumber: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
    },
    maritalStatus: "",
    nextOfKin: {
      name: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
    },
    termsAccepted: false,
    privacyAccepted: false,
  });

  React.useEffect(() => {
    // If profile is already completed, redirect to dashboard
    if (session?.user && session.user.profileCompleted) {
      router.push("/dashboard");
      return;
    }
  }, [session, router]);

  React.useEffect(() => {
    // Google sign-in resolves the session asynchronously, so backfill the
    // name/avatar once it becomes available instead of only at first render.
    if (!session?.user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || session.user!.name || "",
      profileImageUrl: prev.profileImageUrl || session.user!.image || "",
    }));
  }, [session]);

  const selectedCountry = React.useMemo(
    () =>
      ALL_COUNTRIES.find((c) => c.name === formData.address.country) || null,
    [formData.address.country]
  );
  const isNigeria = formData.address.country === "Nigeria";
  const lgaOptions = React.useMemo(() => {
    if (!isNigeria || !formData.address.state) return [];
    const result = NigeriaStates.lgas(formData.address.state);
    return "lgas" in result ? result.lgas : [];
  }, [isNigeria, formData.address.state]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    closeSnackbar();

    try {
      const formDataFile = new FormData();
      formDataFile.append("file", file);
      formDataFile.append("folder", "profiles");

      // Generate filename from file name and timestamp
      const timestamp = Date.now();
      const filename = `profile-${timestamp}-${file.name}`;

      const response = await fetch(
        `/api/newupload?filename=${encodeURIComponent(filename)}`,
        {
          method: "POST",
          body: formDataFile,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.link || data.url; // API returns 'link' but also support 'url'

      setProfileImage(imageUrl);
      setFormData({ ...formData, profileImageUrl: imageUrl });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.name || !formData.dateOfBirth || !formData.placeOfWork) {
        showError("Please fill in all required fields");
        return;
      }
    }
    if (activeStep === 1) {
      if (!formData.phoneNumber || !PHONE_REGEX.test(formData.phoneNumber)) {
        showError(
          "Please enter a valid phone number (e.g. 08198765432 or +2348198765432)"
        );
        return;
      }
      if (
        !formData.address.country ||
        !formData.address.state ||
        !formData.address.city
      ) {
        showError("Please fill in all required fields");
        return;
      }
    }
    if (activeStep === 2) {
      if (!formData.nextOfKin.name || !formData.nextOfKin.phoneNumber) {
        showError("Please provide next of kin details");
        return;
      }
    }
    if (activeStep === 3) {
      if (!formData.termsAccepted || !formData.privacyAccepted) {
        showError(
          "You must accept the terms and conditions and privacy policy"
        );
        return;
      }
      handleSubmit();
      return;
    }
    closeSnackbar();
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    closeSnackbar();
  };

  const handleSubmit = async () => {
    setLoading(true);
    closeSnackbar();

    try {
      const submissionData = {
        ...formData,
        // Use the uploaded image URL or fall back to Google image
        profileImageUrl: formData.profileImageUrl || session?.user?.image || "",
      };

      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete profile");
      }

      // Refetch the session from the server to get updated profileCompleted status
      // This ensures the JWT token is refreshed with the latest database values
      if (updateSession) {
        await updateSession();
      }

      // Give the session update a moment to propagate before redirecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard after successful profile completion
      router.push("/dashboard");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to complete profile"
      );
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              {/* Profile Image Section */}
              <Grid sx={{ textAlign: "center", mb: 2 }} size={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Profile Photo
                </Typography>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Avatar
                    src={profileImage || session?.user?.image || ""}
                    alt="Profile"
                    sx={{ width: 120, height: 120 }}
                  />
                </Box>
                {session?.user?.image && !profileImage && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      mb: 1
                    }}>
                    Using your Google account image
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "Uploading..." : "Upload New Photo"}
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleImageUpload}
                  />
                </Button>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth *"
                    value={formData.dateOfBirth}
                    onChange={(date) =>
                      setFormData({ ...formData, dateOfBirth: date })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Place of Work/Business *"
                  fullWidth
                  value={formData.placeOfWork}
                  onChange={(e) =>
                    setFormData({ ...formData, placeOfWork: e.target.value })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  select
                  label="Marital Status"
                  fullWidth
                  value={formData.maritalStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, maritalStatus: e.target.value })
                  }
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Divorced">Divorced</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                  <MenuItem value="Prefer not to say">
                    Prefer not to say
                  </MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Details
            </Typography>
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  error={
                    formData.phoneNumber !== "" &&
                    !PHONE_REGEX.test(formData.phoneNumber)
                  }
                  helperText="e.g. 08198765432 or +2348198765432"
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="WhatsApp Number"
                  fullWidth
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                  placeholder="e.g. 08198765432 or +2348198765432"
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Street Address"
                  fullWidth
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Autocomplete
                  options={ALL_COUNTRIES}
                  getOptionLabel={(option: ICountry) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.isoCode === value.isoCode
                  }
                  value={selectedCountry}
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        country: newValue?.name || "",
                        state: "",
                        city: "",
                      },
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Country *" fullWidth />
                  )}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                {isNigeria ? (
                  <TextField
                    select
                    label="State *"
                    fullWidth
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          state: e.target.value,
                          city: "",
                        },
                      })
                    }
                  >
                    {NIGERIA_STATES.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label="State/Province"
                    fullWidth
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                  />
                )}
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                {isNigeria ? (
                  <TextField
                    select
                    label="LGA *"
                    fullWidth
                    disabled={!formData.address.state}
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  >
                    {lgaOptions.map((lga) => (
                      <MenuItem key={lga} value={lga}>
                        {lga}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label="City *"
                    fullWidth
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  />
                )}
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Postal Code"
                  fullWidth
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        postalCode: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Social Media (Optional)
                </Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Facebook Profile URL"
                  fullWidth
                  placeholder="https://facebook.com/yourusername"
                  value={formData.socialMedia.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        facebook: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="X (Twitter) Profile URL"
                  fullWidth
                  placeholder="https://x.com/yourusername"
                  value={formData.socialMedia.twitter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        twitter: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="LinkedIn Profile URL"
                  fullWidth
                  placeholder="https://linkedin.com/in/yourusername"
                  value={formData.socialMedia.linkedin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        linkedin: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Instagram Profile URL"
                  fullWidth
                  placeholder="https://instagram.com/yourusername"
                  value={formData.socialMedia.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialMedia: {
                        ...formData.socialMedia,
                        instagram: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Next of Kin Information
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3
              }}>
              Provide details of your next of kin for emergency purposes.
            </Typography>
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  value={formData.nextOfKin.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextOfKin: {
                        ...formData.nextOfKin,
                        name: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  select
                  label="Relationship *"
                  fullWidth
                  value={formData.nextOfKin.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextOfKin: {
                        ...formData.nextOfKin,
                        relationship: e.target.value,
                      },
                    })
                  }
                >
                  {RELATIONSHIP_OPTIONS.map((relationship) => (
                    <MenuItem key={relationship} value={relationship}>
                      {relationship}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  value={formData.nextOfKin.phoneNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextOfKin: {
                        ...formData.nextOfKin,
                        phoneNumber: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <TextField
                  label="Email Address"
                  fullWidth
                  type="email"
                  value={formData.nextOfKin.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextOfKin: {
                        ...formData.nextOfKin,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.nextOfKin.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextOfKin: {
                        ...formData.nextOfKin,
                        address: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Terms & Conditions
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3
              }}>
              Please review and accept our terms and conditions and privacy
              policy to continue.
            </Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Terms and Conditions Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    By using this platform, you agree to:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Provide accurate and truthful information
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Comply with all platform rules and community guidelines
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Not engage in fraudulent activities or misuse of funds
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Accept that investment carries risks and there are no
                      guaranteed returns
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Allow the platform to process your data for service
                      delivery
                    </Typography>
                  </Box>
                  <Button onClick={() => setTermsOpen(true)} sx={{ mt: 2 }}>
                    Read Full Terms & Conditions
                  </Button>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Privacy Policy Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    We are committed to protecting your privacy:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Your personal data is encrypted and securely stored
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      We will not share your information with third parties
                      without consent
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      You have the right to access, modify, or delete your data
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      We use cookies and analytics to improve user experience
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Communication preferences can be managed in your
                      settings
                    </Typography>
                  </Box>
                  <Button onClick={() => setPrivacyOpen(true)} sx={{ mt: 2 }}>
                    Read Full Privacy Policy
                  </Button>
                </Paper>
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.termsAccepted && formData.privacyAccepted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAccepted: e.target.checked,
                      privacyAccepted: e.target.checked,
                    })
                  }
                />
              }
              label="I have read and agree to the Terms and Conditions and Privacy Policy *"
            />
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome to CrowdInvest!
          </Typography>
          <Typography variant="body1" sx={{
            color: "text.secondary"
          }}>
            Complete your profile to get started
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>{getStepContent(activeStep)}</Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              "Complete Profile"
            ) : (
              "Next"
            )}
          </Button>
        </Box>
      </Paper>
      {/* Terms Dialog */}
      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Terms and Conditions</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-line" }}
          >
            {platformSettings.legal.termsAndConditions}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Privacy Dialog */}
      <Dialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-line" }}
          >
            {platformSettings.legal.privacyPolicy}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Container>
  );
}
