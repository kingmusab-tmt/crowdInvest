import React from "react";
import { Box, Chip, Tooltip, Typography, Stack, Alert } from "@mui/material";
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
  if (!kyc) {
    return (
      <Tooltip title="No KYC submission yet">
        <Chip
          icon={<HighlightOffIcon />}
          label="Not Verified"
          color="default"
          variant="outlined"
          size="small"
        />
      </Tooltip>
    );
  }

  if (kyc.isVerified) {
    return (
      <Tooltip
        title={`Verified on ${
          kyc.verifiedAt
            ? new Date(kyc.verifiedAt).toLocaleDateString()
            : "Unknown date"
        }`}
      >
        <Stack spacing={0.5}>
          <Chip
            icon={<VerifiedIcon />}
            label="KYC Verified"
            color="success"
            size="small"
          />
          {showDetails && kyc.verificationNotes && (
            <Typography variant="caption" color="text.secondary">
              {kyc.verificationNotes}
            </Typography>
          )}
        </Stack>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Awaiting verification by admin">
      <Stack spacing={0.5}>
        <Chip
          icon={<PendingActionsIcon />}
          label="KYC Pending"
          color="warning"
          size="small"
        />
      </Stack>
    </Tooltip>
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
  if (!kyc) return null;

  if (!kyc.isVerified) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2">
          ⏳ <strong>KYC Verification Pending</strong> - Your profile is pending
          KYC verification by the community admin. You'll have full access once
          verified.
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert severity="success" sx={{ mb: 2 }}>
      <Typography variant="body2">
        ✓ <strong>Verified Community Member</strong> - Your KYC has been
        verified. You have full access to all community features.
      </Typography>
    </Alert>
  );
}
