import mongoose, { Schema, Model, Document } from "mongoose";

export interface IAuditLog extends Document {
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  category: "AUTH" | "ADMIN" | "USER" | "TRANSACTION" | "PROPERTY" | "SECURITY";
  status: "SUCCESS" | "FAILURE" | "WARNING";
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  targetUserId?: string;
  targetUserEmail?: string;
  resourceId?: string;
  resourceType?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    userName: String,
    userRole: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["AUTH", "ADMIN", "USER", "TRANSACTION", "PROPERTY", "SECURITY"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "WARNING"],
      required: true,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
    details: Schema.Types.Mixed,
    targetUserId: {
      type: String,
      index: true,
    },
    targetUserEmail: String,
    resourceId: String,
    resourceType: String,
    errorMessage: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, status: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 90 days (optional)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
