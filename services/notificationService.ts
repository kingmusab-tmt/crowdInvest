import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendEmail } from "@/utils/emailService";
import mongoose from "mongoose";

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type:
    | "kyc_verified"
    | "kyc_rejected"
    | "investment"
    | "withdrawal"
    | "proposal"
    | "event"
    | "announcement"
    | "contribution"
    | "general";
  title: string;
  message: string;
  relatedData?: Record<string, any>;
  actionUrl?: string;
}

/**
 * Creates a notification and optionally sends an email based on user preferences
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    const { userId, type, title, message, relatedData, actionUrl } = params;

    // Fetch user with settings
    const user = await User.findById(userId).select(
      "name email settings.notifications"
    );

    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    const notificationSettings = user.settings?.notifications || {
      inApp: true,
      email: true,
      emailPreferences: {
        announcements: true,
        investments: true,
        withdrawals: true,
        kyc: true,
        proposals: true,
        events: true,
      },
    };

    // Create in-app notification if enabled
    if (notificationSettings.inApp !== false) {
      await Notification.create({
        userId,
        type,
        title,
        message,
        relatedData,
        actionUrl,
        read: false,
      });
    }

    // Send email notification if enabled
    if (notificationSettings.email !== false) {
      const shouldSendEmail = shouldSendEmailForType(
        type,
        notificationSettings.emailPreferences
      );

      if (shouldSendEmail) {
        await sendNotificationEmail({
          to: user.email,
          name: user.name,
          title,
          message,
          actionUrl,
          type,
        });
      }
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Determines if email should be sent based on notification type and user preferences
 */
function shouldSendEmailForType(type: string, emailPreferences: any): boolean {
  const typeMapping: Record<string, string> = {
    kyc_verified: "kyc",
    kyc_rejected: "kyc",
    investment: "investments",
    withdrawal: "withdrawals",
    proposal: "proposals",
    event: "events",
    announcement: "announcements",
  };

  const prefKey = typeMapping[type];
  if (!prefKey) return true; // Send by default for unknown types

  // If emailPreferences is undefined or null, send email by default
  if (!emailPreferences) return true;

  return emailPreferences[prefKey] !== false;
}

/**
 * Sends an email notification to the user
 */
async function sendNotificationEmail(params: {
  to: string;
  name: string;
  title: string;
  message: string;
  actionUrl?: string;
  type: string;
}): Promise<void> {
  const { to, name, title, message, actionUrl, type } = params;

  const emailSubject = `CrowdInvest: ${title}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .notification-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
          }
          .badge-kyc-verified, .badge-kyc-rejected { background: #e3f2fd; color: #1976d2; }
          .badge-investment { background: #e8f5e9; color: #388e3c; }
          .badge-withdrawal { background: #fff3e0; color: #f57c00; }
          .badge-proposal { background: #f3e5f5; color: #7b1fa2; }
          .badge-event { background: #fce4ec; color: #c2185b; }
          .badge-announcement { background: #e0f2f1; color: #00796b; }
          .badge-general { background: #f5f5f5; color: #616161; }
          .message-box {
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .message-box h2 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #333;
          }
          .message-box p {
            margin: 0;
            color: #666;
          }
          .action-button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 CrowdInvest Notification</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <span class="notification-badge badge-${type.replace(
              "_",
              "-"
            )}">${getNotificationTypeLabel(type)}</span>
            
            <div class="message-box">
              <h2>${title}</h2>
              <p>${message}</p>
            </div>

            ${
              actionUrl
                ? `<a href="${
                    process.env.NEXTAUTH_URL || ""
                  }${actionUrl}" class="action-button">View Details</a>`
                : ""
            }

            <p style="margin-top: 20px; color: #666;">
              You can view all your notifications in your dashboard. If you wish to change your notification preferences, 
              visit your settings page.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CrowdInvest. All rights reserved.</p>
            <p>
              <a href="${
                process.env.NEXTAUTH_URL || ""
              }/dashboard/settings">Notification Settings</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: emailSubject,
    html: emailHtml,
  });
}

/**
 * Get human-readable label for notification type
 */
function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    kyc_verified: "KYC Verified",
    kyc_rejected: "KYC Rejected",
    investment: "Investment",
    withdrawal: "Withdrawal",
    proposal: "Proposal",
    event: "Event",
    announcement: "Announcement",
    general: "General",
  };
  return labels[type] || "Notification";
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string | mongoose.Types.ObjectId
): Promise<void> {
  await Notification.findByIdAndUpdate(notificationId, {
    read: true,
    readAt: new Date(),
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string | mongoose.Types.ObjectId
): Promise<void> {
  await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: string | mongoose.Types.ObjectId
): Promise<number> {
  return await Notification.countDocuments({ userId, read: false });
}

/**
 * Delete old notifications (older than 90 days)
 */
export async function cleanupOldNotifications(): Promise<void> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await Notification.deleteMany({
    createdAt: { $lt: ninetyDaysAgo },
    read: true,
  });
}
