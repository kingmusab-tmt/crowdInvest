import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentFailure extends Document {
  userEmail: string;
  userId: mongoose.Types.ObjectId;
  type: "one-time" | "recurring";
  amount: number;
  reason: string;
  reference?: string;
  failedAt: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryDate?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentFailureSchema = new Schema<IPaymentFailure>(
  {
    userEmail: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["one-time", "recurring"],
      required: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    reference: String,
    failedAt: { type: Date, default: () => new Date() },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    nextRetryDate: Date,
    resolved: { type: Boolean, default: false },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.PaymentFailure ||
  mongoose.model<IPaymentFailure>("PaymentFailure", PaymentFailureSchema);
