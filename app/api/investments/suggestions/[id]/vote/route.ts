import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../auth";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import User from "@/models/User";
import {
  notifyVotingClosedResults,
  resolveVotingOutcome,
} from "@/services/investmentSuggestionService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or missing request body" },
        { status: 400 }
      );
    }
    const { vote } = body; // "yes" or "no"

    if (!vote || !["yes", "no"].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote. Must be "yes" or "no"' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the suggestion
    const suggestion = await InvestmentSuggestion.findById(id);
    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Check if suggestion is in voting status
    if (suggestion.status !== "Voting" && suggestion.status !== "Approved") {
      return NextResponse.json(
        { error: "This suggestion is not open for voting" },
        { status: 400 }
      );
    }

    // Safety net: if the 3-day voting window has already passed but this
    // suggestion hasn't been swept yet (no one has loaded a list page
    // since it expired), resolve it now and reject the vote rather than
    // accepting one after the window closed.
    if (
      suggestion.status === "Voting" &&
      suggestion.votingDeadline &&
      suggestion.votingDeadline.getTime() <= Date.now()
    ) {
      const result = await resolveVotingOutcome(suggestion);
      await notifyVotingClosedResults([result]);

      return NextResponse.json(
        { error: "Voting has closed for this suggestion" },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVoteIndex = suggestion.votes?.findIndex(
      (v: any) => v.userId.toString() === user._id.toString()
    );

    if (existingVoteIndex !== undefined && existingVoteIndex >= 0) {
      // Update existing vote
      suggestion.votes[existingVoteIndex] = {
        userId: user._id,
        vote: vote,
        votedAt: new Date(),
      };
    } else {
      // Add new vote
      if (!suggestion.votes) {
        suggestion.votes = [];
      }
      suggestion.votes.push({
        userId: user._id,
        vote: vote,
        votedAt: new Date(),
      });
    }

    await suggestion.save();

    // Populate and return updated suggestion
    const updatedSuggestion = await InvestmentSuggestion.findById(id)
      .populate("suggestedBy", "name email avatarUrl")
      .populate("approvedBy", "name email")
      .populate("votes.userId", "name email");

    return NextResponse.json(updatedSuggestion, { status: 200 });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
