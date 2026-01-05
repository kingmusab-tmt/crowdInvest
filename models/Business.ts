import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  ownerName: string;
  ownerEmail: string;
  community?: mongoose.Types.ObjectId;
  type: string;
  location: string;
  fullAddress?: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp?: string;
  website?: string;
  seekingInvestment: boolean;
  imageUrl: string;
  imageHint: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: false,
    },
    type: { type: String, required: true },
    location: { type: String, required: true },
    fullAddress: { type: String, required: false },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    whatsapp: String,
    website: String,
    seekingInvestment: { type: Boolean, default: false },
    imageUrl: String,
    imageHint: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Business ||
  mongoose.model<IBusiness>("Business", BusinessSchema);
