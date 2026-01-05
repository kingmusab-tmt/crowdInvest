"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useSearchParams } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedData?: Record<string, any>;
  actionUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

function a11yProps(index: number) {
  return {
    id: `notification-tab-${index}`,
    "aria-controls": `notification-tabpanel-${index}`,
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationId = searchParams.get("id");

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState(0);
  const [selectedNotification, setSelectedNotification] =
    React.useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  React.useEffect(() => {
    // Auto-open notification if ID is in query params
    if (notificationId && notifications.length > 0) {
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification) {
        handleViewDetail(notification);
      }
    }
  }, [notificationId, notifications]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/users/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setSuccess("All notifications marked as read");
      setTimeout(() => setSuccess(null), 3000);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleViewDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);

    // Mark as read if not already
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
  };

  const handleActionClick = (actionUrl?: string) => {
    setDetailDialogOpen(false);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      kyc_verified: "✅",
      kyc_rejected: "❌",
      investment: "💰",
      withdrawal: "💸",
      proposal: "📋",
      event: "📅",
      announcement: "📢",
      general: "🔔",
    };
    return icons[type] || "🔔";
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      kyc_verified: "#4caf50",
      kyc_rejected: "#f44336",
      investment: "#2196f3",
      withdrawal: "#ff9800",
      proposal: "#9c27b0",
      event: "#e91e63",
      announcement: "#00bcd4",
      general: "#757575",
    };
    return colors[type] || "#757575";
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      kyc_verified: "KYC Verified",
      kyc_rejected: "KYC Rejected",
      investment: "Investment",
      withdrawal: "Withdrawal",
      proposal: "Proposal",
      event: "Event",
      announcement: "Announcement",
      general: "General",
    };
    return labels[type] || "Notification";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications =
    tab === 0
      ? notifications
      : tab === 1
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with your community activities
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </Box>

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="notification tabs"
        >
          <Tab label={`All (${notifications.length})`} {...a11yProps(0)} />
          <Tab label={`Unread (${unreadCount})`} {...a11yProps(1)} />
          <Tab
            label={`Read (${notifications.length - unreadCount})`}
            {...a11yProps(2)}
          />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {tab === 1 ? "No unread notifications" : "No notifications yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === 1
              ? "You're all caught up!"
              : "You'll see notifications here when you receive them"}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredNotifications.map((notification) => (
            <Card
              key={notification._id}
              sx={{
                borderLeft: !notification.read
                  ? `6px solid ${getNotificationColor(notification.type)}`
                  : "6px solid transparent",
                bgcolor: !notification.read ? "action.hover" : "transparent",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: 3,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 32, lineHeight: 1 }}>
                    {getNotificationIcon(notification.type)}
                  </Typography>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: !notification.read ? 600 : 500,
                          fontSize: "1.1rem",
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={getNotificationTypeLabel(notification.type)}
                        size="small"
                        sx={{
                          bgcolor: getNotificationColor(notification.type),
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {notification.message}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {formatDate(notification.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  onClick={() => handleViewDetail(notification)}
                >
                  View Details
                </Button>
                {!notification.read && (
                  <Button
                    size="small"
                    onClick={() => handleMarkAsRead(notification._id)}
                    startIcon={<MarkEmailReadIcon />}
                  >
                    Mark as Read
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: 32 }}>
                  {getNotificationIcon(selectedNotification.type)}
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedNotification.title}
                  </Typography>
                  <Chip
                    label={getNotificationTypeLabel(selectedNotification.type)}
                    size="small"
                    sx={{
                      bgcolor: getNotificationColor(selectedNotification.type),
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Typography>

              {selectedNotification.relatedData &&
                Object.keys(selectedNotification.relatedData).length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Additional Information
                    </Typography>
                    {Object.entries(selectedNotification.relatedData).map(
                      ([key, value]) => (
                        <Typography
                          key={key}
                          variant="body2"
                          color="text.secondary"
                        >
                          <strong>{key}:</strong> {String(value)}
                        </Typography>
                      )
                    )}
                  </Paper>
                )}

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Received: {formatDate(selectedNotification.createdAt)}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              {selectedNotification.actionUrl && (
                <Button
                  variant="contained"
                  onClick={() =>
                    handleActionClick(selectedNotification.actionUrl)
                  }
                >
                  Take Action
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
