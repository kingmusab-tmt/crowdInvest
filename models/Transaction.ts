import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userName: string;
  userEmail: string;
  type: "Deposit" | "Withdrawal" | "Investment" | "Profit Share" | "Assistance";
  status: "Completed" | "Pending" | "Failed";
  amount: number;
  date: Date;
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
        "Deposit",
        "Withdrawal",
        "Investment",
        "Profit Share",
        "Assistance",
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
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
