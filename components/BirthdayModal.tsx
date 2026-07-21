"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import CakeIcon from "@mui/icons-material/Cake";
import { BIRTHDAY_MODAL_SESSION_KEY } from "@/lib/dashboardConstants";

interface UpcomingBirthday {
  userId: string;
  name: string;
  avatarUrl?: string;
  daysUntil: number;
  isSelf: boolean;
}

function formatDaysUntil(daysUntil: number, isSelf: boolean): string {
  if (daysUntil === 0) return isSelf ? "Today — Happy Birthday!" : "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}

// Shown once per session (see BIRTHDAY_MODAL_SESSION_KEY) whenever any
// community member has a birthday within the next 30 days. Always reflects
// the current 30/15/7/2/1/today window via /api/birthdays/upcoming — the
// separate /api/birthdays/check route (see UserDashboardLayout) is what
// actually fires the milestone Notification records.
export default function BirthdayModal() {
  const [open, setOpen] = React.useState(false);
  const [birthdays, setBirthdays] = React.useState<UpcomingBirthday[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(BIRTHDAY_MODAL_SESSION_KEY)) return;

    fetch("/api/birthdays/upcoming")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.upcoming?.length) {
          setBirthdays(data.upcoming);
          sessionStorage.setItem(BIRTHDAY_MODAL_SESSION_KEY, "1");
          setOpen(true);
        }
      })
      .catch(() => {
        // Silent fail — don't disrupt the dashboard experience
      });
  }, []);

  if (birthdays.length === 0) return null;

  const hasBirthdayToday = birthdays.some((b) => b.daysUntil === 0);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6, display: "flex", alignItems: "center", gap: 1 }}>
        <CakeIcon color="primary" />
        {hasBirthdayToday ? "Birthdays Today!" : "Upcoming Birthdays"}
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {birthdays.map((b) => (
            <ListItem key={b.userId} disableGutters>
              <ListItemAvatar>
                <Avatar src={b.avatarUrl} alt={b.name} />
              </ListItemAvatar>
              <ListItemText primary={b.isSelf ? `${b.name} (You)` : b.name} />
              <Chip
                size="small"
                label={formatDaysUntil(b.daysUntil, b.isSelf)}
                color={b.daysUntil === 0 ? "success" : "default"}
                variant={b.daysUntil === 0 ? "filled" : "outlined"}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
