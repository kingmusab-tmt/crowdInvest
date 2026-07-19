import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import InvestmentSuggestion from "../../../../models/InvestmentSuggestion";
import { Types } from "mongoose";
import {
  closeExpiredVoting,
  notifyAdminsOfNewSuggestion,
  notifyVotingClosedResults,
} from "../../../../services/investmentSuggestionService";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Lazily resolve any suggestion whose 3-day voting window has passed
    // before returning the list, since this app has no cron infrastructure.
    const closed = await closeExpiredVoting();
    if (closed.length > 0) {
      await notifyVotingClosedResults(closed);
    }

    const searchParams = request.nextUrl.searchParams;
    const community =
      searchParams.get("community") || searchParams.get("communityId");

    const query: any = {};
    if (community) {
      // Convert string community ID to ObjectId
      if (Types.ObjectId.isValid(community)) {
        query.community = new Types.ObjectId(community);
      }
    }

    console.log("Suggestions query:", JSON.stringify(query));
    const suggestions = await InvestmentSuggestion.find(query)
      .populate("suggestedBy", "name email avatarUrl")
      .populate("approvedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    console.log("Found suggestions:", suggestions.length);
    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("Error fetching investment suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch investment suggestions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "community",
      "suggestedBy",
      "investmentType",
      "title",
      "description",
      "reason",
      "amountRequired",
      "timeframe",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const suggestion = new InvestmentSuggestion({
      ...body,
      status: body.status || "Pending",
    });

    await suggestion.save();

    // Populate the suggestedBy field
    await suggestion.populate("suggestedBy", "name email avatarUrl");

    // Notify all admins so they know to review it
    await notifyAdminsOfNewSuggestion(
      suggestion,
      (suggestion.suggestedBy as any)?.name || "A member"
    );

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error("Error creating investment suggestion:", error);
    return NextResponse.json(
      { error: "Failed to create investment suggestion" },
      { status: 400 }
    );
  }
}
