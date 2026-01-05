import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid community ID" },
        { status: 400 }
      );
    }

    // Fetch all users in this community
    const members = await User.find({
      community: new Types.ObjectId(id),
    })
      .select("name email status dateJoined role kyc permissions")
      .lean();

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Fetch community members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch community members" },
      { status: 500 }
    );
  }
}
