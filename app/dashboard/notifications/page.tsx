"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { alpha, Theme } from "@mui/material/styles";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaidIcon from "@mui/icons-material/Paid";
import SavingsIcon from "@mui/icons-material/Savings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PieChartIcon from "@mui/icons-material/PieChart";
import ForumIcon from "@mui/icons-material/Forum";
import CampaignIcon from "@mui/icons-material/Campaign";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { useRouter, useSearchParams } from "next/navigation";

type StatColor = "primary" | "success" | "error" | "warning" | "info" | "secondary";

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

interface NotificationMeta {
  icon: React.ReactNode;
  color: StatColor;
  label: string;
}

const NOTIFICATION_META: Record<string, NotificationMeta> = {
  kyc_verified: { icon: <CheckCircleIcon fontSize="small" />, color: "success", label: "KYC Verified" },
  kyc_rejected: { icon: <CancelIcon fontSize="small" />, color: "error", label: "KYC Rejected" },
  investment: { icon: <TrendingUpIcon fontSize="small" />, color: "primary", label: "Investment" },
  withdrawal: { icon: <PaidIcon fontSize="small" />, color: "warning", label: "Withdrawal" },
  monthly_contribution: { icon: <SavingsIcon fontSize="small" />, color: "success", label: "Monthly Contribution" },
  contribution: { icon: <SavingsIcon fontSize="small" />, color: "success", label: "Contribution" },
  profit_deposit: { icon: <TrendingUpIcon fontSize="small" />, color: "info", label: "Profit Deposit" },
  manual_deposit: { icon: <AccountBalanceWalletIcon fontSize="small" />, color: "primary", label: "Manual Deposit" },
  assistance: { icon: <VolunteerActivismIcon fontSize="small" />, color: "secondary", label: "Assistance" },
  profit_share: { icon: <PieChartIcon fontSize="small" />, color: "info", label: "Profit Share" },
  proposal: { icon: <ForumIcon fontSize="small" />, color: "secondary", label: "Proposal" },
  event: { icon: <EventIcon fontSize="small" />, color: "secondary", label: "Event" },
  announcement: { icon: <CampaignIcon fontSize="small" />, color: "info", label: "Announcement" },
  business_approved: { icon: <StorefrontIcon fontSize="small" />, color: "success", label: "Business Approved" },
  business_rejected: { icon: <StorefrontIcon fontSize="small" />, color: "error", label: "Business Rejected" },
  investment_suggestion: { icon: <LightbulbIcon fontSize="small" />, color: "primary", label: "Investment Suggestion" },
  investment_suggestion_approved: { icon: <CheckCircleIcon fontSize="small" />, color: "success", label: "Suggestion Approved" },
  investment_suggestion_rejected: { icon: <CancelIcon fontSize="small" />, color: "error", label: "Suggestion Rejected" },
  investment_voting_open: { icon: <HowToVoteIcon fontSize="small" />, color: "primary", label: "Voting Open" },
  investment_voting_closed: { icon: <HowToVoteIcon fontSize="small" />, color: "secondary", label: "Voting Closed" },
  general: { icon: <NotificationsIcon fontSize="small" />, color: "info", label: "General" },
};

function getNotificationMeta(type: string): NotificationMeta {
  return (
    NOTIFICATION_META[type] || {
      icon: <NotificationsIcon fontSize="small" />,
      color: "info",
      label: "Notification",
    }
  );
}

function a11yProps(index: number) {
  return {
    id: `notification-tab-${index}`,
    "aria-controls": `notification-tabpanel-${index}`,
  };
}

// --- Small presentational helpers -----------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: StatColor;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, height: "100%" }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", mb: 1.5 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme: Theme) => alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
      <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "action.hover",
            color: "text.disabled",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360, mx: "auto" }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------

