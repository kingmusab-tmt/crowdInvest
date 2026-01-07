import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { authOptions } from "@/app/auth";
import { createNotification } from "@/services/notificationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the logged-in user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.community) {
      return NextResponse.json(
        { message: "User has no community" },
        { status: 200 }
      );
    }

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Calculate notification period
    // Start from 25th of current month until 10th of next month
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dueDate = new Date(nextMonthYear, nextMonth, 10);

    // Check if we're in the notification period (25th of current month to 10th of next)
    const startNotificationDate = new Date(currentYear, currentMonth, 25);
    const isInNotificationPeriod =
      (now >= startNotificationDate && currentDay >= 25) ||
      (currentDay <= 10 && currentMonth === nextMonth);

    // Also send notification at the start of a new month (1st to 3rd)
    const isStartOfMonth = currentDay >= 1 && currentDay <= 3;

    if (!isInNotificationPeriod && !isStartOfMonth) {
      return NextResponse.json(
        { message: "Not in notification period" },
        { status: 200 }
      );
    }

    // Get all members of the same community
    const communityMembers = await User.find({
      community: currentUser.community,
      status: "Active",
    });

    // Check which members have contributed this month
    const contributionMonth =
      currentDay <= 10 ? currentMonth - 1 : currentMonth;
    const contributionYear =
      currentDay <= 10 && currentMonth === 0 ? currentYear - 1 : currentYear;

    const notificationsSent: string[] = [];

    for (const member of communityMembers) {
      // Check if member has contributed for the current billing cycle
      const memberContribution = await Transaction.findOne({
        userEmail: member.email,
        type: "Deposit",
        status: "Completed",
        date: {
          $gte: new Date(contributionYear, contributionMonth, 1),
          $lte: new Date(
            contributionYear,
            contributionMonth + 1,
            0,
            23,
            59,
            59
          ),
        },
      });

      // Skip if member has already contributed
      if (memberContribution) {
        continue;
      }

      // Check if we've already sent a notification this month
      const existingNotification = await Notification.findOne({
        userId: member._id,
        type: "announcement",
        title: { $regex: /monthly contribution/i },
        createdAt: {
          $gte: new Date(currentYear, currentMonth, 1),
        },
      });

      // Only send notification once per day to avoid spam
      if (existingNotification) {
        const lastNotificationDate = new Date(existingNotification.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastNotificationDate.setHours(0, 0, 0, 0);

        if (lastNotificationDate.getTime() === today.getTime()) {
          continue; // Already sent today
        }
      }

      // Determine notification message based on date
      let title = "";
      let message = "";

      if (isStartOfMonth) {
        title = "New Month - Monthly Contribution Reminder";
        message = `Hello ${
          member.name
        }, a new month has started! Please remember to make your monthly contribution. The due date is ${dueDate.toLocaleDateString()}. Your contributions help strengthen our community investment pool.`;
      } else if (currentDay >= 25 || currentDay <= 10) {
        const daysRemaining = Math.max(
          0,
          Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        title = "Monthly Contribution Reminder";
        message = `Hello ${
          member.name
        }, this is a reminder to make your monthly contribution. ${
          daysRemaining > 0
            ? `You have ${daysRemaining} day(s) remaining until the due date (${dueDate.toLocaleDateString()}).`
            : `The due date was ${dueDate.toLocaleDateString()}. Please contribute as soon as possible.`
        }`;
      }

      // Create notification
      await createNotification({
        userId: member._id,
        type: "announcement",
        title,
        message,
        actionUrl: "/dashboard/funds?tab=deposit",
      });

      notificationsSent.push(member.email);
    }

    return NextResponse.json(
      {
        message: `Notifications sent to ${notificationsSent.length} member(s)`,
        recipients: notificationsSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking monthly contributions:", error);
    return NextResponse.json(
      {
        error: "Failed to check monthly contributions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
