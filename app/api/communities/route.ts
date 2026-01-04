import connectDB from "@/utils/connectDB";
import Community from "@/models/Community";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectDB();
    const communities = await Community.find({})
      .populate("generalAdmin", "name email")
      .populate("communityAdmin", "name email")
      .select("-__v")
      .sort({ name: 1 });
    return NextResponse.json(communities, { status: 200 });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
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

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "General Admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, enabledFunctions } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    const community = await Community.create({
      name,
      description,
      generalAdmin: user._id,
      status: "Active",
      enabledFunctions: enabledFunctions || {
        investments: true,
        proposals: true,
        events: true,
        assistance: true,
        kyc: true,
        withdrawals: true,
      },
      memberCount: 0,
    });

    const populatedCommunity = await community.populate(
      "generalAdmin",
      "name email"
    );

    return NextResponse.json(populatedCommunity, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 400 }
    );
  }
}
