import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      community,
      profileImageUrl,
      name,
      dateOfBirth,
      placeOfWork,
      address,
      phoneNumber,
      socialMedia,
      maritalStatus,
      nextOfKin,
      termsAccepted,
      privacyAccepted,
    } = await req.json();

    // Validate required fields
    if (!community || !name || !dateOfBirth || !phoneNumber) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: "You must accept the terms and privacy policy" },
        { status: 400 }
      );
    }

    // Update user profile
    user.name = name;
    user.community = community;
    if (profileImageUrl) {
      user.avatarUrl = profileImageUrl;
    }
    user.dateOfBirth = dateOfBirth;
    user.placeOfWork = placeOfWork;
    user.address = address;
    user.phoneNumber = phoneNumber;
    user.socialMedia = socialMedia;
    user.maritalStatus = maritalStatus;
    user.nextOfKin = nextOfKin;
    user.termsAccepted = termsAccepted;
    user.privacyAccepted = privacyAccepted;
    user.profileCompleted = true;

    await user.save();

    // Update community member count
    const Community = (await import("@/models/Community")).default;
    await Community.findByIdAndUpdate(community, {
      $inc: { memberCount: 1 },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
