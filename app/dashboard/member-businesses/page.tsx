"use client";

import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Pagination,
} from "@mui/material";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useSession } from "next-auth/react";
import { uploadFileToServer } from "@/utils/uploadHandler";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

const CATEGORY_OPTIONS = [
  "Technology",
  "Finance",
  "Retail",
  "Food & Beverage",
  "Health",
  "Education",
  "Agriculture",
  "Logistics",
  "Construction",
  "Manufacturing",
  "Services",
  "Creative",
  "Other",
];

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  type?: string;
  location: string;
  fullAddress?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  imageUrl?: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function MemberBusinessesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { snackbar, closeSnackbar, showWarning, showError, showSuccess } =
    useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingBusinessId, setEditingBusinessId] = React.useState<
    string | null
  >(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    category: "",
    location: "",
    fullAddress: "",
    contactEmail: session?.user?.email || "",
    contactPhone: "",
    website: "",
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [locationFilter, setLocationFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);

  const fetchBusinesses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/businesses");
      if (res.ok) {
        const data = await res.json();
        // Filter businesses based on visibility rules:
        // - Show all of user's own businesses (pending, rejected, approved)
        // - Show only approved businesses from other members
        const filteredBusinesses = data.filter((b: Business) => {
          const isOwner =
            b.ownerId === session?.user?.id ||
            b.ownerId?.toString() === session?.user?.id ||
            b.ownerEmail === session?.user?.email;

          // If user is the owner, show all their businesses
          if (isOwner) {
            return true;
          }

          // If not owner, only show approved businesses
          return b.status === "Approved";
        });

        setBusinesses(filteredBusinesses);
      }
    } catch (err) {
      console.error("Failed to load businesses", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  React.useEffect(() => {
    // Wait for the session to resolve before fetching — otherwise
    // session?.user?.id/email are still undefined, the ownership check
    // below can never match, and the user's own Pending/Rejected
    // businesses are wrongly filtered out until a second fetch fires
    // once the session hydrates.
    if (sessionStatus === "loading") return;
    fetchBusinesses();
  }, [sessionStatus, fetchBusinesses]);

  React.useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
        contactEmail: session.user.email || "",
      }));
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (
      !formData.name ||
      !formData.description ||
      !formData.category ||
      !formData.location ||
      !formData.fullAddress
    ) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "";

      // Upload image if provided
      if (imageFile) {
        try {
          const uploadResult = await uploadFileToServer(imageFile);
          imageUrl = uploadResult.link;
        } catch (uploadErr) {
          setSubmitError("Failed to upload image. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // If editing a rejected business, update it; otherwise create new
      if (editingBusinessId) {
        const response = await fetch(`/api/businesses/${editingBusinessId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            ...(imageUrl && { imageUrl }),
            status: "Pending",
            clearRejection: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update business");
        }
      } else {
        // Submit new business data
        const response = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            imageUrl,
            ownerId: session?.user?.id,
            ownerName: session?.user?.name,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit business");
        }
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        category: "",
        location: "",
        fullAddress: "",
        contactEmail: session?.user?.email || "",
        contactPhone: "",
        website: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setEditingBusinessId(null);
      setOpenDialog(false);

      // Refresh businesses list
      fetchBusinesses();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit business",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditRejectedBusiness = (business: Business) => {
    if (business.status !== "Rejected") return;

    setEditingBusinessId(business._id);
    setFormData({
      name: business.name,
      description: business.description,
      category: business.type || business.category,
      location: business.location,
      fullAddress: business.fullAddress || "",
      contactEmail: business.contactEmail,
      contactPhone: business.contactPhone,
      website: business.website || "",
    });
    setImagePreview(business.imageUrl || null);
    setOpenDialog(true);
  };

  const handleDeleteBusiness = async (businessId: string) => {
    openConfirmDialog(
      "Delete Business",
      "Delete this business? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/businesses/${businessId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            showSuccess("Business deleted");
            fetchBusinesses();
          } else {
            setSubmitError("Failed to delete business");
          }
        } catch (err) {
          setSubmitError("Error deleting business");
        }
      },
    );
  };

  const categories = React.useMemo(() => CATEGORY_OPTIONS, []);

  const filtered = businesses.filter((b) => {
    const matchesSearch = [
      b.name,
      b.category,
      b.location,
      b.fullAddress,
      b.ownerName,
      b.description,
    ]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" ||
      b.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "All" || b.category === categoryFilter;

    const matchesLocation =
      locationFilter === "All" || b.location === locationFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  const BUSINESSES_PAGE_SIZE = 4;
  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / BUSINESSES_PAGE_SIZE)
  );

  // Reset to page 1 whenever the filters/search change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, locationFilter]);

  // Clamp page if the filtered list shrinks (e.g. after a delete)
  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedBusinesses = filtered.slice(
    (page - 1) * BUSINESSES_PAGE_SIZE,
    page * BUSINESSES_PAGE_SIZE
  );

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmDialog}
        isLoading={dialog.isLoading}
        confirmButtonText="Delete"
        isDangerous
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Member Businesses
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            Browse community businesses or add your own
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddBusinessIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add My Business
        </Button>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search business name, category, owner, location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Location</InputLabel>
          <Select
            label="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {NIGERIA_STATES.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {businesses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "text.secondary",
            }}
          >
            No businesses yet
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
            }}
          >
            Be the first to add your business to the community!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddBusinessIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add My Business
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pagedBusinesses.map((business) => (
            <Grid
              key={business._id}
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border:
                    business.status === "Rejected" ? "2px solid" : "1px solid",
                  borderColor:
                    business.status === "Rejected" ? "error.main" : "divider",
                  bgcolor:
                    business.status === "Rejected"
                      ? "error.lighter"
                      : "background.paper",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center", minWidth: 0 }}
                    >
                      <Avatar
                        src={business.imageUrl}
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "primary.main",
                          flexShrink: 0,
                        }}
                      >
                        <StorefrontIcon fontSize="small" />
                      </Avatar>
                      <Typography
                        variant="h6"
                        noWrap
                        title={business.name}
                        sx={{ minWidth: 0 }}
                      >
                        {business.name}
                      </Typography>
                    </Stack>
                    {business.status === "Approved" && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "success.main",
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                    {business.status === "Pending" && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "warning.main",
                        }}
                      >
                        <HourglassTopIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                    {business.status === "Rejected" && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "error.main",
                        }}
                      >
                        <CancelIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  </Box>

                  {business.status === "Rejected" &&
                    business.rejectionReason && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", fontWeight: 600, mb: 0.5 }}
                        >
                          Rejection Reason:
                        </Typography>
                        <Typography variant="caption">
                          {business.rejectionReason}
                        </Typography>
                      </Alert>
                    )}

                  <Chip
                    label={business.category || business.type}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 1,
                    }}
                  >
                    {business.description}
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                    {business.fullAddress && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <HomeWorkIcon
                          fontSize="small"
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="caption">
                          {business.fullAddress}
                        </Typography>
                      </Stack>
                    )}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <EmailIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ wordBreak: "break-all" }}
                      >
                        {business.contactEmail}
                      </Typography>
                    </Stack>
                    {business.contactPhone && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <PhoneIcon
                          fontSize="small"
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="caption">
                          {business.contactPhone}
                        </Typography>
                      </Stack>
                    )}
                    {business.website && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <LanguageIcon
                          fontSize="small"
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ wordBreak: "break-all" }}
                        >
                          {business.website}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      justifyContent: "center",
                      mt: 1.5,
                      pt: 1,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <PersonIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {business.ownerName}
                    </Typography>
                  </Stack>
                </CardContent>
                {business.status === "Rejected" &&
                  (business.ownerId === session?.user?.id ||
                    business.ownerId?.toString() === session?.user?.id ||
                    business.ownerEmail === session?.user?.email) && (
                    <CardActions sx={{ gap: 1, px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleEditRejectedBusiness(business)}
                        fullWidth
                      >
                        Edit & Resubmit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteBusiness(business._id)}
                        fullWidth
                      >
                        Delete
                      </Button>
                    </CardActions>
                  )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {filtered.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Business Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditingBusinessId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBusinessId
            ? "Edit & Resubmit Your Business"
            : "Add Your Business"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <TextField
            label="Business Name"
            fullWidth
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter your business name"
            required
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe what your business does"
            required
          />

          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <FormControl fullWidth required>
                <InputLabel>Location (State)</InputLabel>
                <Select
                  label="Location (State)"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                >
                  {NIGERIA_STATES.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            label="Full Business Address"
            fullWidth
            value={formData.fullAddress}
            onChange={(e) => handleInputChange("fullAddress", e.target.value)}
            placeholder="Street, city, state"
            required
          />

          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                label="Contact Email"
                fullWidth
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                required
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6,
              }}
            >
              <TextField
                label="Contact Phone"
                fullWidth
                value={formData.contactPhone}
                onChange={(e) =>
                  handleInputChange("contactPhone", e.target.value)
                }
                placeholder="Phone number"
              />
            </Grid>
          </Grid>

          <TextField
            label="Website (Optional)"
            fullWidth
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            placeholder="https://yourbusiness.com"
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Business Logo/Image
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              {imageFile ? imageFile.name : "Upload Image"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setEditingBusinessId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : editingBusinessId
                ? "Update & Resubmit"
                : "Add Business"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