function NotificationsContent() {
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

  const fetchNotifications = React.useCallback(async () => {
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
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderNotificationDetails = (notification: Notification) => {
    // Event notification with special formatting
    if (notification.type === "event" && notification.relatedData?.eventTitle) {
      const { eventTitle, eventDate, eventLocation, daysRemaining } =
        notification.relatedData;

      return (
        <Stack spacing={2}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {notification.message}
          </Typography>
          {/* Event Details Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
              borderRadius: 2,
            }}
          >
            <Grid container spacing={3}>
              {/* Title */}
              <Grid size={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <EventIcon sx={{ color: "primary.main", fontSize: 28 }} />
                  <Box>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Event Name
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        wordBreak: "break-word",
                      }}
                    >
                      {eventTitle}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Date & Time */}
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <AccessTimeIcon sx={{ color: "info.main", mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Date & Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatEventDate(eventDate)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mt: 0.5
                      }}>
                      {formatEventTime(eventDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Days Remaining */}
              {daysRemaining !== undefined && (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6
                  }}>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        bgcolor: (theme) =>
                          daysRemaining <= 1
                            ? theme.palette.error.light
                            : daysRemaining <= 3
                            ? theme.palette.warning.light
                            : theme.palette.success.light,
                        borderRadius: 1,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        mt: 0.5,
                      }}
                    >
                      {daysRemaining}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{
                        color: "text.secondary"
                      }}>
                        Days Remaining
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {daysRemaining === 0
                          ? "Today!"
                          : daysRemaining === 1
                          ? "1 day away"
                          : `${daysRemaining} days away`}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Location */}
              <Grid size={12}>
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <LocationOnIcon sx={{ color: "error.main", mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      Location
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        wordBreak: "break-word",
                      }}
                    >
                      {eventLocation}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      );
    }

    // Generic notification with relatedData
    if (
      notification.relatedData &&
      Object.keys(notification.relatedData).length > 0
    ) {
      return (
        <Stack spacing={2}>
          <Typography variant="body1">{notification.message}</Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Additional Information
            </Typography>
            {Object.entries(notification.relatedData).map(([key, value]) => (
              <Typography
                key={key}
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 0.5
                }}>
                <strong>{key}:</strong> {String(value)}
              </Typography>
            ))}
          </Paper>
        </Stack>
      );
    }

    // Simple message only
    return <Typography variant="body1">{notification.message}</Typography>;
  };

  const filteredNotifications =
    tab === 0
      ? notifications
      : tab === 1
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 4,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <NotificationsIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Stay updated with your community activities
            </Typography>
          </Box>
        </Stack>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </Stack>

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4 }}>
          <StatCard
            icon={<NotificationsIcon fontSize="small" />}
            label="Total"
            value={notifications.length}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatCard
            icon={<MarkEmailUnreadIcon fontSize="small" />}
            label="Unread"
            value={unreadCount}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatCard
            icon={<MarkEmailReadIcon fontSize="small" />}
            label="Read"
            value={readCount}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="notification tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            bgcolor: "background.paper",
            px: 1,
            "& .MuiTab-root": {
              minWidth: { xs: 120, sm: 150 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 600,
              textTransform: "none",
            },
          }}
        >
          <Tab
            icon={<NotificationsIcon fontSize="small" />}
            iconPosition="start"
            label={`All (${notifications.length})`}
            {...a11yProps(0)}
          />
          <Tab
            icon={<MarkEmailUnreadIcon fontSize="small" />}
            iconPosition="start"
            label={`Unread (${unreadCount})`}
            {...a11yProps(1)}
          />
          <Tab
            icon={<MarkEmailReadIcon fontSize="small" />}
            iconPosition="start"
            label={`Read (${readCount})`}
            {...a11yProps(2)}
          />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<NotificationsNoneIcon />}
          title={tab === 1 ? "No unread notifications" : "No notifications yet"}
          description={
            tab === 1
              ? "You're all caught up!"
              : "You'll see notifications here when you receive them"
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {filteredNotifications.map((notification) => {
            const meta = getNotificationMeta(notification.type);
            return (
              <Paper
                key={notification._id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  borderLeft: (theme) =>
                    `4px solid ${
                      !notification.read
                        ? theme.palette[meta.color].main
                        : "transparent"
                    }`,
                  bgcolor: !notification.read
                    ? (theme) => alpha(theme.palette[meta.color].main, 0.04)
                    : "transparent",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: (theme) => alpha(theme.palette[meta.color].main, 0.12),
                      color: `${meta.color}.main`,
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: `${meta.color}.main`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: !notification.read ? 700 : 500,
                          }}
                        >
                          {notification.title}
                        </Typography>
                      </Stack>
                      <Chip
                        label={meta.label}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: (theme) => alpha(theme.palette[meta.color].main, 0.12),
                          color: `${meta.color}.main`,
                        }}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notification.message}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center", color: "text.secondary", mb: 1.5 }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: 13 }} />
                      <Typography variant="caption">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetail(notification)}
                      >
                        View Details
                      </Button>
                      {!notification.read && (
                        <Button
                          size="small"
                          onClick={() => handleMarkAsRead(notification._id)}
                          startIcon={<MarkEmailReadIcon fontSize="small" />}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            );
          })}
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
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: (theme) =>
                      alpha(
                        theme.palette[getNotificationMeta(selectedNotification.type).color].main,
                        0.12
                      ),
                    color: `${getNotificationMeta(selectedNotification.type).color}.main`,
                    flexShrink: 0,
                  }}
                >
                  {getNotificationMeta(selectedNotification.type).icon}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedNotification.title}
                  </Typography>
                  <Chip
                    label={getNotificationMeta(selectedNotification.type).label}
                    size="small"
                    sx={{
                      mt: 0.5,
                      fontWeight: 600,
                      bgcolor: (theme) =>
                        alpha(
                          theme.palette[getNotificationMeta(selectedNotification.type).color].main,
                          0.12
                        ),
                      color: `${getNotificationMeta(selectedNotification.type).color}.main`,
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              {renderNotificationDetails(selectedNotification)}

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 3,
                  display: "block"
                }}>
                Received: {formatDate(selectedNotification.createdAt)}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              {selectedNotification.actionUrl && (
                <Button
                  variant="contained"
                  disableElevation
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
    </Box>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
