import mongoose, { Schema, Document } from "mongoose";

export interface IAssistance extends Document {
  community: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assistanceType:
    | "financial"
    | "physical"
    | "expertise"
    | "emotional"
    | "other";
  status: "Pending" | "Approved" | "Rejected" | "Voting";
  rejectionReason?: string;
  votes?: Array<{
    userId: mongoose.Types.ObjectId;
    vote: "assist" | "not-assist";
    votedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AssistanceSchema = new Schema<IAssistance>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    assistanceType: {
      type: String,
      enum: ["financial", "physical", "expertise", "emotional", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Voting"],
      default: "Pending",
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
          enum: ["assist", "not-assist"],
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

export default mongoose.models.Assistance ||
  mongoose.model<IAssistance>("Assistance", AssistanceSchema);
