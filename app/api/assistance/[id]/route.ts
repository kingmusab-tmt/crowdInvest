import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth";
import dbConnect from "../../../../utils/connectDB";
import Assistance from "../../../../models/Assistance";
import User from "../../../../models/User";
import { Types } from "mongoose";
import {
  getAssistanceVotingDeadline,
  notifyMembersAssistanceVotingOpen,
  notifyRequesterOfDecision,
} from "../../../../services/assistanceVotingService";

// A creator may only edit/withdraw their own request while it's still
// awaiting a decision. Once an admin has approved it (moved it to voting)
// or it has been finalized by vote, only an admin can touch it.
const CREATOR_EDITABLE_STATUSES = ["Pending", "Rejected"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const assistance = await Assistance.findById(id)
      .populate("requestedBy", "name email")
      .select("-__v");

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error fetching assistance request:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistance request" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existing = await Assistance.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "Admin";
    const isCreator =
      existing.requestedBy.toString() === currentUser._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to edit this request" },
        { status: 403 }
      );
    }

    // Approving/rejecting (deciding the request) is an admin-only action
    const isDecision = body.status === "Approved" || body.status === "Rejected";
    if (isDecision && !isAdmin) {
      return NextResponse.json(
        { error: "Only an admin can approve or reject a request" },
        { status: 403 }
      );
    }

    // A non-admin creator editing their own request may only do so before
    // it has been decided on
    if (
      !isAdmin &&
      isCreator &&
      !CREATOR_EDITABLE_STATUSES.includes(existing.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This request can no longer be edited — it has already been approved.",
        },
        { status: 403 }
      );
    }

    // If requestedBy is provided as an email, convert to user ObjectId
    if (
      body.requestedBy &&
      typeof body.requestedBy === "string" &&
      body.requestedBy.includes("@")
    ) {
      const user = await User.findOne({ email: body.requestedBy });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      body.requestedBy = user._id;
    }

    const updateData: any = { ...body };

    // Admin approval sends the request straight into a 3-day voting window
    // rather than a separate "Approved" holding state.
    let justApproved = false;
    if (isDecision && body.status === "Approved") {
      updateData.status = "Voting";
      updateData.approvedBy = currentUser._id;
      updateData.approvalDate = new Date();
      updateData.votingDeadline = getAssistanceVotingDeadline();
      justApproved = true;
    }

    const assistance = await Assistance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("requestedBy", "name email")
      .select("-__v");

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    if (isDecision) {
      await notifyRequesterOfDecision(
        assistance,
        justApproved,
        body.rejectionReason
      );
      if (justApproved) {
        await notifyMembersAssistanceVotingOpen(assistance);
      }
    }

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error updating assistance request:", error);
    return NextResponse.json(
      { error: "Failed to update assistance request" },
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
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const assistance = await Assistance.findByIdAndDelete(id);

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Assistance request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting assistance request:", error);
    return NextResponse.json(
      { error: "Failed to delete assistance request" },
      { status: 500 }
    );
  }
}
