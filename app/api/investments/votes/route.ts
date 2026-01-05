import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");

    const query: any = { status: { $in: ["Voting", "Approved"] } };
    if (community) {
      // Convert string community ID to ObjectId
      if (Types.ObjectId.isValid(community)) {
        query.community = new Types.ObjectId(community);
      }
    }

    console.log("Votes query:", JSON.stringify(query));
    const suggestions = await InvestmentSuggestion.find(query)
      .populate("suggestedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    // Format voting data
    const votes = suggestions.map((suggestion: any) => {
      const votes = suggestion.votes || [];
      const yesVotes = votes.filter((v: any) => v.vote === "yes").length;
      const noVotes = votes.filter((v: any) => v.vote === "no").length;

      return {
        _id: suggestion._id,
        suggestionId: suggestion._id,
        title: suggestion.title,
        yesVotes,
        noVotes,
        totalVoters: votes.length,
        status: suggestion.status,
        community: suggestion.community,
      };
    });

    console.log("Found votes:", votes.length);
    return NextResponse.json(votes, { status: 200 });
  } catch (error) {
    console.error("Error fetching voting data:", error);
    return NextResponse.json(
      { error: "Failed to fetch voting data" },
      { status: 500 }
    );
  }
}
