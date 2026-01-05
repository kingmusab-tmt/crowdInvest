import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import { authOptions } from "@/app/auth";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { notifications } = await request.json();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update notification settings
    if (notifications) {
      user.settings = {
        ...user.settings,
        notifications: {
          inApp: notifications.inApp ?? true,
          email: notifications.email ?? true,
          emailPreferences: {
            announcements: notifications.emailPreferences?.announcements ?? true,
            investments: notifications.emailPreferences?.investments ?? true,
            withdrawals: notifications.emailPreferences?.withdrawals ?? true,
            kyc: notifications.emailPreferences?.kyc ?? true,
            proposals: notifications.emailPreferences?.proposals ?? true,
            events: notifications.emailPreferences?.events ?? true,
          },
        },
      };
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Settings updated successfully",
        settings: user.settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
