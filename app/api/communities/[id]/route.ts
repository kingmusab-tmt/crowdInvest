import connectDB from "@/utils/connectDB";
import Community from "@/models/Community";
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

    const community = await Community.findById(id)
      .populate("generalAdmin", "name email")
      .populate("communityAdmin", "name email")
      .select("-__v");

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(community, { status: 200 });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}
