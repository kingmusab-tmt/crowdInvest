import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../../utils/connectDB";
import Proposal from "../../../../../models/Proposal";
import { Types } from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { vote, userId } = body;

    if (!vote || !["yes", "no"].includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote value" },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Add or update vote
    if (!proposal.votes) {
      proposal.votes = [];
    }

    // Remove existing vote from this user if any
    proposal.votes = proposal.votes.filter(
      (v: any) => v.userId?.toString() !== userId
    );

    // Add new vote
    proposal.votes.push({
      userId: userId as any,
      vote: vote as "yes" | "no",
      votedAt: new Date(),
    });

    await proposal.save();
    await proposal.populate("proposedBy", "name email");

    return NextResponse.json(proposal, { status: 200 });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
