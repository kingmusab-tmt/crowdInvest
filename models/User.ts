import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId?: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "User" | "Admin";
  status: "Active" | "Restricted";
  balance: number;
  isTopUser: boolean;
  dateJoined: Date;
  lastLogin?: Date;
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
  whatsappNumber?: string;
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
    accountDetails?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };
  };
  personalAccountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  bvn?: string;
  nin?: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  verificationInfo?: string;
  kyc?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    verificationNotes?: string;
    rejectionReason?: string;
    rejectionDate?: Date;
    idType?: string;
    idNumber?: string;
    submittedAt?: Date;
  };
  settings?: {
    enableBiometrics: boolean;
    theme: "light" | "dark" | "system";
    profileVisibility: "public" | "private" | "community";
    notifications: {
      inApp: boolean; // In-app notifications
      email: boolean; // Email notifications
      emailPreferences: {
        announcements: boolean;
        investments: boolean;
        withdrawals: boolean;
        kyc: boolean;
        proposals: boolean;
        events: boolean;
      };
    };
  };
  paymentSettings?: {
    preferredPaymentMethod?: "one-time" | "reserved-account" | "recurring";
    paystackCustomerCode?: string;
    reservedAccountNumber?: string;
    reservedAccountBank?: string;
    reservedAccountName?: string;
    recurringPayment?: {
      isActive: boolean;
      amount: number;
      subscriptionCode?: string;
      authorizationCode?: string;
      nextPaymentDate?: Date;
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
      enum: ["User", "Admin"],
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
    lastLogin: Date,
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
    whatsappNumber: String,
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
      accountDetails: {
        bankName: String,
        accountNumber: String,
        accountName: String,
      },
    },
    personalAccountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },
    bvn: String,
    nin: String,
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    verificationInfo: String,
    kyc: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verificationNotes: String,
      rejectionReason: String,
      rejectionDate: Date,
      idType: String,
      idNumber: String,
      submittedAt: Date,
    },
    settings: {
      enableBiometrics: { type: Boolean, default: false },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      profileVisibility: {
        type: String,
        enum: ["public", "private", "community"],
        default: "community",
      },
      notifications: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        emailPreferences: {
          announcements: { type: Boolean, default: true },
          investments: { type: Boolean, default: true },
          withdrawals: { type: Boolean, default: true },
          kyc: { type: Boolean, default: true },
          proposals: { type: Boolean, default: true },
          events: { type: Boolean, default: true },
        },
      },
    },
    paymentSettings: {
      preferredPaymentMethod: {
        type: String,
        enum: ["one-time", "reserved-account", "recurring"],
      },
      paystackCustomerCode: String,
      reservedAccountNumber: String,
      reservedAccountBank: String,
      reservedAccountName: String,
      recurringPayment: {
        isActive: { type: Boolean, default: false },
        amount: Number,
        subscriptionCode: String,
        authorizationCode: String,
        nextPaymentDate: Date,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
