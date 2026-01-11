import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../../utils/connectDB";
import Assistance from "../../../../../models/Assistance";
import User from "../../../../../models/User";
import { Types } from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

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

    // Resolve voterId to ObjectId (supports email fallback)
    let voterId: Types.ObjectId | null = null;
    if (typeof userId === "string" && Types.ObjectId.isValid(userId)) {
      voterId = new Types.ObjectId(userId);
    } else if (typeof userId === "string" && userId.includes("@")) {
      const user = await User.findOne({ email: userId });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      voterId = user._id as Types.ObjectId;
    } else {
      return NextResponse.json(
        { error: "Invalid userId for voting" },
        { status: 400 }
      );
    }

    // Remove existing vote from this user if any
    assistance.votes = assistance.votes.filter(
      (v: any) => v.userId?.toString() !== voterId!.toString()
    );

    // Add new vote
    assistance.votes.push({
      userId: voterId as any,
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
