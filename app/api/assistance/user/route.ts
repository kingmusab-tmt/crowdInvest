import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Assistance from "../../../../models/Assistance";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");
    const email = searchParams.get("email");

    const query: any = {};

    if (community && Types.ObjectId.isValid(community)) {
      query.community = new Types.ObjectId(community);
    }

    const assistance = await Assistance.find(query)
      .populate("requestedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    // Filter to only user's requests
    const userRequests = email
      ? assistance.filter(
          (a: any) =>
            a.requestedBy?.email === email ||
            a.requestedBy?.toString() === email
        )
      : [];

    return NextResponse.json(userRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching user assistance requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch user assistance requests" },
      { status: 500 }
    );
  }
}
