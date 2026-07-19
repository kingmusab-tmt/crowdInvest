import mongoose, { Schema, Document } from "mongoose";
import { INVESTMENT_TYPE_VALUES, InvestmentType } from "@/lib/investmentTypes";

export interface IInvestment extends Document {
  title: string;
  description?: string;
  investmentType: InvestmentType;
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold" | "Cancelled";
  community?: mongoose.Types.ObjectId;
  // Type-specific extra details (ticker/exchange for stock, propertyAddress
  // for real-estate, etc.) — see lib/investmentTypes.ts for the field sets.
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    title: { type: String, required: true },
    description: String,
    investmentType: {
      type: String,
      enum: INVESTMENT_TYPE_VALUES,
      required: true,
    },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
    dividendReceived: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Completed", "Sold", "Cancelled"],
      default: "Active",
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);
