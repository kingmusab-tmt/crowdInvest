import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

interface AuditLogParams {
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

interface AuditLogEntry extends AuditLogParams {
  timestamp: string;
  _id: string;
}

/**
 * Get the logs directory path
 */
function getLogsDirectory(): string {
  const logsDir = path.join(process.cwd(), "logs", "audit");

  try {
    // Ensure directory exists - use synchronous API
    if (!fs.existsSync(logsDir)) {
      console.log("📁 [AUDIT LOGGER] Creating logs directory:", logsDir);
      fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
      console.log("✅ [AUDIT LOGGER] Logs directory created successfully");
    }
  } catch (err) {
    console.error("❌ [AUDIT LOGGER] Failed to create logs directory:", err);
    console.error("Attempted path:", logsDir);
    console.error("Current working directory:", process.cwd());
  }

  return logsDir;
}

/**
 * Get the log file path for a specific date
 */
function getLogFilePath(date: Date = new Date()): string {
  const logsDir = getLogsDirectory();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(logsDir, `audit-${dateStr}.log`);
}

/**
 * Generate a unique ID for log entry
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log an audit event to file
 * @param params Audit log parameters
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const logEntry: AuditLogEntry = {
      _id: generateId(),
      timestamp: new Date().toISOString(),
      ...params,
    };

    const logLine = JSON.stringify(logEntry) + "\n";
    const filePath = getLogFilePath();

    console.log("📝 [AUDIT LOG] About to write to:", filePath);

    // Append to log file synchronously
    try {
      fs.appendFileSync(filePath, logLine, "utf8");
    } catch (writeErr) {
      console.error("❌ [AUDIT LOG] Failed to write to file:", writeErr);
      console.error("File path:", filePath);
      throw writeErr;
    }

    // Log to console for testing
    console.log("✅ [AUDIT LOG] New entry logged:", {
      id: logEntry._id,
      timestamp: logEntry.timestamp,
      action: logEntry.action,
      category: logEntry.category,
      status: logEntry.status,
      userEmail: logEntry.userEmail,
      filePath: filePath,
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    // Log to console for debugging
    console.error("❌ [AUDIT LOG ERROR] Audit logging failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  }
}

/**
 * Extract IP address from Next.js request
 */
export function getIpAddress(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Extract user agent from Next.js request
 */
export function getUserAgent(req: NextRequest): string | undefined {
  return req.headers.get("user-agent") || undefined;
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  reason: string,
  req?: NextRequest
): Promise<void> {
  console.log("🔒 [LOGIN FAILED] Logging failed login attempt:", {
    email,
    reason,
  });
  await logAudit({
    userEmail: email,
    action: "LOGIN_FAILED",
    category: "AUTH",
    status: "FAILURE",
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
    errorMessage: reason,
    details: { attemptedEmail: email },
  });
}

/**
 * Log successful login
 */
export async function logSuccessfulLogin(
  userId: string,
  email: string,
  name: string,
  role: string,
  req?: NextRequest
): Promise<void> {
  console.log("✅ [LOGIN SUCCESS] Logging successful login:", {
    userId,
    email,
    name,
    role,
  });
  await logAudit({
    userId,
    userEmail: email,
    userName: name,
    userRole: role,
    action: "LOGIN_SUCCESS",
    category: "AUTH",
    status: "SUCCESS",
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log password reset request
 */
export async function logPasswordResetRequest(
  email: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userEmail: email,
    action: "PASSWORD_RESET_REQUESTED",
    category: "AUTH",
    status: "SUCCESS",
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log password reset completion
 */
export async function logPasswordResetComplete(
  email: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userEmail: email,
    action: "PASSWORD_RESET_COMPLETED",
    category: "AUTH",
    status: "SUCCESS",
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  adminEmail: string,
  adminName: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  targetUserEmail?: string,
  details?: Record<string, any>,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userId: adminUserId,
    userEmail: adminEmail,
    userName: adminName,
    userRole: "Admin",
    action,
    category: "ADMIN",
    status: "SUCCESS",
    resourceType,
    resourceId,
    targetUserEmail,
    details,
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log sensitive data access
 */
export async function logSensitiveDataAccess(
  userId: string,
  userEmail: string,
  dataType: string,
  targetUserId?: string,
  targetUserEmail?: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action: `ACCESS_${dataType.toUpperCase()}`,
    category: "SECURITY",
    status: "SUCCESS",
    targetUserId,
    targetUserEmail,
    resourceType: dataType,
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log transaction modification
 */
export async function logTransactionModification(
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string,
  action: string,
  transactionId: string,
  previousStatus?: string,
  newStatus?: string,
  details?: Record<string, any>,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    userName,
    userRole,
    action,
    category: "TRANSACTION",
    status: "SUCCESS",
    resourceType: "Transaction",
    resourceId: transactionId,
    details: {
      ...details,
      previousStatus,
      newStatus,
    },
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  endpoint: string,
  userId?: string,
  userEmail?: string,
  userRole?: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    userRole,
    action: "UNAUTHORIZED_ACCESS_ATTEMPT",
    category: "SECURITY",
    status: "FAILURE",
    details: { endpoint },
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log user registration
 */
export async function logUserRegistration(
  email: string,
  name: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userEmail: email,
    userName: name,
    action: "USER_REGISTERED",
    category: "AUTH",
    status: "SUCCESS",
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}

/**
 * Log property withdrawal request
 */
export async function logPropertyWithdrawal(
  userId: string,
  userEmail: string,
  propertyId: string,
  reason: string,
  req?: NextRequest
): Promise<void> {
  await logAudit({
    userId,
    userEmail,
    action: "PROPERTY_WITHDRAWAL_REQUESTED",
    category: "PROPERTY",
    status: "SUCCESS",
    resourceType: "Property",
    resourceId: propertyId,
    details: { withdrawalReason: reason },
    ipAddress: req ? getIpAddress(req) : undefined,
    userAgent: req ? getUserAgent(req) : undefined,
  });
}
