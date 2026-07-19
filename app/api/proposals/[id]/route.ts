import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth";
import dbConnect from "../../../../utils/connectDB";
import Proposal from "../../../../models/Proposal";
import User from "../../../../models/User";
import { Types } from "mongoose";
import {
  getProposalVotingDeadline,
  notifyMembersProposalVotingOpen,
  notifyProposerOfDecision,
} from "../../../../services/proposalVotingService";

// A creator may only edit/withdraw their own proposal while it's still
// awaiting a decision. Once an admin has approved it (moved it to voting)
// or it has been finalized by vote, only an admin can touch it.
const CREATOR_EDITABLE_STATUSES = ["pending", "rejected"];

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
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existing = await Proposal.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "Admin";
    const isCreator =
      existing.proposedBy.toString() === currentUser._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to edit this proposal" },
        { status: 403 }
      );
    }

    // Approving/rejecting (deciding the proposal) is an admin-only action
    const isDecision = body.status === "approved" || body.status === "rejected";
    if (isDecision && !isAdmin) {
      return NextResponse.json(
        { error: "Only an admin can approve or reject a proposal" },
        { status: 403 }
      );
    }

    // A non-admin creator editing their own proposal may only do so before
    // it has been decided on
    if (
      !isAdmin &&
      isCreator &&
      !CREATOR_EDITABLE_STATUSES.includes(existing.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This proposal can no longer be edited — it has already been approved.",
        },
        { status: 403 }
      );
    }

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

    const updateData: any = { ...body };

    // Admin approval sends the proposal straight into a 3-day voting window
    // rather than a separate "approved" holding state.
    let justApproved = false;
    if (isDecision && body.status === "approved") {
      updateData.status = "voting";
      updateData.approvedBy = currentUser._id;
      updateData.approvalDate = new Date();
      updateData.votingDeadline = getProposalVotingDeadline();
      justApproved = true;
    }

    const proposal = await Proposal.findByIdAndUpdate(id, updateData, {
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

    if (isDecision) {
      await notifyProposerOfDecision(proposal, justApproved, body.rejectionReason);
      if (justApproved) {
        await notifyMembersProposalVotingOpen(proposal);
      }
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
