"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";

interface MemberOption {
  _id: string;
  name: string;
  email: string;
}

export default function AdminNotifyPage() {
  const { snackbar, closeSnackbar, showError, showSuccess } = useSnackbar();

  const [target, setTarget] = React.useState<"all" | "individual">("all");
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(true);
  const [selectedMember, setSelectedMember] =
    React.useState<MemberOption | null>(null);
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => showError("Failed to load members"))
      .finally(() => setLoadingMembers(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      showError("Title and message are required");
      return;
    }
    if (target === "individual" && !selectedMember) {
      showError("Select a member to notify");
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          userId: target === "individual" ? selectedMember?._id : undefined,
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess(data.message || "Notification sent");
        setLastResult(
          target === "all"
            ? `Sent to ${data.recipientCount} member(s).`
            : `Sent to ${selectedMember?.name}.`
        );
        setTitle("");
        setMessage("");
        setSelectedMember(null);
      } else {
        showError(data.error || "Failed to send notification");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to send notification"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Notify Members
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send a notification (in-app and, if enabled, email) to all members
          at once, or to a single member.
        </Typography>
      </Box>

      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Recipients
        </Typography>
        <RadioGroup
          row
          value={target}
          onChange={(e) => {
            setTarget(e.target.value as "all" | "individual");
            setLastResult(null);
          }}
          sx={{ mb: target === "individual" ? 2 : 3 }}
        >
          <FormControlLabel value="all" control={<Radio />} label="All Members" />
          <FormControlLabel
            value="individual"
            control={<Radio />}
            label="Individual Member"
          />
        </RadioGroup>

        {target === "individual" && (
          <Autocomplete
            options={members}
            loading={loadingMembers}
            value={selectedMember}
            onChange={(_, value) => setSelectedMember(value)}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Member"
                placeholder="Search by name or email"
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps.input,
                    endAdornment: (
                      <>
                        {loadingMembers ? (
                          <CircularProgress size={18} />
                        ) : null}
                        {params.slotProps.input.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            sx={{ mb: 3 }}
          />
        )}

        <Divider sx={{ mb: 3 }} />

        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          multiline
          rows={5}
          sx={{ mb: 3 }}
        />

        {lastResult && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {lastResult}
          </Alert>
        )}

        <Button
          variant="contained"
          startIcon={
            sending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
          onClick={handleSend}
          disabled={sending}
          fullWidth
        >
          {sending ? "Sending..." : "Send Notification"}
        </Button>
      </Paper>
    </Container>
  );
}
