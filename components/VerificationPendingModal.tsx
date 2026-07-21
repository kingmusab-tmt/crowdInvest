"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "next-auth/react";
import { CONTRIBUTION_MODAL_SESSION_KEY } from "@/lib/dashboardConstants";

// Blocks the entire dashboard until an admin approves the user's KYC.
// Intentionally omits onClose — MUI only closes on Escape/backdrop-click if
// onClose is provided, so leaving it out (plus no close button) makes this
// dialog non-dismissable. Its focus trap + backdrop also keep the rest of
// the app (including the nav menu) unreachable while it's open.
export default function VerificationPendingModal() {
  const handleLogout = async () => {
    sessionStorage.removeItem(CONTRIBUTION_MODAL_SESSION_KEY);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      aria-labelledby="verification-pending-title"
    >
      <DialogContent sx={{ textAlign: "center", py: 5, px: 4 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(255, 167, 38, 0.16)"
                : "rgba(255, 167, 38, 0.12)",
            mx: "auto",
            mb: 3,
          }}
        >
          <PendingActionsIcon sx={{ fontSize: 36, color: "warning.main" }} />
        </Box>

        <Typography
          id="verification-pending-title"
          variant="h6"
          sx={{ fontWeight: 700, mb: 1.5 }}
        >
          Verification Pending
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Your account is awaiting verification by an admin. You'll have full
          access to your dashboard once your account has been verified.
        </Typography>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </DialogContent>
    </Dialog>
  );
}
