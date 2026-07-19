"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatNaira } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

interface MemberDetailsModalProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onUserChanged?: () => void;
}

const TABS = [
  "Profile",
  "Transactions",
  "Investments",
  "Proposals",
  "Assistance",
  "Withdrawals",
  "Businesses",
  "Events",
];

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EmptyState({ label }: { label: string }) {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="body2" color="textSecondary">
        {label}
      </Typography>
    </Box>
  );
}

function TabLoading() {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function statusColor(status?: string): any {
  const s = (status || "").toLowerCase();
  if (["completed", "approved", "active", "verified"].includes(s))
    return "success";
  if (["pending", "voting", "planning"].includes(s)) return "warning";
  if (["failed", "rejected"].includes(s)) return "error";
  return "default";
}

function ActivityRow({
  title,
  subtitle,
  meta,
  status,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  status?: string;
}) {
  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        {meta}
        {status && (
          <Chip size="small" label={status} color={statusColor(status)} />
        )}
      </Stack>
    </Box>
  );
}

interface TabState<T> {
  items: T[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

function initialTabState<T>(): TabState<T> {
  return { items: [], loading: false, loaded: false, error: null };
}

export default function MemberDetailsModal({
  open,
  userId,
  onClose,
  onUserChanged,
}: MemberDetailsModalProps) {
  const [tab, setTab] = React.useState(0);
  const [user, setUser] = React.useState<any>(null);
  const [userLoading, setUserLoading] = React.useState(false);
  const [statusValue, setStatusValue] = React.useState("Active");
  const [statusSaving, setStatusSaving] = React.useState(false);
  const { snackbar, closeSnackbar, showError, showSuccess } = useSnackbar();

  const [transactions, setTransactions] = React.useState(
    initialTabState<any>()
  );
  const [investments, setInvestments] = React.useState(
    initialTabState<any>()
  );
  const [proposals, setProposals] = React.useState(initialTabState<any>());
  const [assistance, setAssistance] = React.useState(initialTabState<any>());
  const [withdrawals, setWithdrawals] = React.useState(
    initialTabState<any>()
  );
  const [businesses, setBusinesses] = React.useState(initialTabState<any>());
  const [events, setEvents] = React.useState(initialTabState<any>());

  // Reset everything when a different member is opened
  React.useEffect(() => {
    if (!open || !userId) return;
    setTab(0);
    setUser(null);
    setTransactions(initialTabState());
    setInvestments(initialTabState());
    setProposals(initialTabState());
    setAssistance(initialTabState());
    setWithdrawals(initialTabState());
    setBusinesses(initialTabState());
    setEvents(initialTabState());

    (async () => {
      setUserLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Failed to load member");
        const data = await res.json();
        setUser(data);
        setStatusValue(data.status || "Active");
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "Failed to load member"
        );
      } finally {
        setUserLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const loadTab = React.useCallback(
    async (index: number) => {
      if (!user || !userId) return;

      const run = async <T,>(
        state: TabState<T>,
        setState: React.Dispatch<React.SetStateAction<TabState<T>>>,
        fetcher: () => Promise<T[]>
      ) => {
        if (state.loaded || state.loading) return;
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const items = await fetcher();
          setState({ items, loading: false, loaded: true, error: null });
        } catch (err) {
          setState({
            items: [],
            loading: false,
            loaded: false,
            error: err instanceof Error ? err.message : "Failed to load",
          });
        }
      };

      if (index === 1) {
        await run(transactions, setTransactions, async () => {
          const res = await fetch("/api/transactions");
          if (!res.ok) throw new Error("Failed to load transactions");
          const all = await res.json();
          return all
            .filter((t: any) => t.userEmail === user.email)
            .sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        });
      } else if (index === 2) {
        await run(investments, setInvestments, async () => {
          const res = await fetch(
            `/api/investments/member?userId=${userId}`
          );
          if (!res.ok) throw new Error("Failed to load investments");
          const all = await res.json();
          return all.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } else if (index === 3) {
        await run(proposals, setProposals, async () => {
          const res = await fetch("/api/proposals");
          if (!res.ok) throw new Error("Failed to load proposals");
          const all = await res.json();
          return all
            .filter((p: any) => p.proposedBy?._id === userId)
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
      } else if (index === 4) {
        await run(assistance, setAssistance, async () => {
          const res = await fetch("/api/assistance");
          if (!res.ok) throw new Error("Failed to load assistance requests");
          const all = await res.json();
          return all
            .filter((a: any) => a.requestedBy?._id === userId)
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
      } else if (index === 5) {
        await run(withdrawals, setWithdrawals, async () => {
          const res = await fetch("/api/withdrawals");
          if (!res.ok) throw new Error("Failed to load withdrawals");
          const all = await res.json();
          return all
            .filter((w: any) => w.userEmail === user.email)
            .sort(
              (a: any, b: any) =>
                new Date(b.requestDate).getTime() -
                new Date(a.requestDate).getTime()
            );
        });
      } else if (index === 6) {
        await run(businesses, setBusinesses, async () => {
          const res = await fetch("/api/businesses");
          if (!res.ok) throw new Error("Failed to load businesses");
          const all = await res.json();
          return all
            .filter((b: any) => b.ownerEmail === user.email)
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
      } else if (index === 7) {
        await run(events, setEvents, async () => {
          const res = await fetch("/api/events");
          if (!res.ok) throw new Error("Failed to load events");
          const all = await res.json();
          return all
            .filter((e: any) => {
              if (e.createdBy?._id === userId) return true;
              const inList = (list: any[]) =>
                Array.isArray(list) &&
                list.some((m: any) => m?._id === userId);
              return (
                inList(e.rsvp?.attending) ||
                inList(e.rsvp?.maybe) ||
                inList(e.rsvp?.notAttending)
              );
            })
            .sort(
              (a: any, b: any) =>
                new Date(b.eventDate).getTime() -
                new Date(a.eventDate).getTime()
            );
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, userId, transactions, investments, proposals, assistance, withdrawals, businesses, events]
  );

  React.useEffect(() => {
    if (open && user) {
      loadTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user, open]);

  const handleSaveStatus = async () => {
    if (!userId) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      const updated = await res.json();
      setUser(updated);
      showSuccess("Account status updated");
      onUserChanged?.();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const address = user?.address;
  const nextOfKin = user?.nextOfKin;
  const socialMedia = user?.socialMedia;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Member Details
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {userLoading || !user ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  sx={{ width: 72, height: 72 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" noWrap>
                    {user.email}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={user.role}
                      color={user.role === "Admin" ? "primary" : "default"}
                    />
                    <Chip
                      size="small"
                      label={user.status}
                      color={user.status === "Active" ? "success" : "warning"}
                    />
                    {user.community?.name && (
                      <Chip size="small" variant="outlined" label={user.community.name} />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
            >
              {TABS.map((label) => (
                <Tab key={label} label={label} />
              ))}
            </Tabs>

            {/* Profile Tab */}
            {tab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Personal Information
                    </Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {user.phoneNumber || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>WhatsApp:</strong> {user.whatsappNumber || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date of Birth:</strong>{" "}
                        {formatDate(user.dateOfBirth)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Place of Work:</strong>{" "}
                        {user.placeOfWork || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Marital Status:</strong>{" "}
                        {user.maritalStatus || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Joined:</strong>{" "}
                        {formatDate(user.dateJoined || user.createdAt)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Login:</strong>{" "}
                        {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Address
                    </Typography>
                    <Stack spacing={0.75}>
                      <Typography variant="body2">
                        <strong>Street:</strong> {address?.street || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>LGA/City:</strong> {address?.city || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>State:</strong> {address?.state || "—"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Country:</strong> {address?.country || "—"}
                      </Typography>
                    </Stack>
                  </Grid>

                  {nextOfKin?.name && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Next of Kin
                      </Typography>
                      <Stack spacing={0.75}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {nextOfKin.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Relationship:</strong>{" "}
                          {nextOfKin.relationship || "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phone:</strong>{" "}
                          {nextOfKin.phoneNumber || "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {nextOfKin.email || "—"}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}

                  {socialMedia &&
                    (socialMedia.facebook ||
                      socialMedia.twitter ||
                      socialMedia.linkedin ||
                      socialMedia.instagram) && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          Social Media
                        </Typography>
                        <Stack spacing={0.75}>
                          {socialMedia.facebook && (
                            <Typography variant="body2">
                              <strong>Facebook:</strong>{" "}
                              {socialMedia.facebook}
                            </Typography>
                          )}
                          {socialMedia.twitter && (
                            <Typography variant="body2">
                              <strong>X (Twitter):</strong>{" "}
                              {socialMedia.twitter}
                            </Typography>
                          )}
                          {socialMedia.linkedin && (
                            <Typography variant="body2">
                              <strong>LinkedIn:</strong>{" "}
                              {socialMedia.linkedin}
                            </Typography>
                          )}
                          {socialMedia.instagram && (
                            <Typography variant="body2">
                              <strong>Instagram:</strong>{" "}
                              {socialMedia.instagram}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    )}

                  <Grid size={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Verification &amp; Account
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        size="small"
                        label={
                          user.kyc?.isVerified
                            ? "KYC Verified"
                            : "KYC Not Verified"
                        }
                        color={user.kyc?.isVerified ? "success" : "default"}
                      />
                      <Chip
                        size="small"
                        label={
                          user.profileCompleted
                            ? "Profile Completed"
                            : "Profile Incomplete"
                        }
                        color={user.profileCompleted ? "success" : "warning"}
                      />
                    </Stack>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      sx={{ alignItems: { xs: "stretch", sm: "center" } }}
                    >
                      <TextField
                        select
                        label="Account Status"
                        size="small"
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        sx={{ minWidth: 200 }}
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Restricted">Restricted</MenuItem>
                      </TextField>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={statusSaving || statusValue === user.status}
                        onClick={handleSaveStatus}
                      >
                        {statusSaving ? "Saving..." : "Save Status"}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Transactions Tab */}
            {tab === 1 && (
              <Box>
                {transactions.loading ? (
                  <TabLoading />
                ) : transactions.items.length === 0 ? (
                  <EmptyState label="No transactions found for this member." />
                ) : (
                  transactions.items.map((t: any) => (
                    <ActivityRow
                      key={t._id}
                      title={t.type}
                      subtitle={formatDate(t.date)}
                      meta={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: t.amount < 0 ? "error.main" : "success.main",
                          }}
                        >
                          {formatNaira(t.amount)}
                        </Typography>
                      }
                      status={t.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Investments Tab */}
            {tab === 2 && (
              <Box>
                {investments.loading ? (
                  <TabLoading />
                ) : investments.items.length === 0 ? (
                  <EmptyState label="No investments found for this member." />
                ) : (
                  investments.items.map((i: any) => (
                    <ActivityRow
                      key={i._id}
                      title={i.title}
                      subtitle={`${i.investmentType} · Invested ${formatNaira(
                        i.totalInvested
                      )} · Now ${formatNaira(i.currentValue)}`}
                      status={i.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Proposals Tab */}
            {tab === 3 && (
              <Box>
                {proposals.loading ? (
                  <TabLoading />
                ) : proposals.items.length === 0 ? (
                  <EmptyState label="No proposals created by this member." />
                ) : (
                  proposals.items.map((p: any) => (
                    <ActivityRow
                      key={p._id}
                      title={p.title}
                      subtitle={`${p.proposalType} · ${formatDate(
                        p.createdAt
                      )}`}
                      status={p.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Assistance Tab */}
            {tab === 4 && (
              <Box>
                {assistance.loading ? (
                  <TabLoading />
                ) : assistance.items.length === 0 ? (
                  <EmptyState label="No assistance requests from this member." />
                ) : (
                  assistance.items.map((a: any) => (
                    <ActivityRow
                      key={a._id}
                      title={a.title}
                      subtitle={`${a.assistanceType} · ${formatDate(
                        a.createdAt
                      )}`}
                      status={a.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Withdrawals Tab */}
            {tab === 5 && (
              <Box>
                {withdrawals.loading ? (
                  <TabLoading />
                ) : withdrawals.items.length === 0 ? (
                  <EmptyState label="No withdrawal requests from this member." />
                ) : (
                  withdrawals.items.map((w: any) => (
                    <ActivityRow
                      key={w._id}
                      title={formatNaira(w.amount)}
                      subtitle={formatDate(w.requestDate)}
                      status={w.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Businesses Tab */}
            {tab === 6 && (
              <Box>
                {businesses.loading ? (
                  <TabLoading />
                ) : businesses.items.length === 0 ? (
                  <EmptyState label="No businesses registered by this member." />
                ) : (
                  businesses.items.map((b: any) => (
                    <ActivityRow
                      key={b._id}
                      title={b.name}
                      subtitle={`${b.type} · ${b.location}`}
                      status={b.status}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Events Tab */}
            {tab === 7 && (
              <Box>
                {events.loading ? (
                  <TabLoading />
                ) : events.items.length === 0 ? (
                  <EmptyState label="No event activity for this member." />
                ) : (
                  events.items.map((e: any) => {
                    const isCreator = e.createdBy?._id === userId;
                    const role = isCreator
                      ? "Organizer"
                      : e.rsvp?.attending?.some((m: any) => m?._id === userId)
                      ? "Attending"
                      : e.rsvp?.maybe?.some((m: any) => m?._id === userId)
                      ? "Maybe"
                      : "Not Attending";
                    return (
                      <ActivityRow
                        key={e._id}
                        title={e.title}
                        subtitle={`${role} · ${formatDate(e.eventDate)}`}
                        status={e.status}
                      />
                    );
                  })
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Dialog>
  );
}
