import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Proposal from "../../../models/Proposal";
import User from "../../../models/User";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");

    const query: any = {};
    if (community && Types.ObjectId.isValid(community)) {
      query.community = new Types.ObjectId(community);
    }

    const proposals = await Proposal.find(query)
      .populate("proposedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    return NextResponse.json(proposals, { status: 200 });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    if (!body.community || !body.title || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert email to user ID if proposedBy is an email
    let proposedById = body.proposedBy;
    if (
      body.proposedBy &&
      typeof body.proposedBy === "string" &&
      body.proposedBy.includes("@")
    ) {
      const user = await User.findOne({ email: body.proposedBy });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      proposedById = user._id;
    }

    const proposal: any = new Proposal({
      ...body,
      proposedBy: proposedById,
      status: body.status || "pending",
    });

    await proposal.save();
    await proposal.populate("proposedBy", "name email");

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 400 }
    );
  }
}
