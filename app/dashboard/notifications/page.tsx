"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Stack,
  Button,
  Alert,
  Divider,
  Badge,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

interface Notification {
  _id: string;
  subject: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  target?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setSelectedId(null);
      } else {
        setDeleteError("Failed to delete notification");
      }
    } catch (err) {
      setDeleteError("Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);

      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          })
        )
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      case "info":
      default:
        return "info";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedNotification = notifications.find((n) => n._id === selectedId);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ fontSize: 24 }} />
            </Badge>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {notifications.length} notification
          {notifications.length !== 1 ? "s" : ""}
          {unreadCount > 0 && `, ${unreadCount} unread`}
        </Typography>
      </Box>

      {/* Action Buttons */}
      {unreadCount > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<MarkEmailReadIcon />}
            variant="outlined"
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        </Box>
      )}

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {deleteError}
        </Alert>
      )}

      {/* Notifications List and Detail */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Notifications List */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {notifications.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <NotificationsIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! Check back later for updates.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ overflow: "hidden" }}>
              <List sx={{ p: 0 }}>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification._id}>
                    <ListItemButton
                      selected={selectedId === notification._id}
                      onClick={() => {
                        setSelectedId(notification._id);
                        if (!notification.read) {
                          handleMarkAsRead(notification._id);
                        }
                      }}
                      sx={{
                        backgroundColor: !notification.read
                          ? "action.hover"
                          : "transparent",
                        borderLeft: !notification.read
                          ? "4px solid"
                          : "4px solid transparent",
                        borderLeftColor: `${getTypeColor(
                          notification.type
                        )}.main`,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                flex: 1,
                              }}
                            >
                              {notification.subject}
                            </Typography>
                            <Chip
                              label={notification.type}
                              color={getTypeColor(notification.type) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mb: 0.5 }}
                            >
                              {notification.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatDate(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Detail Panel */}
        {selectedNotification && (
          <Box sx={{ flex: 1, minWidth: { xs: 0, md: 300 } }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    {selectedNotification.subject}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDelete(selectedNotification._id)}
                  >
                    Delete
                  </Button>
                </Box>
                <Chip
                  label={selectedNotification.type}
                  color={getTypeColor(selectedNotification.type) as any}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedNotification.description}
              </Typography>

              <Stack
                spacing={1}
                sx={{ mt: 3, pt: 2, borderTop: 1, borderTopColor: "divider" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(
                      selectedNotification.createdAt
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
                {selectedNotification.target && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Target
                    </Typography>
                    <Typography variant="body2">
                      {selectedNotification.target}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedNotification.read ? "Read" : "Unread"}
                    color={selectedNotification.read ? "success" : "warning"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
