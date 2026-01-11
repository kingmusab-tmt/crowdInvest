import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userName: string;
  userEmail: string;
  community?: mongoose.Types.ObjectId;
  type:
    | "Monthly_Contribution"
    | "Investment"
    | "Profit Share"
    | "Assistance"
    | "Event"
    | "profit_deposit"
    | "refund_deposit";
  status: "Completed" | "Pending" | "Failed";
  amount: number;
  date: Date;
  isAdminTransaction: boolean;
  performedByName?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "Monthly_Contribution",
        "Investment",
        "Profit Share",
        "Assistance",
        "Event",
        "profit_deposit",
        "refund_deposit",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      default: "Pending",
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: () => new Date() },
    isAdminTransaction: { type: Boolean, default: false },
    performedByName: {
      type: String,
      default: function (this: any) {
        return this.userName;
      },
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      index: true,
    },
    description: {
      type: String,
      default: function (this: any) {
        return this.type;
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
