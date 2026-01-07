import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  longDescription?: string;
  eventDate: Date;
  location: string;
  status: "Upcoming" | "Planning" | "Completed";
  imageUrl?: string;
  imageHint?: string;
  createdBy: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  rsvp: {
    attending: mongoose.Types.ObjectId[];
    maybe: mongoose.Types.ObjectId[];
    notAttending: mongoose.Types.ObjectId[];
  };
  notificationsSent: {
    daysRemaining: number;
    sentAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ["Upcoming", "Planning", "Completed"],
      default: "Planning",
    },
    imageUrl: String,
    imageHint: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    rsvp: {
      attending: {
        type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        default: [],
      },
      maybe: {
        type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        default: [],
      },
      notAttending: {
        type: [{ type: Schema.Types.ObjectId, ref: "User" }],
        default: [],
      },
    },
    notificationsSent: [
      {
        daysRemaining: Number,
        sentAt: Date,
      },
    ],
  },
  { timestamps: true, strictPopulate: false } as any
);

export default mongoose.models.Event ||
  mongoose.model<IEvent>("Event", EventSchema);
