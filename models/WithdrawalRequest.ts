import mongoose, { Schema, Document } from "mongoose";

export interface IWithdrawalRequest extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  community: mongoose.Types.ObjectId;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: Date;
  processedDate?: Date;
  processedBy?: mongoose.Types.ObjectId;
  processedByName?: string;
  rejectionReason?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestDate: { type: Date, default: Date.now },
    processedDate: Date,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedByName: String,
    rejectionReason: String,
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequest>(
    "WithdrawalRequest",
    WithdrawalRequestSchema
  );
