import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has any active investments or pending transactions
    // In a real scenario, you'd want to check these conditions
    // For now, we'll just create a notification for admin review

    // Create a notification for administrators to review the deletion request
    const admins = await User.find({ role: "Admin" });

    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: "announcement",
        title: "Account Deletion Request",
        message: `User ${user.name} (${user.email}) has requested account deletion. Please review and process this request.`,
        actionUrl: `/admin/users?user=${user._id.toString()}`,
        relatedData: {
          userId: user._id,
          userEmail: user.email,
          requestDate: new Date(),
        },
      });
    }

    // You could also set a flag on the user account indicating deletion request
    user.status = "Restricted";
    await user.save();

    return NextResponse.json({
      message:
        "Account deletion request submitted successfully. An administrator will review your request shortly.",
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    return NextResponse.json(
      { error: "Failed to submit deletion request" },
      { status: 500 }
    );
  }
}
