import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../../utils/connectDB";
import Assistance from "../../../../../models/Assistance";
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
        { error: "Invalid assistance ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { vote, userId } = body;

    if (!vote || !["assist", "not-assist"].includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote value" },
        { status: 400 }
      );
    }

    const assistance = await Assistance.findById(id);

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    // Add or update vote
    if (!assistance.votes) {
      assistance.votes = [];
    }

    // Remove existing vote from this user if any
    assistance.votes = assistance.votes.filter(
      (v: any) => v.userId?.toString() !== userId
    );

    // Add new vote
    assistance.votes.push({
      userId: userId as any,
      vote: vote as "assist" | "not-assist",
      votedAt: new Date(),
    });

    await assistance.save();
    await assistance.populate("requestedBy", "name email");

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
