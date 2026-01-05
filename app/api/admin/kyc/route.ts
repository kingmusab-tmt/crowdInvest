import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import "@/models/Community"; // Ensure Community schema is registered for populate
import { authOptions } from "@/app/auth";
import { createNotification } from "@/services/notificationService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Community Admin and General Admin can view KYC
    if (
      session.user.role !== "Community Admin" &&
      session.user.role !== "General Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can view KYC requests" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get current user with community info
    const currentUser = await User.findById(session.user.id).populate(
      "community"
    );
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on admin type
    const query: any = {
      profileCompleted: true,
    };

    // Community Admin only sees KYC from their own community
    if (session.user.role === "Community Admin") {
      query.community = currentUser.community?._id;
    }
    // General Admin sees all communities

    // Get all users matching the query with KYC info
    const users = await User.find(query)
      .populate("community", "name")
      .select(
        "name email avatarUrl dateOfBirth placeOfWork address phoneNumber socialMedia maritalStatus nextOfKin dateJoined community profileCompleted kyc status"
      )
      .sort({ dateJoined: -1 });

    // Format response with complete profile details
    const kycRequests = users.map((user: any) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || (user as any).image,
      community: user.community?.name || "N/A",
      communityId: user.community?._id,
      dateJoined: user.dateJoined,
      status: user.status,
      profile: {
        dateOfBirth: user.dateOfBirth,
        placeOfWork: user.placeOfWork,
        phoneNumber: user.phoneNumber,
        address: user.address,
        socialMedia: user.socialMedia,
        maritalStatus: user.maritalStatus,
        nextOfKin: user.nextOfKin,
      },
      kyc: {
        isVerified: user.kyc?.isVerified || false,
        submittedAt: user.kyc?.submittedAt,
        verifiedAt: user.kyc?.verifiedAt,
        verificationNotes: user.kyc?.verificationNotes,
        rejectionReason: user.kyc?.rejectionReason,
        rejectionDate: user.kyc?.rejectionDate,
        idType: user.kyc?.idType,
        idNumber: user.kyc?.idNumber,
      },
    }));

    return NextResponse.json(kycRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching KYC requests:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch KYC requests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can verify KYC
    if (
      session.user.role !== "Community Admin" &&
      session.user.role !== "General Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can verify KYC" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { userId, isVerified, verificationNotes, rejectionReason } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Rejection requires a reason
    if (!isVerified && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get the user to be verified
    const targetUser = await User.findById(userId).populate("community");

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current admin
    const currentUser = await User.findById(session.user.id).populate(
      "community"
    );

    // Community Admin can only verify users from their own community
    if (
      session.user.role === "Community Admin" &&
      currentUser?.community?._id.toString() !==
        targetUser.community?._id.toString()
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Community admin can only verify users from their own community",
        },
        { status: 403 }
      );
    }

    // Build KYC update payload explicitly and persist with $set to avoid any partial save issues
    const kycUpdate = {
      isVerified: Boolean(isVerified),
      verifiedAt: isVerified ? new Date() : undefined,
      verifiedBy: isVerified ? (session.user.id as any) : undefined,
      verificationNotes: isVerified ? verificationNotes : undefined,
      rejectionReason: !isVerified ? rejectionReason : undefined,
      rejectionDate: !isVerified ? new Date() : undefined,
      idType: targetUser.kyc?.idType,
      idNumber: targetUser.kyc?.idNumber,
      submittedAt: targetUser.kyc?.submittedAt || new Date(),
    } as const;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { kyc: kycUpdate } },
      { new: true }
    ).populate("community");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      );
    }

    // Create notification for user using notification service
    if (isVerified) {
      // Verification approved notification
      await createNotification({
        userId: updatedUser._id,
        type: "kyc_verified",
        title: "KYC Verification Approved",
        message: `Your KYC verification has been approved. You now have full access to all community features.`,
        actionUrl: "/dashboard/settings",
      });
    } else {
      // Rejection notification
      await createNotification({
        userId: updatedUser._id,
        type: "kyc_rejected",
        title: "KYC Verification Rejected",
        message: `Your KYC verification was rejected. Please review the reason and update your information in your dashboard settings.`,
        relatedData: {
          kycRejectionReason: rejectionReason,
        },
        actionUrl: "/dashboard/settings",
      });
    }

    return NextResponse.json(
      {
        message: isVerified
          ? "User KYC verified successfully"
          : "User KYC rejected and notification sent",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          kyc: updatedUser.kyc,
        },
        notificationSent: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying KYC:", error);
    return NextResponse.json(
      {
        error: "Failed to verify KYC",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
