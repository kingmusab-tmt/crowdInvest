import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type:
    | "kyc_rejected"
    | "kyc_verified"
    | "investment"
    | "withdrawal"
    | "proposal"
    | "event"
    | "announcement"
    | "contribution"
    | "general";
  title: string;
  message: string;
  relatedData?: Record<string, any>;
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "kyc_rejected",
        "kyc_verified",
        "investment",
        "withdrawal",
        "proposal",
        "event",
        "announcement",
        "contribution",
        "general",
      ],
      default: "general",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: String,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
