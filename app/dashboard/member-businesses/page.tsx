"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
} from "@mui/material";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import { useSession } from "next-auth/react";
import { uploadFileToServer } from "@/utils/uploadHandler";

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
  location: string;
  fullAddress?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  imageUrl?: string;
  ownerId: string;
  ownerName: string;
  status: string;
  createdAt: string;
}

export default function MemberBusinessesPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
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

  React.useEffect(() => {
    fetchBusinesses();
  }, []);

  React.useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
        contactEmail: session.user.email || "",
      }));
    }
  }, [session]);

  async function fetchBusinesses() {
    try {
      const res = await fetch("/api/businesses");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error("Failed to load businesses", err);
    } finally {
      setLoading(false);
    }
  }

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

      // Submit business data
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
      setOpenDialog(false);

      // Refresh businesses list
      fetchBusinesses();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit business"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      .some((field) => field.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || b.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "All" || b.category === categoryFilter;

    const matchesLocation =
      locationFilter === "All" || b.location === locationFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
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
          <Typography variant="body2" color="text.secondary">
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
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
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No businesses yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
          {filtered.map((business) => (
            <Grid item xs={12} sm={6} md={4} key={business._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {business.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={business.imageUrl}
                    alt={business.name}
                    sx={{ objectFit: "cover" }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {business.name}
                  </Typography>
                  <Chip
                    label={business.category}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {business.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    📍 {business.location}
                  </Typography>
                  {business.fullAddress && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      🏠 {business.fullAddress}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    👤 Owner: {business.ownerName}
                  </Typography>
                  <Box sx={{ mt: 1, display: "grid", gap: 0.5 }}>
                    <Typography variant="body2" color="text.primary">
                      Contact Email: {business.contactEmail}
                    </Typography>
                    {business.contactPhone && (
                      <Typography variant="body2" color="text.primary">
                        Contact Phone: {business.contactPhone}
                      </Typography>
                    )}
                    {business.website && (
                      <Typography variant="body2" color="text.primary">
                        Website: {business.website}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Business Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Your Business</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Location (State)</InputLabel>
                <Select
                  label="Location (State)"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Add Business"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
