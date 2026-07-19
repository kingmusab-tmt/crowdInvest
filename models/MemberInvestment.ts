import mongoose, { Schema, Document } from "mongoose";
import { INVESTMENT_TYPE_VALUES, InvestmentType } from "@/lib/investmentTypes";

export interface IMemberInvestment extends Document {
  user: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  investmentType: InvestmentType;
  title: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  currentValue: number;
  profitOrLoss: number;
  profitOrLossPercentage: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold" | "Cancelled";
  purchaseDate: Date;
  expectedMaturityDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberInvestmentSchema = new Schema<IMemberInvestment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    investmentType: {
      type: String,
      enum: INVESTMENT_TYPE_VALUES,
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    profitOrLoss: { type: Number, default: 0 },
    profitOrLossPercentage: { type: Number, default: 0 },
    dividendReceived: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Completed", "Sold", "Cancelled"],
      default: "Active",
    },
    purchaseDate: { type: Date, required: true },
    expectedMaturityDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.MemberInvestment ||
  mongoose.model<IMemberInvestment>("MemberInvestment", MemberInvestmentSchema);
