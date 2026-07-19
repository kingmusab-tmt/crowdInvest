"use client";

import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpIcon from "@mui/icons-material/Help";
import CancelIcon from "@mui/icons-material/Cancel";
import GroupsIcon from "@mui/icons-material/Groups";
import { useSession } from "next-auth/react";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

interface IEvent {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  eventDate: string;
  location: string;
  createdBy: { _id: string; name: string; email: string; role?: string };
  community: { _id: string; name: string };
  rsvp: {
    attending: any[];
    maybe: any[];
    notAttending: any[];
  };
  status: string;
  imageUrl?: string;
  notificationsSent?: any[];
  createdAt?: string;
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

export default function EventsPage() {
  const { data: session } = useSession();
  const { snackbar, closeSnackbar, showWarning, showSuccess, showError } =
    useSnackbar();
  const { dialog, openConfirmDialog, closeConfirmDialog, handleConfirm } =
    useConfirmDialog();
  const [events, setEvents] = React.useState<IEvent[]>([]);
  const [currentUser, setCurrentUser] = React.useState<ICurrentUser | null>(
    null
  );
  const [open, setOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<IEvent | null>(null);
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
  const [daysRemaining, setDaysRemaining] = React.useState<{
    [key: string]: number;
  }>({});
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    "upcoming"
  );
  const [daysFilter, setDaysFilter] = React.useState<DaysFilter>("any");
  const [page, setPage] = React.useState(1);

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  }, []);

  const fetchEvents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  }, []);

  const checkAndSendNotifications = React.useCallback(async () => {
    try {
      await fetch("/api/events/notifications/check", { method: "POST" });
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  React.useEffect(() => {
    if (currentUser?.community || currentUser?.role === "Admin") {
      fetchEvents();
      checkAndSendNotifications();
    }
  }, [
    currentUser?.community,
    currentUser?.role,
    fetchEvents,
    checkAndSendNotifications,
  ]);

  React.useEffect(() => {
    // Update countdown timer every minute
    const timer = setInterval(() => {
      calculateDaysRemaining();
    }, 60000);

    return () => clearInterval(timer);
  }, [events]);

  React.useEffect(() => {
    calculateDaysRemaining();
  }, [events]);

  function calculateDaysRemaining() {
    const remaining: { [key: string]: number } = {};
    const now = new Date();

    events.forEach((event) => {
      const eventDate = new Date(event.eventDate);
      const days = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      remaining[event._id] = days;
    });

    setDaysRemaining(remaining);
  }

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
  // the days-remaining filter, producing the list actually rendered.
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
        // Most recently added to the platform, regardless of event date
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

    // Days-remaining filter only makes sense for future events
    if (daysFilter !== "any" && (statusFilter === "upcoming" || statusFilter === "all")) {
      list = list.filter((e) => {
        const days = daysRemaining[e._id];
        if (days === undefined || days < 0) return false;
        if (daysFilter === "today") return days === 0;
        return days <= parseInt(daysFilter, 10);
      });
    }

    return list;
  }, [events, statusFilter, daysFilter, daysRemaining]);

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

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!form.title || !form.eventDate || !form.location) {
      setError("Please fill in the required fields: Title, Date, and Location");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingEvent ? "/api/events" : "/api/events";
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

      // Refresh events
      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit event");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    openConfirmDialog(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      async () => {
        try {
          const res = await fetch(`/api/events?eventId=${eventId}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Failed to delete event");

          setSuccess("Event deleted successfully!");
          fetchEvents();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to delete event"
          );
        }
      }
    );
  }

  async function handleRSVP(
    eventId: string,
    response: "attending" | "maybe" | "notAttending"
  ) {
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, response }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update RSVP");
      }

      // Update the event in the list
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP");
    }
  }

  const renderSnackbar = () => (
    <SnackbarAlert
      open={snackbar.open}
      message={snackbar.message}
      severity={snackbar.severity}
      onClose={closeSnackbar}
    />
  );

  function getUserRSVPStatus(
    event: IEvent
  ): "attending" | "maybe" | "notAttending" | null {
    if (!currentUser) return null;

    const isAttending = event.rsvp?.attending?.some(
      (user: any) =>
        user._id === currentUser._id || user.email === currentUser.email
    );
    const isMaybe = event.rsvp?.maybe?.some(
      (user: any) =>
        user._id === currentUser._id || user.email === currentUser.email
    );
    const isNotAttending = event.rsvp?.notAttending?.some(
      (user: any) =>
        user._id === currentUser._id || user.email === currentUser.email
    );

    if (isAttending) return "attending";
    if (isMaybe) return "maybe";
    if (isNotAttending) return "notAttending";
    return null;
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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Check if current user can edit an event
  const canEdit = (event: IEvent) => {
    if (!currentUser) return false;

    // Admin can edit any event
    if (currentUser.role === "Admin") return true;

    // Creator can edit their own event
    return currentUser.email === event.createdBy.email;
  };

  // Check if current user can delete an event
  const canDelete = (event: IEvent) => {
    if (!currentUser) return false;

    // Admin can delete any event
    if (currentUser.role === "Admin") return true;

    // Creator can delete their own event
    return currentUser.email === event.createdBy.email;
  };

  const isCreator = (event: IEvent) => {
    return session?.user?.email === event.createdBy.email;
  };

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "latest", label: "Latest" },
    { value: "past", label: "Past" },
    { value: "recent", label: "Recent" },
    { value: "all", label: "All" },
  ];

  return (
    <Box>
      {renderSnackbar()}
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
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Community Events
            </Typography>
            {currentUser?.role === "Admin" && (
              <Chip label="Admin" color="error" size="small" />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {currentUser?.role === "Admin"
              ? "Manage all community events."
              : "View, create, and manage your community events."}{" "}
            Reminders will be sent 7, 3, 2, and 1 day before each event.
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
            const days = daysRemaining[event._id] ?? 0;
            const eventDateObj = new Date(event.eventDate);
            const rsvpStatus = getUserRSVPStatus(event);
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
                    {/* Header: date tile + title */}
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
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, lineHeight: 1.3 }}
                        >
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
                      {isCreator(event) && (
                        <Chip label="Your event" size="small" variant="outlined" color="primary" />
                      )}
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

                    {/* RSVP summary */}
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ mb: 2, alignItems: "center", color: "text.secondary" }}
                    >
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <GroupsIcon fontSize="small" />
                        <Typography variant="caption">
                          {attendingCount} going · {maybeCount} maybe · {notAttendingCount} declined
                        </Typography>
                      </Stack>
                    </Stack>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* RSVP actions */}
                    <ToggleButtonGroup
                      value={rsvpStatus}
                      exclusive
                      fullWidth
                      size="small"
                      onChange={(_, value) => {
                        if (value) handleRSVP(event._id, value);
                      }}
                      sx={{ mb: 2 }}
                    >
                      <ToggleButton value="attending" color="success">
                        <Tooltip title="I will attend">
                          <CheckCircleIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="maybe" color="warning">
                        <Tooltip title="I might attend">
                          <HelpIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="notAttending" color="error">
                        <Tooltip title="I won't attend">
                          <CancelIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <Divider sx={{ mb: 1.5 }} />

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", justifyContent: "space-between" }}
                    >
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
                        <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="caption" color="textSecondary" noWrap>
                          {event.createdBy.name} · {event.community.name}
                        </Typography>
                      </Stack>

                      {(canEdit(event) || canDelete(event)) && (
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                          {canEdit(event) && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(event)}
                              title="Edit event"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete(event) && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(event._id)}
                              title="Delete event"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      )}
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

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingEvent(null);
        }}
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
          <Button
            onClick={() => {
              setOpen(false);
              setEditingEvent(null);
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
              : editingEvent
              ? "Update Event"
              : "Create Event"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
