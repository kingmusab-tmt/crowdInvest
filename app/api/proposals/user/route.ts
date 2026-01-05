import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Proposal from "../../../../models/Proposal";
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

    const proposals = await Proposal.find(query)
      .populate("proposedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    // Filter to only user's proposals
    const userProposals = email
      ? proposals.filter(
          (p: any) =>
            p.proposedBy?.email === email || p.proposedBy?.toString() === email
        )
      : [];

    return NextResponse.json(userProposals, { status: 200 });
  } catch (error) {
    console.error("Error fetching user proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch user proposals" },
      { status: 500 }
    );
  }
}
