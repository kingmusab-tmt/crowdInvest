"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Avatar,
  Divider,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CancelIcon from "@mui/icons-material/Cancel";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import { useSession } from "next-auth/react";
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
  type: string;
  ownerName: string;
  ownerEmail: string;
  ownerId?: string;
  community?: string;
  location: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  fullAddress?: string;
  imageUrl?: string;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusChipProps(status: string) {
  if (status === "Approved") {
    return {
      color: "success" as const,
      icon: <CheckCircleIcon fontSize="small" />,
    };
  }
  if (status === "Rejected") {
    return { color: "error" as const, icon: <CancelIcon fontSize="small" /> };
  }
  return {
    color: "warning" as const,
    icon: <HourglassTopIcon fontSize="small" />,
  };
}

export default function BusinessesPage() {
  const { data: session } = useSession();
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Business | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    type: "",
    location: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    status: "Pending",
    fullAddress: "",
  });

  React.useEffect(() => {
    if (session?.user?.role) {
      fetchBusinesses();
    }
  }, [session?.user?.role, session?.user?.community]);

  async function fetchBusinesses() {
    try {
      setLoading(true);

      const res = await fetch("/api/businesses");
      if (!res.ok) throw new Error("Failed to load businesses");
      const data = await res.json();

      console.log("[Admin Businesses] Received businesses:", data.length);
      setBusinesses(data);
    } catch (err) {
      console.error("[Admin Businesses] Error:", err);
      showError("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  }

  const openEdit = (business: Business) => {
    setSelected(business);
    setForm({
      name: business.name,
      type: business.type,
      location: business.location,
      description: business.description,
      contactEmail: business.contactEmail,
      contactPhone: business.contactPhone,
      website: business.website || "",
      status: business.status,
      fullAddress: business.fullAddress || "",
    });
    setEditOpen(true);
  };

  const openView = (business: Business) => {
    setSelected(business);
    setViewOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/businesses/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update business");
      showSuccess("Business updated");
      setEditOpen(false);
      fetchBusinesses();
    } catch (err) {
      showError("Failed to update business");
    }
  };

  const handleDelete = async (id: string) => {
    openConfirmDialog(
      "Delete Business",
      "Delete this business? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/businesses/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete business");
          showSuccess("Business deleted");
          fetchBusinesses();
        } catch (err) {
          showError("Failed to delete business");
        }
      },
    );
  };

  const handleRejectClick = (business: Business) => {
    setSelected(business);
    setRejectionReason("");
    setRejectOpen(true);
    setMenuAnchor(null);
  };

  const handleRejectSubmit = async () => {
    if (!selected || !rejectionReason.trim()) {
      showError("Please provide a rejection reason");
      return;
    }

    try {
      const res = await fetch(`/api/businesses/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          rejectionReason: rejectionReason.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to reject business");
      showSuccess("Business rejected");
      setRejectOpen(false);
      setRejectionReason("");
      fetchBusinesses();
    } catch (err) {
      showError("Failed to reject business");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve business");
      showSuccess("Business approved");
      fetchBusinesses();
    } catch (err) {
      showError("Failed to approve business");
    }
  };

  const filteredRows = businesses.filter((b) => {
    const matchesSearch = [
      b.name,
      b.type,
      b.ownerName,
      b.location,
      b.fullAddress,
    ]
      .filter(Boolean)
      .some(
        (field) => field && field.toLowerCase().includes(search.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "All" ||
      b.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Businesses Management
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search name, category, owner or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
      </Stack>
      <Grid container spacing={2}>
        {filteredRows.map((business) => {
          const { color, icon } = statusChipProps(business.status);
          return (
            <Grid key={business._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {business.imageUrl ? (
                  <CardMedia
                    component="img"
                    image={business.imageUrl}
                    alt={business.name}
                    sx={{ height: 120, objectFit: "contain" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                    }}
                  >
                    <Avatar
                      sx={{ width: 48, height: 48, bgcolor: "primary.main" }}
                    >
                      <StorefrontIcon />
                    </Avatar>
                  </Box>
                )}

                <IconButton
                  size="small"
                  onClick={(e) => {
                    setSelected(business);
                    setMenuAnchor(e.currentTarget);
                  }}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600 }}
                      noWrap
                      title={business.name}
                    >
                      {business.name}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ flexWrap: "wrap", mb: 1 }}
                  >
                    <Chip
                      size="small"
                      label={business.type}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={business.status}
                      color={color}
                      icon={icon}
                    />
                  </Stack>
                  <Stack spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <PersonIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography variant="caption" noWrap>
                        {business.ownerName}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <PlaceIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                      <Typography variant="caption" noWrap>
                        {business.location}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mt: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {business.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredRows.length === 0 && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography color="textSecondary">No businesses found.</Typography>
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (selected) openView(selected);
            setMenuAnchor(null);
          }}
        >
          <VisibilityIcon fontSize="small" style={{ marginRight: 8 }} /> View
          Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selected) openEdit(selected);
            setMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" style={{ marginRight: 8 }} /> Edit
        </MenuItem>
        {selected?.status === "Pending" && (
          <>
            <MenuItem
              onClick={() => {
                if (selected) handleApprove(selected._id);
                setMenuAnchor(null);
              }}
            >
              <CheckCircleIcon
                fontSize="small"
                style={{ marginRight: 8, color: "green" }}
              />{" "}
              Approve
            </MenuItem>
            <MenuItem onClick={() => handleRejectClick(selected!)}>
              <CancelIcon
                fontSize="small"
                style={{ marginRight: 8, color: "red" }}
              />{" "}
              Reject
            </MenuItem>
          </>
        )}
        <MenuItem
          onClick={() => {
            if (selected) handleDelete(selected._id);
            setMenuAnchor(null);
          }}
        >
          <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Business</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Business Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Location (State)</InputLabel>
            <Select
              label="Location (State)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              {NIGERIA_STATES.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Full Business Address"
            value={form.fullAddress}
            onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
            margin="normal"
            placeholder="Street, city, state"
          />
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Contact Email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contact Phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Status
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={form.status}
              onChange={(_, value) =>
                value && setForm({ ...form, status: value })
              }
              fullWidth
              size="small"
            >
              <ToggleButton value="Pending">Pending</ToggleButton>
              <ToggleButton value="Approved">Approved</ToggleButton>
              <ToggleButton value="Rejected">Rejected</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Business Details
          <IconButton
            onClick={() => setViewOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {selected && (
            <>
              {selected.imageUrl ? (
                <CardMedia
                  component="img"
                  image={selected.imageUrl}
                  alt={selected.name}
                  sx={{ height: 160, objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <Avatar
                    sx={{ width: 56, height: 56, bgcolor: "primary.main" }}
                  >
                    <StorefrontIcon />
                  </Avatar>
                </Box>
              )}

              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selected.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={selected.type} variant="outlined" />
                  {(() => {
                    const { color, icon } = statusChipProps(selected.status);
                    return (
                      <Chip
                        size="small"
                        label={selected.status}
                        color={color}
                        icon={icon}
                      />
                    );
                  })()}
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ p: 3 }}>
                {selected.status === "Rejected" && selected.rejectionReason && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <strong>Rejection reason:</strong>{" "}
                    {selected.rejectionReason}
                  </Alert>
                )}

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  Description
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {selected.description}
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <PersonIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                          Owner
                        </Typography>
                        <Typography variant="body2">{selected.ownerName}</Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <PlaceIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                          Location
                        </Typography>
                        <Typography variant="body2">{selected.location}</Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {selected.fullAddress && (
                    <Grid size={12}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                        <HomeWorkIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                            Full Address
                          </Typography>
                          <Typography variant="body2">{selected.fullAddress}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <EmailIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                          Contact Email
                        </Typography>
                        <Typography
                          variant="body2"
                          component="a"
                          href={`mailto:${selected.contactEmail}`}
                          sx={{ color: "primary.main", textDecoration: "none", wordBreak: "break-all" }}
                        >
                          {selected.contactEmail}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <PhoneIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                          Contact Phone
                        </Typography>
                        <Typography
                          variant="body2"
                          component="a"
                          href={`tel:${selected.contactPhone}`}
                          sx={{ color: "primary.main", textDecoration: "none" }}
                        >
                          {selected.contactPhone}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {selected.website && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                        <LanguageIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                            Website
                          </Typography>
                          <Typography
                            variant="body2"
                            component="a"
                            href={selected.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "primary.main", textDecoration: "none", wordBreak: "break-all" }}
                          >
                            {selected.website}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                      <CalendarTodayIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                          Submitted
                        </Typography>
                        <Typography variant="body2">{formatDate(selected.createdAt)}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {selected?.status === "Pending" && (
            <>
              <Button
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => {
                  if (selected) handleRejectClick(selected);
                  setViewOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  if (selected) handleApprove(selected._id);
                  setViewOpen(false);
                }}
              >
                Approve
              </Button>
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Business</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Provide a reason for rejecting this business. The owner will be able
            to see this reason and resubmit after making changes.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
            placeholder="e.g., Missing required documentation, invalid contact information, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
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
    </Container>
  );
}
