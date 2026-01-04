import mongoose, { Schema, Document } from "mongoose";

export interface IProposal extends Document {
  title: string;
  description: string;
  longDescription: string;
  status: "Active" | "Passed" | "Failed";
  acceptedVotes: number;
  rejectedVotes: number;
  totalMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, required: true },
    status: {
      type: String,
      enum: ["Active", "Passed", "Failed"],
      default: "Active",
    },
    acceptedVotes: { type: Number, default: 0 },
    rejectedVotes: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);
