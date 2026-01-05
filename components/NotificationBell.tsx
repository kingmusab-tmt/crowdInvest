"use client";

import * as React from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckIcon from "@mui/icons-material/Check";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const open = Boolean(anchorEl);

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/users/notifications?countOnly=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (
    notification: Notification,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // Mark as read
    if (!notification.read) {
      await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification._id }),
      });
      fetchUnreadCount();
      fetchNotifications();
    }

    handleClose();

    // Navigate to notification detail page
    router.push(`/dashboard/notifications?id=${notification._id}`);
  };

  const handleMarkAsRead = async (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    try {
      await fetch("/api/users/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      fetchUnreadCount();
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
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    router.push("/dashboard/notifications");
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-label={`${unreadCount} unread notifications`}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={(e) => handleNotificationClick(notification, e)}
                sx={{
                  borderLeft: !notification.read
                    ? `4px solid ${getNotificationColor(notification.type)}`
                    : "4px solid transparent",
                  bgcolor: !notification.read ? "action.hover" : "transparent",
                  "&:hover": {
                    bgcolor: "action.selected",
                  },
                  py: 1.5,
                }}
              >
                <Box sx={{ width: "100%", pr: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Typography sx={{ fontSize: 20, lineHeight: 1, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: !notification.read ? 600 : 500,
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        sx={{
                          ml: 1,
                          "&:hover": {
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                          },
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              </MenuItem>
            ))}

            <Divider />
            <Box sx={{ p: 1, textAlign: "center" }}>
              <Button fullWidth onClick={handleViewAll}>
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
