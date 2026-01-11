import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get the current user's community
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!currentUser.community) {
      return NextResponse.json(
        { error: "You are not part of any community" },
        { status: 400 }
      );
    }

    // Fetch members from the same community
    // Only show members with public or community visibility
    const members = await User.find({
      community: currentUser.community,
      _id: { $ne: currentUser._id }, // Exclude current user
      $or: [
        { "settings.profileVisibility": "public" },
        { "settings.profileVisibility": "community" },
        { "settings.profileVisibility": { $exists: false } }, // Include users without visibility settings (default to community)
      ],
    })
      .select(
        "name email avatarUrl phoneNumber whatsappNumber placeOfWork address socialMedia dateJoined kyc.isVerified"
      )
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching community members:", error);
    return NextResponse.json(
      { error: "Failed to fetch community members" },
      { status: 500 }
    );
  }
}
