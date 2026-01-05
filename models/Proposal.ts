import mongoose, { Schema, Document } from "mongoose";

export interface IProposal extends Document {
  community: mongoose.Types.ObjectId;
  proposedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  longDescription?: string;
  proposalType: "policy" | "initiative" | "budget" | "event" | "other";
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "voting"
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Voting";
  rejectionReason?: string;
  votes?: Array<{
    userId: mongoose.Types.ObjectId;
    vote: "yes" | "no";
    votedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    proposalType: {
      type: String,
      enum: ["policy", "initiative", "budget", "event", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "voting",
        "Pending",
        "Approved",
        "Rejected",
        "Voting",
      ],
      default: "pending",
    },
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

export default mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

// Clear the model from cache on hot reload to ensure schema updates
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Proposal;
}
