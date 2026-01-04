import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId?: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "User" | "Community Admin" | "General Admin";
  status: "Active" | "Restricted";
  balance: number;
  isTopUser: boolean;
  dateJoined: Date;
  community?: mongoose.Types.ObjectId;
  profileCompleted: boolean;
  dateOfBirth?: Date;
  placeOfWork?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  phoneNumber?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  maritalStatus?:
    | "Single"
    | "Married"
    | "Divorced"
    | "Widowed"
    | "Prefer not to say";
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  };
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  permissions?: {
    canManageUsers: boolean;
    canManageCommunities: boolean;
    canManageInvestments: boolean;
    canManageProposals: boolean;
    canManageEvents: boolean;
    canManageAssistance: boolean;
    canManageKYC: boolean;
    canManageWithdrawals: boolean;
    canSuspendUsers: boolean;
    canAssignCommunityAdmins: boolean;
    canModifyCommunityFunctions: boolean;
  };
  verificationInfo?: string;
  settings?: {
    enableBiometrics: boolean;
    theme: "light" | "dark" | "system";
    profileVisible: boolean;
    notifications: {
      email: {
        announcements: boolean;
        investments: boolean;
        withdrawals: boolean;
      };
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: String,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatarUrl: String,
    role: {
      type: String,
      enum: ["User", "Community Admin", "General Admin"],
      default: "User",
    },
    status: {
      type: String,
      enum: ["Active", "Restricted"],
      default: "Active",
    },
    balance: { type: Number, default: 0 },
    isTopUser: { type: Boolean, default: false },
    dateJoined: { type: Date, default: () => new Date() },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    profileCompleted: { type: Boolean, default: false },
    dateOfBirth: Date,
    placeOfWork: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    phoneNumber: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String,
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Prefer not to say"],
    },
    nextOfKin: {
      name: String,
      relationship: String,
      phoneNumber: String,
      email: String,
      address: String,
    },
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    permissions: {
      canManageUsers: { type: Boolean, default: false },
      canManageCommunities: { type: Boolean, default: false },
      canManageInvestments: { type: Boolean, default: false },
      canManageProposals: { type: Boolean, default: false },
      canManageEvents: { type: Boolean, default: false },
      canManageAssistance: { type: Boolean, default: false },
      canManageKYC: { type: Boolean, default: false },
      canManageWithdrawals: { type: Boolean, default: false },
      canSuspendUsers: { type: Boolean, default: false },
      canAssignCommunityAdmins: { type: Boolean, default: false },
      canModifyCommunityFunctions: { type: Boolean, default: false },
    },
    verificationInfo: String,
    settings: {
      enableBiometrics: { type: Boolean, default: false },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      profileVisible: { type: Boolean, default: true },
      notifications: {
        email: {
          announcements: { type: Boolean, default: true },
          investments: { type: Boolean, default: true },
          withdrawals: { type: Boolean, default: true },
        },
        push: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
