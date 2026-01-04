import mongoose, { Schema, Document } from "mongoose";

export interface IInvestment extends Document {
  title: string;
  description: string;
  longDescription: string;
  amount: number;
  goal: number;
  progress: number;
  investors: number;
  status: "Active" | "Funded" | "Completed";
  imageUrl: string;
  imageHint: string;
  projectedROI: string;
  term: string;
  risk: "Low" | "Medium" | "High";
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, required: true },
    amount: { type: Number, required: true },
    goal: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    investors: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Funded", "Completed"],
      default: "Active",
    },
    imageUrl: String,
    imageHint: String,
    projectedROI: String,
    term: String,
    risk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);
