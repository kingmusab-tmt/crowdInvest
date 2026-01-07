"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
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
  CardActions,
  Chip,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useSession } from "next-auth/react";

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
}

interface ICurrentUser {
  _id: string;
  name: string;
  email: string;
  role: "User" | "Community Admin" | "General Admin";
  community?: string;
}

export default function EventsPage() {
  const { data: session } = useSession();
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

  React.useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
    // Check for notifications when page loads
    checkAndSendNotifications();
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

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events", err);
      setError("Failed to load events");
    }
  }

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

  async function checkAndSendNotifications() {
    try {
      await fetch("/api/events/notifications", { method: "POST" });
    } catch (err) {
      console.error("Failed to check notifications", err);
    }
  }

  function getDaysLabel(days: number): string {
    if (days < 0) return "Event passed";
    if (days === 0) return "Today!";
    if (days === 1) return "1 day away";
    return `${days} days away`;
  }

  function getCountdownColor(days: number) {
    if (days <= 0) return "error";
    if (days === 1) return "error";
    if (days <= 3) return "warning";
    if (days <= 7) return "info";
    return "default";
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
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      setSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
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

    // General Admin can edit any event
    if (currentUser.role === "General Admin") return true;

    // Community Admin can edit events in their community
    if (
      currentUser.role === "Community Admin" &&
      event.community._id === currentUser.community
    ) {
      return true;
    }

    // Creator can edit their own event
    return currentUser.email === event.createdBy.email;
  };

  // Check if current user can delete an event
  const canDelete = (event: IEvent) => {
    if (!currentUser) return false;

    // General Admin can delete any event
    if (currentUser.role === "General Admin") return true;

    // Community Admin can delete events in their community
    if (
      currentUser.role === "Community Admin" &&
      event.community._id === currentUser.community
    ) {
      return true;
    }

    // Creator can delete their own event
    return currentUser.email === event.createdBy.email;
  };

  const isCreator = (event: IEvent) => {
    return session?.user?.email === event.createdBy.email;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Community Events
            </Typography>
            {currentUser?.role === "General Admin" && (
              <Chip
                label="General Admin - All Communities"
                color="error"
                size="small"
              />
            )}
            {currentUser?.role === "Community Admin" && (
              <Chip label="Community Admin" color="warning" size="small" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {currentUser?.role === "General Admin"
              ? "Manage all community events across the platform."
              : currentUser?.role === "Community Admin"
              ? "Create and manage events for your community members."
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

      {events.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <EventIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography color="text.secondary" variant="body1">
            No events yet. Create one to get started!
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {events
            .sort(
              (a, b) =>
                new Date(a.eventDate).getTime() -
                new Date(b.eventDate).getTime()
            )
            .map((event) => (
              <Card key={event._id} sx={{ overflow: "visible" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {event.title}
                        </Typography>
                        {isCreator(event) && (
                          <Chip
                            label="You created this"
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <EventIcon
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(event.eventDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocationOnIcon
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>

                        <Chip
                          label={getDaysLabel(daysRemaining[event._id] || 0)}
                          color={getCountdownColor(
                            daysRemaining[event._id] || 0
                          )}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {event.description}
                      </Typography>

                      {event.longDescription && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {event.longDescription}
                        </Typography>
                      )}

                      {/* RSVP Statistics */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          mt: 2,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          icon={
                            <Typography sx={{ fontSize: "1.2rem", ml: 1 }}>
                              ✓
                            </Typography>
                          }
                          label={`${
                            event.rsvp?.attending?.length || 0
                          } Will Attend`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={
                            <Typography sx={{ fontSize: "1.2rem", ml: 1 }}>
                              ?
                            </Typography>
                          }
                          label={`${
                            event.rsvp?.maybe?.length || 0
                          } Might Attend`}
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={
                            <Typography sx={{ fontSize: "1.2rem", ml: 1 }}>
                              ✗
                            </Typography>
                          }
                          label={`${
                            event.rsvp?.notAttending?.length || 0
                          } Won't Attend`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* RSVP Buttons */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          size="small"
                          variant={
                            getUserRSVPStatus(event) === "attending"
                              ? "contained"
                              : "outlined"
                          }
                          color="success"
                          onClick={() => handleRSVP(event._id, "attending")}
                        >
                          {getUserRSVPStatus(event) === "attending" ? "✓ " : ""}
                          I Will Attend
                        </Button>
                        <Button
                          size="small"
                          variant={
                            getUserRSVPStatus(event) === "maybe"
                              ? "contained"
                              : "outlined"
                          }
                          color="warning"
                          onClick={() => handleRSVP(event._id, "maybe")}
                        >
                          {getUserRSVPStatus(event) === "maybe" ? "✓ " : ""}I
                          Might Attend
                        </Button>
                        <Button
                          size="small"
                          variant={
                            getUserRSVPStatus(event) === "notAttending"
                              ? "contained"
                              : "outlined"
                          }
                          color="error"
                          onClick={() => handleRSVP(event._id, "notAttending")}
                        >
                          {getUserRSVPStatus(event) === "notAttending"
                            ? "✓ "
                            : ""}
                          I Won't Attend
                        </Button>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mt: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Created by: <strong>{event.createdBy.name}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Community: <strong>{event.community.name}</strong>
                        </Typography>
                        {currentUser?.role && currentUser.role !== "User" && (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              •
                            </Typography>
                            <Chip
                              label={currentUser.role}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.7rem" }}
                            />
                          </>
                        )}
                      </Box>
                    </Box>

                    {(canEdit(event) || canDelete(event)) && (
                      <Stack direction="row" spacing={0.5}>
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
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Stack>
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
    </Container>
  );
}
