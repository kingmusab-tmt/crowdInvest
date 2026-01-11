import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Proposal from "../../../../models/Proposal";
import User from "../../../../models/User";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id)
      .populate("proposedBy", "name email")
      .select("-__v");

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal, { status: 200 });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // If proposedBy is provided as an email, convert to user ObjectId
    if (
      body.proposedBy &&
      typeof body.proposedBy === "string" &&
      body.proposedBy.includes("@")
    ) {
      const user = await User.findOne({ email: body.proposedBy });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      body.proposedBy = user._id;
    }

    const proposal = await Proposal.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("proposedBy", "name email")
      .select("-__v");

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal, { status: 200 });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findByIdAndDelete(id);

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Proposal deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
