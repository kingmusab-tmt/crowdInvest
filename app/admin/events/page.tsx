"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Stack,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";

interface IEvent {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  eventDate: string;
  location: string;
  createdBy: { _id: string; name: string; email: string };
  community: { _id: string; name: string };
  rsvp: {
    attending: any[];
    maybe: any[];
    notAttending: any[];
  };
  status: string;
  imageUrl?: string;
  notificationsSent?: any[];
  createdAt: string;
}

interface ICurrentUser {
  _id: string;
  name: string;
  email: string;
  role: "User" | "Community Admin" | "General Admin";
  community?: string;
}

export default function AdminEventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = React.useState<IEvent[]>([]);
  const [currentUser, setCurrentUser] = React.useState<ICurrentUser | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<IEvent | null>(null);
  const [viewingEvent, setViewingEvent] = React.useState<IEvent | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    longDescription: "",
    eventDate: "",
    location: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  }

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to load events", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!form.title || !form.eventDate || !form.location) {
      setError("Please fill in the required fields: Title, Date, and Location");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const payload = editingEvent
        ? {
            eventId: editingEvent._id,
            ...form,
          }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit event");
      }

      setForm({
        title: "",
        description: "",
        longDescription: "",
        eventDate: "",
        location: "",
      });
      setEditingEvent(null);
      setOpen(false);
      setSuccess(
        editingEvent
          ? "Event updated successfully!"
          : "Event created successfully!"
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit event");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      setSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  function handleEdit(event: IEvent) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      longDescription: event.longDescription || "",
      eventDate: event.eventDate.split("T")[0],
      location: event.location,
    });
    setOpen(true);
  }

  function handleView(event: IEvent) {
    setViewingEvent(event);
    setViewOpen(true);
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canManage = (event: IEvent) => {
    if (!currentUser) return false;

    // General Admin can manage all events
    if (currentUser.role === "General Admin") return true;

    // Community Admin can manage events in their community
    if (
      currentUser.role === "Community Admin" &&
      event.community._id === currentUser.community
    ) {
      return true;
    }

    return false;
  };

  const getDaysRemaining = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const days = Math.ceil(
      (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Event Title",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "community",
      headerName: "Community",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.community?.name || "N/A"}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: "eventDate",
      headerName: "Event Date",
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const days = getDaysRemaining(params.row.eventDate);
        return (
          <Box>
            <Typography variant="body2">
              {new Date(params.row.eventDate).toLocaleDateString()}
            </Typography>
            <Typography
              variant="caption"
              color={
                days <= 3
                  ? "error"
                  : days <= 7
                  ? "warning.main"
                  : "text.secondary"
              }
            >
              {days < 0 ? "Passed" : days === 0 ? "Today" : `${days}d away`}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "location",
      headerName: "Location",
      width: 150,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.createdBy?.name || "N/A"}
        </Typography>
      ),
    },
    {
      field: "attendees",
      headerName: "RSVP Stats",
      width: 150,
      align: "center",
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Chip
            label={params.row.rsvp?.attending?.length || 0}
            size="small"
            color="success"
          />
          <Chip
            label={params.row.rsvp?.maybe?.length || 0}
            size="small"
            color="warning"
          />
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as IEvent;
        const canEdit = canManage(event);

        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View details">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleView(event)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <>
                <Tooltip title="Edit event">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEdit(event)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete event">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(event._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  // Filter events based on role
  const filteredEvents =
    currentUser?.role === "General Admin"
      ? events
      : events.filter(
          (event) => event.community._id === currentUser?.community
        );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Events Management
              </Typography>
              {currentUser?.role === "General Admin" && (
                <Chip label="All Communities" color="error" size="small" />
              )}
              {currentUser?.role === "Community Admin" && (
                <Chip label="Your Community" color="warning" size="small" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {currentUser?.role === "General Admin"
                ? "Manage all community events across the platform"
                : "Manage events for your community members"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingEvent(null);
              setForm({
                title: "",
                description: "",
                longDescription: "",
                eventDate: "",
                location: "",
              });
              setOpen(true);
            }}
            size="large"
          >
            Create Event
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Events
              </Typography>
              <Typography variant="h4">{filteredEvents.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Upcoming Events
              </Typography>
              <Typography variant="h4">
                {
                  filteredEvents.filter(
                    (e) => getDaysRemaining(e.eventDate) >= 0
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                This Week
              </Typography>
              <Typography variant="h4">
                {
                  filteredEvents.filter((e) => {
                    const days = getDaysRemaining(e.eventDate);
                    return days >= 0 && days <= 7;
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: "eventDate", sort: "asc" }],
            },
          }}
          getRowId={(row) => row._id}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-row:hover": {
              cursor: "pointer",
            },
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEvent ? "Edit Event" : "Create New Event"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Event Title"
            fullWidth
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Short Description"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            helperText="Brief overview of the event"
          />
          <TextField
            label="Long Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={form.longDescription}
            onChange={(e) => handleChange("longDescription", e.target.value)}
            helperText="Detailed information about the event"
          />
          <TextField
            label="Date & Time"
            fullWidth
            type="datetime-local"
            value={form.eventDate}
            onChange={(e) => handleChange("eventDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Location"
            fullWidth
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : editingEvent
              ? "Update Event"
              : "Create Event"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {viewingEvent && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {viewingEvent.title}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    label={viewingEvent.community.name}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${getDaysRemaining(
                      viewingEvent.eventDate
                    )} days away`}
                    color={
                      getDaysRemaining(viewingEvent.eventDate) <= 3
                        ? "error"
                        : "default"
                    }
                    size="small"
                  />
                </Stack>
              </Box>

              <Box sx={{ display: "flex", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EventIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date & Time
                    </Typography>
                    <Typography variant="body2">
                      {new Date(viewingEvent.eventDate).toLocaleString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOnIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {viewingEvent.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Description
                </Typography>
                <Typography variant="body1">
                  {viewingEvent.description}
                </Typography>
              </Box>

              {viewingEvent.longDescription && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Additional Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewingEvent.longDescription}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Event Information
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Created by:</strong> {viewingEvent.createdBy.name} (
                    {viewingEvent.createdBy.email})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Community:</strong> {viewingEvent.community.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>RSVP Summary:</strong>
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ pl: 2, mb: 1 }}>
                    <Chip
                      label={`${
                        viewingEvent.rsvp?.attending?.length || 0
                      } Will Attend`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`${
                        viewingEvent.rsvp?.maybe?.length || 0
                      } Might Attend`}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={`${
                        viewingEvent.rsvp?.notAttending?.length || 0
                      } Won't Attend`}
                      color="error"
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2">
                    <strong>Created on:</strong>{" "}
                    {new Date(viewingEvent.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
          {viewingEvent && canManage(viewingEvent) && (
            <>
              <Button
                onClick={() => {
                  setViewOpen(false);
                  handleEdit(viewingEvent);
                }}
                variant="outlined"
                color="primary"
              >
                Edit
              </Button>
              <Button
                onClick={() => {
                  setViewOpen(false);
                  handleDelete(viewingEvent._id);
                }}
                variant="outlined"
                color="error"
              >
                Delete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
