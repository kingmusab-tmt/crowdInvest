import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import { authOptions } from "@/app/auth";
import { createNotification } from "@/services/notificationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can send notifications" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { target, userId, title, message } = await request.json();

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    if (target !== "all" && target !== "individual") {
      return NextResponse.json(
        { error: "target must be 'all' or 'individual'" },
        { status: 400 }
      );
    }

    let recipients: { _id: unknown }[];

    if (target === "individual") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required for individual notifications" },
          { status: 400 }
        );
      }
      const recipient = await User.findById(userId).select("_id");
      if (!recipient) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      recipients = [recipient];
    } else {
      // Broadcast to every active member on the platform, excluding the
      // admin sending it.
      recipients = await User.find({
        status: "Active",
        _id: { $ne: session.user.id },
      }).select("_id");
    }

    for (const recipient of recipients) {
      await createNotification({
        userId: recipient._id as string,
        type: "announcement",
        title: title.trim(),
        message: message.trim(),
      });
    }

    return NextResponse.json(
      {
        message:
          target === "all"
            ? `Notification sent to ${recipients.length} member(s)`
            : "Notification sent",
        recipientCount: recipients.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
