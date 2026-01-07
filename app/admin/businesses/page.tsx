"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
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
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSession } from "next-auth/react";

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
}

export default function BusinessesPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

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
      setError(null);

      const isGeneralAdmin = session?.user?.role === "General Admin";
      const query = isGeneralAdmin
        ? ""
        : `?community=${session?.user?.community}`;

      console.log("[Admin Businesses] Fetching with:", {
        role: session?.user?.role,
        community: session?.user?.community,
        query,
        url: `/api/businesses${query}`,
      });

      const res = await fetch(`/api/businesses${query}`);
      if (!res.ok) throw new Error("Failed to load businesses");
      const data = await res.json();

      console.log("[Admin Businesses] Received businesses:", data.length);
      setBusinesses(data);
    } catch (err) {
      console.error("[Admin Businesses] Error:", err);
      setError("Failed to load businesses");
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
      setSuccess("Business updated");
      setEditOpen(false);
      fetchBusinesses();
    } catch (err) {
      setError("Failed to update business");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this business?")) return;
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete business");
      setSuccess("Business deleted");
      fetchBusinesses();
    } catch (err) {
      setError("Failed to delete business");
    }
  };

  const handleRejectClick = (business: Business) => {
    setSelected(business);
    setRejectionReason("");
    setRejectOpen(true);
    setMenuAnchor(null);
  };

  const handleRejectSubmit = async () => {
    if (!selected || !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
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
      setSuccess("Business rejected");
      setRejectOpen(false);
      setRejectionReason("");
      fetchBusinesses();
    } catch (err) {
      setError("Failed to reject business");
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
      setSuccess("Business approved");
      fetchBusinesses();
    } catch (err) {
      setError("Failed to approve business");
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Business Name", width: 220 },
    { field: "type", headerName: "Category", width: 140 },
    { field: "ownerName", headerName: "Owner", width: 180 },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => {
        const status = params.row.status;
        if (status === "Approved") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
              <Typography variant="body2">{status}</Typography>
            </Box>
          );
        } else if (status === "Pending") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <HourglassTopIcon sx={{ fontSize: 18, color: "warning.main" }} />
              <Typography variant="body2">{status}</Typography>
            </Box>
          );
        } else if (status === "Rejected") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CancelIcon sx={{ fontSize: 18, color: "error.main" }} />
              <Typography variant="body2">{status}</Typography>
            </Box>
          );
        }
        return <Typography variant="body2">{status}</Typography>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 140,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={(e) => {
              setSelected(params.row as Business);
              setMenuAnchor(e.currentTarget);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const filteredRows = businesses.filter((b) => {
    const matchesSearch = [
      b.name,
      b.type,
      b.ownerName,
      b.location,
      b.fullAddress,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(search.toLowerCase()));

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
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search name, category, owner or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          fullWidth
          size="small"
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
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          getRowId={(row: Business) => row._id}
        />
      </Paper>

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
        <DialogTitle>Business Details</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 1 }}>
          <Typography variant="subtitle2">Name</Typography>
          <Typography variant="body2">{selected?.name}</Typography>

          <Typography variant="subtitle2">Category</Typography>
          <Typography variant="body2">{selected?.type}</Typography>

          <Typography variant="subtitle2">Owner</Typography>
          <Typography variant="body2">{selected?.ownerName}</Typography>

          <Typography variant="subtitle2">Description</Typography>
          <Typography variant="body2">{selected?.description}</Typography>

          <Typography variant="subtitle2">Location</Typography>
          <Typography variant="body2">{selected?.location}</Typography>

          {selected?.fullAddress && (
            <>
              <Typography variant="subtitle2">Full Address</Typography>
              <Typography variant="body2">{selected?.fullAddress}</Typography>
            </>
          )}

          <Typography variant="subtitle2">Contact Email</Typography>
          <Typography variant="body2">{selected?.contactEmail}</Typography>

          <Typography variant="subtitle2">Contact Phone</Typography>
          <Typography variant="body2">{selected?.contactPhone}</Typography>

          {selected?.website && (
            <>
              <Typography variant="subtitle2">Website</Typography>
              <Typography variant="body2">{selected?.website}</Typography>
            </>
          )}

          <Typography variant="subtitle2">Status</Typography>
          <Typography variant="body2">{selected?.status}</Typography>

          {selected?.rejectionReason && (
            <>
              <Typography variant="subtitle2">Rejection Reason</Typography>
              <Typography variant="body2" sx={{ color: "error.main" }}>
                {selected?.rejectionReason}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
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
    </Container>
  );
}
