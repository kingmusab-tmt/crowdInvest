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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";

const steps = [
  "Select Community",
  "Personal Information",
  "Contact Details",
  "Emergency Contact",
  "Terms & Conditions",
];

interface Community {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  status: string;
}

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    community: "",
    name: session?.user?.name || "",
    dateOfBirth: null as Date | null,
    placeOfWork: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    phoneNumber: "",
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
    fetchCommunities();
  }, [session, router]);

  async function fetchCommunities() {
    try {
      const response = await fetch("/api/communities");
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.filter((c: Community) => c.status === "Active"));
      }
    } catch (err) {
      console.error("Failed to fetch communities", err);
    }
  }

  const handleNext = () => {
    if (activeStep === 0 && !formData.community) {
      setError("Please select a community to continue");
      return;
    }
    if (activeStep === 1) {
      if (!formData.name || !formData.dateOfBirth || !formData.placeOfWork) {
        setError("Please fill in all required fields");
        return;
      }
    }
    if (activeStep === 2) {
      if (
        !formData.phoneNumber ||
        !formData.address.city ||
        !formData.address.country
      ) {
        setError("Please fill in all required fields");
        return;
      }
    }
    if (activeStep === 3) {
      if (!formData.nextOfKin.name || !formData.nextOfKin.phoneNumber) {
        setError("Please provide next of kin details");
        return;
      }
    }
    if (activeStep === 4) {
      if (!formData.termsAccepted || !formData.privacyAccepted) {
        setError("You must accept the terms and conditions and privacy policy");
        return;
      }
      handleSubmit();
      return;
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      setError(
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
              Choose Your Community
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Select the community you would like to join. You can only belong
              to one community at a time.
            </Typography>
            <Grid container spacing={3}>
              {communities.map((community) => (
                <Grid item xs={12} sm={6} md={4} key={community._id}>
                  <Card
                    sx={{
                      border: formData.community === community._id ? 2 : 1,
                      borderColor:
                        formData.community === community._id
                          ? "primary.main"
                          : "divider",
                      position: "relative",
                    }}
                  >
                    <CardActionArea
                      onClick={() =>
                        setFormData({ ...formData, community: community._id })
                      }
                    >
                      <CardContent>
                        {formData.community === community._id && (
                          <CheckCircleIcon
                            color="primary"
                            sx={{ position: "absolute", top: 8, right: 8 }}
                          />
                        )}
                        <GroupsIcon
                          sx={{ fontSize: 40, color: "primary.main", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {community.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {community.description}
                        </Typography>
                        <Chip
                          label={`${community.memberCount} members`}
                          size="small"
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <TextField
                  label="Place of Work/Business *"
                  fullWidth
                  value={formData.placeOfWork}
                  onChange={(e) =>
                    setFormData({ ...formData, placeOfWork: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
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

      case 2:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number *"
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Country *"
                  fullWidth
                  value={formData.address.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Social Media (Optional)
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Facebook Profile URL"
                  fullWidth
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
              <Grid item xs={12} md={6}>
                <TextField
                  label="Twitter Profile URL"
                  fullWidth
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
              <Grid item xs={12} md={6}>
                <TextField
                  label="LinkedIn Profile URL"
                  fullWidth
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
              <Grid item xs={12} md={6}>
                <TextField
                  label="Instagram Profile URL"
                  fullWidth
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

      case 3:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Next of Kin Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide details of your next of kin for emergency purposes.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <TextField
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12}>
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

      case 4:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Terms & Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review and accept our terms and conditions and privacy
              policy to continue.
            </Typography>

            <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
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
                  Allow the platform to process your data for service delivery
                </Typography>
              </Box>
              <Button onClick={() => setTermsOpen(true)} sx={{ mt: 2 }}>
                Read Full Terms & Conditions
              </Button>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
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
                  We will not share your information with third parties without
                  consent
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  You have the right to access, modify, or delete your data
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  We use cookies and analytics to improve user experience
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Communication preferences can be managed in your settings
                </Typography>
              </Box>
              <Button onClick={() => setPrivacyOpen(true)} sx={{ mt: 2 }}>
                Read Full Privacy Policy
              </Button>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAccepted: e.target.checked,
                    })
                  }
                />
              }
              label="I have read and agree to the Terms and Conditions *"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.privacyAccepted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacyAccepted: e.target.checked,
                    })
                  }
                />
              }
              label="I have read and agree to the Privacy Policy *"
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
          <Typography variant="body1" color="text.secondary">
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
          <Typography variant="body2" paragraph>
            <strong>1. Acceptance of Terms</strong>
            <br />
            By accessing and using this platform, you accept and agree to be
            bound by the terms and provision of this agreement.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>2. User Obligations</strong>
            <br />
            Users must provide accurate information, maintain account security,
            and comply with all applicable laws and regulations.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>3. Investment Risks</strong>
            <br />
            All investments carry inherent risks. The platform does not
            guarantee returns and users should invest responsibly.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>4. Platform Usage</strong>
            <br />
            Users agree not to misuse the platform, engage in fraudulent
            activities, or violate community standards.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>5. Termination</strong>
            <br />
            The platform reserves the right to suspend or terminate accounts
            that violate these terms.
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
          <Typography variant="body2" paragraph>
            <strong>1. Data Collection</strong>
            <br />
            We collect personal information necessary for account creation,
            investment management, and service delivery.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>2. Data Usage</strong>
            <br />
            Your data is used to provide services, process transactions,
            communicate updates, and improve user experience.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>3. Data Protection</strong>
            <br />
            We implement industry-standard security measures to protect your
            personal information from unauthorized access.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>4. Data Sharing</strong>
            <br />
            We do not sell your data. Information is only shared with your
            consent or as required by law.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>5. Your Rights</strong>
            <br />
            You have the right to access, update, or delete your personal data
            at any time through your account settings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
