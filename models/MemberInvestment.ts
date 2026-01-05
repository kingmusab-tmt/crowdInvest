import mongoose, { Schema, Document } from "mongoose";

export interface IMemberInvestment extends Document {
  user: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
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
  status: "Active" | "Completed" | "Sold";
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
      enum: ["stock", "business", "crypto", "real-estate"],
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
      enum: ["Active", "Completed", "Sold"],
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
