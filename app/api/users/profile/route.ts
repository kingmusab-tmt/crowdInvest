import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import { authOptions } from "@/app/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select(
      "name email avatarUrl dateOfBirth phoneNumber placeOfWork maritalStatus address socialMedia nextOfKin kyc settings"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const placeOfWork = formData.get("placeOfWork") as string;
    const maritalStatus = formData.get("maritalStatus") as string;
    const address = formData.get("address") as string;
    const socialMedia = formData.get("socialMedia") as string;
    const nextOfKin = formData.get("nextOfKin") as string;
    const avatarFile = formData.get("avatar") as File | null;

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update profile fields
    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (placeOfWork) user.placeOfWork = placeOfWork;
    if (maritalStatus) user.maritalStatus = maritalStatus;
    if (address) user.address = JSON.parse(address);
    if (socialMedia) user.socialMedia = JSON.parse(socialMedia);
    if (nextOfKin) user.nextOfKin = JSON.parse(nextOfKin);

    // Handle avatar file upload
    if (avatarFile) {
      const buffer = await avatarFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      user.avatarUrl = `data:${avatarFile.type};base64,${base64}`;
    }

    // If this is a resubmission after rejection, reset the rejection fields
    if (
      user.kyc?.rejectionReason &&
      (name ||
        dateOfBirth ||
        phoneNumber ||
        placeOfWork ||
        maritalStatus ||
        address)
    ) {
      user.kyc.rejectionReason = undefined;
      user.kyc.rejectionDate = undefined;
      user.kyc.isVerified = false;
      user.kyc.submittedAt = new Date();
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          kyc: user.kyc,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
