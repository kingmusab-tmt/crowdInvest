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
  Chip,
  IconButton,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventIcon from "@mui/icons-material/Event";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

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
  role: "User" | "Admin";
  community?: string;
}

type StatusFilter = "upcoming" | "latest" | "past" | "recent" | "all";
type DaysFilter = "any" | "today" | "3" | "7" | "30";

const RECENT_WINDOW_DAYS = 30;
const PAGE_SIZE = 6;

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<string | null>(null);
  const { snackbar, closeSnackbar, showError, showSuccess } = useSnackbar();

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    "upcoming"
  );
  const [daysFilter, setDaysFilter] = React.useState<DaysFilter>("any");
  const [page, setPage] = React.useState(1);

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
      showError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title || !form.eventDate || !form.location) {
      showError(
        "Please fill in the required fields: Title, Date, and Location"
      );
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
      showSuccess(
        editingEvent
          ? "Event updated successfully!"
          : "Event created successfully!"
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchEvents();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit event");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteClick(eventId: string) {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!eventToDelete) return;

    setDeleteConfirmOpen(false);
    try {
      const res = await fetch(`/api/events?eventId=${eventToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      showSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setEventToDelete(null);
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
    return currentUser.role === "Admin";
  };

  const getDaysRemaining = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const days = Math.ceil(
      (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  function getDaysLabel(days: number): string {
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return "Today";
    if (days === 1) return "1 day away";
    return `${days} days away`;
  }

  function getCountdownColor(days: number) {
    if (days < 0) return "default";
    if (days <= 1) return "error";
    if (days <= 3) return "warning";
    if (days <= 7) return "info";
    return "success";
  }

  // Apply the status filter (upcoming / latest / past / recent / all) and
  // the days-remaining filter, producing the list actually paginated/rendered.
  const filteredEvents = React.useMemo(() => {
    const now = new Date();
    let list = [...events];

    switch (statusFilter) {
      case "upcoming":
        list = list.filter((e) => new Date(e.eventDate).getTime() >= now.getTime());
        list.sort(
          (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );
        break;
      case "past":
        list = list.filter((e) => new Date(e.eventDate).getTime() < now.getTime());
        list.sort(
          (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
        break;
      case "recent": {
        const windowStart = now.getTime() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        list = list.filter((e) => {
          const t = new Date(e.eventDate).getTime();
          return t < now.getTime() && t >= windowStart;
        });
        list.sort(
          (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
        break;
      }
      case "latest":
        list.sort(
          (a, b) =>
            new Date(b.createdAt || b.eventDate).getTime() -
            new Date(a.createdAt || a.eventDate).getTime()
        );
        break;
      case "all":
      default:
        list.sort(
          (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );
    }

    if (daysFilter !== "any" && (statusFilter === "upcoming" || statusFilter === "all")) {
      list = list.filter((e) => {
        const days = getDaysRemaining(e.eventDate);
        if (days < 0) return false;
        if (daysFilter === "today") return days === 0;
        return days <= parseInt(daysFilter, 10);
      });
    }

    return list;
  }, [events, statusFilter, daysFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, daysFilter]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedEvents = filteredEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "latest", label: "Latest" },
    { value: "past", label: "Past" },
    { value: "recent", label: "Recent" },
    { value: "all", label: "All" },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Events Management
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Manage community events
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

        {/* Statistics Cards (always reflect the full dataset, not the filter) */}
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography gutterBottom variant="body2" sx={{ color: "text.secondary" }}>
                Total Events
              </Typography>
              <Typography variant="h4">{events.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography gutterBottom variant="body2" sx={{ color: "text.secondary" }}>
                Upcoming Events
              </Typography>
              <Typography variant="h4">
                {events.filter((e) => getDaysRemaining(e.eventDate) >= 0).length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography gutterBottom variant="body2" sx={{ color: "text.secondary" }}>
                This Week
              </Typography>
              <Typography variant="h4">
                {
                  events.filter((e) => {
                    const days = getDaysRemaining(e.eventDate);
                    return days >= 0 && days <= 7;
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Filters */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, alignItems: { xs: "stretch", sm: "center" } }}
      >
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          size="small"
          onChange={(_, value) => {
            if (value) setStatusFilter(value);
          }}
          sx={{ flexWrap: "wrap" }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControl
          size="small"
          sx={{ minWidth: 190 }}
          disabled={statusFilter !== "upcoming" && statusFilter !== "all"}
        >
          <InputLabel>Days Remaining</InputLabel>
          <Select
            label="Days Remaining"
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value as DaysFilter)}
          >
            <MenuItem value="any">Any time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="3">Within 3 days</MenuItem>
            <MenuItem value="7">Within 7 days</MenuItem>
            <MenuItem value="30">Within 30 days</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {filteredEvents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <EventBusyIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {events.length === 0
              ? "No events yet. Create one to get started!"
              : "No events match this filter."}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {pagedEvents.map((event) => {
              const days = getDaysRemaining(event.eventDate);
              const eventDateObj = new Date(event.eventDate);
              const canEdit = canManage(event);
              const attendingCount = event.rsvp?.attending?.length || 0;
              const maybeCount = event.rsvp?.maybe?.length || 0;
              const notAttendingCount = event.rsvp?.notAttending?.length || 0;

              return (
                <Grid key={event._id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderTop: 4,
                      borderColor:
                        getCountdownColor(days) === "default"
                          ? "grey.400"
                          : `${getCountdownColor(days)}.main`,
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            flexShrink: 0,
                            width: 56,
                            height: 56,
                            borderRadius: 1.5,
                            bgcolor: "action.hover",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}
                          >
                            {eventDateObj.toLocaleDateString("en-US", { month: "short" })}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {eventDateObj.getDate()}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {eventDateObj.toLocaleDateString("en-US", {
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              year: "numeric",
                            })}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                        <Chip
                          label={getDaysLabel(days)}
                          color={getCountdownColor(days) as any}
                          size="small"
                        />
                        <Chip
                          label={event.community?.name || "N/A"}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Stack>

                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1.5 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {event.location}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          mb: 2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {event.description || event.longDescription || "No description provided."}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ mb: 2, alignItems: "center", color: "text.secondary" }}
                      >
                        <GroupsIcon fontSize="small" />
                        <Typography variant="caption">
                          {attendingCount} going · {maybeCount} maybe · {notAttendingCount} declined
                        </Typography>
                      </Stack>

                      <Box sx={{ flexGrow: 1 }} />

                      <Divider sx={{ mb: 1.5 }} />

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", justifyContent: "space-between" }}
                      >
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
                          <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {event.createdBy?.name || "N/A"}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <Tooltip title="View details">
                            <IconButton size="small" color="info" onClick={() => handleView(event)}>
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
                                  onClick={() => handleDeleteClick(event._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

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
            required
            slotProps={{
              inputLabel: { shrink: true }
            }}
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
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
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
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
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
                  gutterBottom
                  sx={{
                    color: "text.secondary"
                  }}
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
                    gutterBottom
                    sx={{
                      color: "text.secondary"
                    }}
                  >
                    Additional Details
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {viewingEvent.longDescription}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    color: "text.secondary"
                  }}
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
                  handleDeleteClick(viewingEvent._id);
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
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
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
