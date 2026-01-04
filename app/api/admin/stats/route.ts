import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import Community from "@/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is a General Admin
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user details to check if they are a General Admin
    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "General Admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch statistics
    const totalUsers = await User.countDocuments();
    const totalCommunities = await Community.countDocuments();
    const activeCommunityAdmins = await User.countDocuments({
      role: "Community Admin",
    });

    const stats = {
      totalUsers,
      totalCommunities,
      activeCommunityAdmins,
      platformHealth: "Good",
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
