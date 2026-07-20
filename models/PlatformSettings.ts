import mongoose, { Schema, Document } from "mongoose";
import { INVESTMENT_TYPE_VALUES } from "@/lib/investmentTypes";

export interface IPlatformSettings extends Document {
  // 1. General / Branding
  platformName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  currencyCode: string;
  currencySymbol: string;
  footerText?: string;

  // 3. Financial Settings
  minimumContribution: number;
  minimumWithdrawal: number;
  autoApproveWithdrawalUnder: number;

  // 4. Investment Types
  enabledInvestmentTypes: string[];

  // 5. KYC & Verification
  kyc: {
    requireBvn: boolean;
    requireNin: boolean;
    requireIdUpload: boolean;
    autoApprove: boolean;
  };

  // 6. Notifications
  notifications: {
    emailSenderName: string;
    emailSenderAddress?: string;
    smsProviderEnabled: boolean;
  };

  // 7. Payment Gateway
  payment: {
    mode: "test" | "live";
    provider: string;
  };

  // 8. Security
  security: {
    sessionDurationHours: number;
    requireTwoFactorForAdmins: boolean;
    passwordMinLength: number;
  };

  // 9. Legal & Compliance
  legal: {
    termsAndConditions: string;
    privacyPolicy: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };

  // 10. Appearance
  appearance: {
    primaryColor: string;
    secondaryColor: string;
  };

  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TERMS = `1. Acceptance of Terms
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.

2. User Obligations
Users must provide accurate information, maintain account security, and comply with all applicable laws and regulations.

3. Investment Risks
All investments carry inherent risks. The platform does not guarantee returns and users should invest responsibly.

4. Platform Usage
Users agree not to misuse the platform, engage in fraudulent activities, or violate community standards.

5. Termination
The platform reserves the right to suspend or terminate accounts that violate these terms.`;

const DEFAULT_PRIVACY = `1. Data Collection
We collect personal information necessary for account creation, investment management, and service delivery.

2. Data Usage
Your data is used to provide services, process transactions, communicate updates, and improve user experience.

3. Data Protection
We implement industry-standard security measures to protect your personal information from unauthorized access.

4. Data Sharing
We do not sell your data. Information is only shared with your consent or as required by law.

5. Your Rights
You have the right to access, update, or delete your personal data at any time through your account settings.`;

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformName: { type: String, required: true, default: "CrowdInvest" },
    tagline: {
      type: String,
      default: "Contribute together, Invest together, Grow together.",
    },
    logoUrl: String,
    faviconUrl: String,
    supportEmail: { type: String, default: "support@crowdinvest.com" },
    supportPhone: String,
    currencyCode: { type: String, default: "NGN" },
    currencySymbol: { type: String, default: "₦" },
    footerText: String,

    minimumContribution: { type: Number, default: 0 },
    minimumWithdrawal: { type: Number, default: 0 },
    autoApproveWithdrawalUnder: { type: Number, default: 0 },

    enabledInvestmentTypes: {
      type: [String],
      default: [...INVESTMENT_TYPE_VALUES],
    },

    kyc: {
      requireBvn: { type: Boolean, default: false },
      requireNin: { type: Boolean, default: false },
      requireIdUpload: { type: Boolean, default: false },
      autoApprove: { type: Boolean, default: false },
    },

    notifications: {
      emailSenderName: { type: String, default: "CrowdInvest" },
      emailSenderAddress: String,
      smsProviderEnabled: { type: Boolean, default: false },
    },

    payment: {
      mode: { type: String, enum: ["test", "live"], default: "test" },
      provider: { type: String, default: "paystack" },
    },

    security: {
      sessionDurationHours: { type: Number, default: 1 },
      requireTwoFactorForAdmins: { type: Boolean, default: false },
      passwordMinLength: { type: Number, default: 8 },
    },

    legal: {
      termsAndConditions: { type: String, default: DEFAULT_TERMS },
      privacyPolicy: { type: String, default: DEFAULT_PRIVACY },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: {
        type: String,
        default:
          "We're currently performing scheduled maintenance. Please check back shortly.",
      },
    },

    appearance: {
      primaryColor: { type: String, default: "#1976d2" },
      secondaryColor: { type: String, default: "#dc004e" },
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);
