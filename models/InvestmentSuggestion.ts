import mongoose, { Schema, Document } from "mongoose";

export interface IInvestmentSuggestion extends Document {
  community: mongoose.Types.ObjectId;
  suggestedBy: mongoose.Types.ObjectId;
  investmentType: "stock" | "business" | "crypto" | "real-estate";
  title: string;
  description: string;
  reason: string;
  amountRequired: number;
  timeframe: string;
  expectedReturn?: string;
  riskLevel: "Low" | "Medium" | "High";
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  rejectionReason?: string;
  votes?: Array<{
    userId: mongoose.Types.ObjectId;
    vote: "yes" | "no";
    votedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSuggestionSchema = new Schema<IInvestmentSuggestion>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    suggestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investmentType: {
      type: String,
      enum: ["stock", "business", "crypto", "real-estate"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    reason: { type: String, required: true },
    amountRequired: { type: Number, required: true },
    timeframe: { type: String, required: true },
    expectedReturn: String,
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Voting"],
      default: "Pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: Date,
    rejectionReason: String,
    votes: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        vote: {
          type: String,
          enum: ["yes", "no"],
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.InvestmentSuggestion ||
  mongoose.model<IInvestmentSuggestion>(
    "InvestmentSuggestion",
    InvestmentSuggestionSchema
  );
