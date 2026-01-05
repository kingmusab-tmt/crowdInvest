import mongoose, { Schema, Document } from "mongoose";

export interface IInvestment extends Document {
  title: string;
  description?: string;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
  basePrice: number;
  currentPrice: number;
  quantity: number;
  totalInvested: number;
  dividendReceived: number;
  status: "Active" | "Completed" | "Sold";
  community?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    title: { type: String, required: true },
    description: String,
    investmentType: {
      type: String,
      enum: ["stock", "business", "crypto", "real-estate"],
      required: true,
    },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
    dividendReceived: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Completed", "Sold"],
      default: "Active",
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);
