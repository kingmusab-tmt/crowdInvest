import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const communityId = params.id;

    // Fetch all users in this community
    const members = await User.find({
      community: communityId,
    })
      .select("name email status dateJoined role")
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
