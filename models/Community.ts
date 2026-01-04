import mongoose, { Schema, Document } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
  generalAdmin: mongoose.Types.ObjectId;
  communityAdmin?: mongoose.Types.ObjectId;
  status: "Active" | "Suspended";
  enabledFunctions: {
    investments: boolean;
    proposals: boolean;
    events: boolean;
    assistance: boolean;
    kyc: boolean;
    withdrawals: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    imageUrl: String,
    memberCount: { type: Number, default: 0 },
    generalAdmin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    communityAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
    enabledFunctions: {
      investments: { type: Boolean, default: true },
      proposals: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      assistance: { type: Boolean, default: true },
      kyc: { type: Boolean, default: true },
      withdrawals: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Community ||
  mongoose.model<ICommunity>("Community", CommunitySchema);
