import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  ownerName: string;
  ownerEmail: string;
  type: string;
  location: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp?: string;
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
    type: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    whatsapp: String,
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
