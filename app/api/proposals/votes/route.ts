import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Proposal from "../../../../models/Proposal";
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

    // Get proposals with votes
    const proposals = await Proposal.find(query)
      .populate("proposedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    // Transform to voting data
    const votingData = proposals
      .filter((p: any) => p.votes && p.votes.length > 0)
      .map((p: any) => {
        const yesVotes =
          p.votes?.filter((v: any) => v.vote === "yes").length || 0;
        const noVotes =
          p.votes?.filter((v: any) => v.vote === "no").length || 0;
        const totalVoters = p.votes?.length || 0;

        return {
          _id: p._id,
          proposalId: p._id,
          title: p.title,
          yesVotes,
          noVotes,
          totalVoters,
          status: p.status,
          community: p.community,
        };
      });

    return NextResponse.json(votingData, { status: 200 });
  } catch (error) {
    console.error("Error fetching voting data:", error);
    return NextResponse.json(
      { error: "Failed to fetch voting data" },
      { status: 500 }
    );
  }
}
