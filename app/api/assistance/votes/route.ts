import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Assistance from "../../../../models/Assistance";
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

    // Get assistance requests with votes
    const assistanceRequests = await Assistance.find(query)
      .populate("requestedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    // Transform to voting data
    const votingData = assistanceRequests
      .filter((a: any) => a.votes && a.votes.length > 0)
      .map((a: any) => {
        const assistVotes = a.votes?.filter((v: any) => v.vote === "assist").length || 0;
        const notAssistVotes = a.votes?.filter((v: any) => v.vote === "not-assist").length || 0;
        const totalVoters = a.votes?.length || 0;

        return {
          _id: a._id,
          assistanceId: a._id,
          title: a.title,
          assistVotes,
          notAssistVotes,
          totalVoters,
          status: a.status,
          community: a.community,
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
