import React from "react";
import { Box, Chip, Tooltip, Typography, Stack } from "@mui/material";
import { useSnackbar } from "@/hooks/use-snackbar";
import SnackbarAlert from "@/components/SnackbarAlert";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

interface KYCStatusBadgeProps {
  kyc?: {
    isVerified: boolean;
    verifiedAt?: Date | string;
    verificationNotes?: string;
    idType?: string;
    idNumber?: string;
  };
  showDetails?: boolean;
}

export default function KYCStatusBadge({
  kyc,
  showDetails = false,
}: KYCStatusBadgeProps) {
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();

  const handleSnackbar = (
    message: string,
    severity: "success" | "warning" | "info" | "error"
  ) => {
    closeSnackbar();
    if (severity === "success") {
      showSuccess(message);
      return;
    }
    if (severity === "warning") {
      showWarning(message);
      return;
    }
    if (severity === "error") {
      showError(message);
      return;
    }
    showInfo(message);
  };

  let content: React.ReactNode;

  if (!kyc) {
    content = (
      <Tooltip title="No KYC submission yet">
        <Chip
          icon={<HighlightOffIcon />}
          label="Not Verified"
          color="default"
          variant="outlined"
          size="small"
          onClick={() =>
            handleSnackbar(
              "No KYC submission yet. Upload your documents to get verified.",
              "warning"
            )
          }
        />
      </Tooltip>
    );
  } else if (kyc.isVerified) {
    const verifiedDate = kyc.verifiedAt
      ? new Date(kyc.verifiedAt).toLocaleDateString()
      : "Unknown date";
    const verifiedMessage = kyc.verifiedAt
      ? `KYC verified on ${verifiedDate}.`
      : "KYC verified, but the verification date is unavailable.";

    content = (
      <Tooltip title={`Verified on ${verifiedDate}`}>
        <Stack spacing={0.5}>
          <Chip
            icon={<VerifiedIcon />}
            label="KYC Verified"
            color="success"
            size="small"
            onClick={() =>
              handleSnackbar(
                verifiedMessage,
                kyc.verifiedAt ? "success" : "error"
              )
            }
          />
          {showDetails && kyc.verificationNotes && (
            <Typography variant="caption" color="text.secondary">
              {kyc.verificationNotes}
            </Typography>
          )}
        </Stack>
      </Tooltip>
    );
  } else {
    content = (
      <Tooltip title="Awaiting verification by admin">
        <Stack spacing={0.5}>
          <Chip
            icon={<PendingActionsIcon />}
            label="KYC Pending"
            color="warning"
            size="small"
            onClick={() =>
              handleSnackbar(
                "KYC pending. Admin will verify your documents soon.",
                "info"
              )
            }
          />
        </Stack>
      </Tooltip>
    );
  }

  return (
    <>
      {content}
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </>
  );
}

interface KYCBannerProps {
  kyc?: {
    isVerified: boolean;
  };
}

/**
 * A banner component to display at the top of user profiles
 * showing their KYC verification status
 */
export function KYCVerificationBanner({ kyc }: KYCBannerProps) {
  const {
    snackbar,
    closeSnackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  } = useSnackbar();
  void showError;
  void showInfo;

  React.useEffect(() => {
    if (!kyc) {
      closeSnackbar();
      return;
    }

    closeSnackbar();
    if (kyc.isVerified) {
      showSuccess(
        "Verified Community Member - Your KYC has been verified. You have full access to all community features."
      );
    } else {
      showWarning(
        "KYC Verification Pending - Your profile is pending admin verification. You'll have full access once verified."
      );
    }
  }, [kyc]);

  if (!kyc) return null;

  const isVerified = kyc.isVerified;
  const bannerStyles = {
    mb: 2,
    p: 2,
    borderRadius: 1,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    bgcolor: isVerified ? "success.light" : "warning.light",
    color: isVerified ? "success.dark" : "warning.dark",
  } as const;

  return (
    <>
      <Box sx={bannerStyles}>
        {isVerified ? (
          <VerifiedIcon fontSize="small" />
        ) : (
          <PendingActionsIcon fontSize="small" />
        )}
        <Typography variant="body2">
          {isVerified
            ? "Verified Community Member - Your KYC has been verified. You have full access to all community features."
            : "KYC Verification Pending - Your profile is pending admin verification. You'll have full access once verified."}
        </Typography>
      </Box>
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </>
  );
}
