import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  longDescription: string;
  status: 'Upcoming' | 'Planning' | 'Completed';
  imageUrl: string;
  imageHint: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String, required: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Planning', 'Completed'],
      default: 'Planning',
    },
    imageUrl: String,
    imageHint: String,
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
