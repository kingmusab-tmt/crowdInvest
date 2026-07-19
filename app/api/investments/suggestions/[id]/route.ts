import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import User from "@/models/User";
import {
  getVotingDeadline,
  notifyMembersVotingOpen,
  notifySuggesterOfDecision,
} from "@/services/investmentSuggestionService";

// A creator may only edit/withdraw their own suggestion while it's still
// awaiting a decision. Once an admin has approved it (moved it to voting)
// or it has been finalized by vote, only an admin can touch it.
const CREATOR_EDITABLE_STATUSES = ["Pending", "Rejected"];

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
    const body = await request.json();

    const existing = await InvestmentSuggestion.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "Admin";
    const isCreator =
      existing.suggestedBy.toString() === currentUser._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "You don't have permission to edit this suggestion" },
        { status: 403 }
      );
    }

    // Approving/rejecting (deciding the suggestion) is an admin-only action
    const isDecision = body.status === "Approved" || body.status === "Rejected";
    if (isDecision && !isAdmin) {
      return NextResponse.json(
        { error: "Only an admin can approve or reject a suggestion" },
        { status: 403 }
      );
    }

    // A non-admin creator editing their own suggestion may only do so
    // before it has been decided on
    if (
      !isAdmin &&
      isCreator &&
      !CREATOR_EDITABLE_STATUSES.includes(existing.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This suggestion can no longer be edited — it has already been approved.",
        },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.status) updateData.status = body.status;

    // If updating full suggestion (edit & resubmit)
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.reason) updateData.reason = body.reason;
    if (body.amountRequired) updateData.amountRequired = body.amountRequired;
    if (body.timeframe) updateData.timeframe = body.timeframe;
    if (body.riskLevel) updateData.riskLevel = body.riskLevel;
    if (body.investmentType) updateData.investmentType = body.investmentType;
    if (body.expectedReturn !== undefined)
      updateData.expectedReturn = body.expectedReturn;
    if (body.rejectionReason !== undefined)
      updateData.rejectionReason = body.rejectionReason;

    // Admin approval sends the suggestion straight into a 3-day voting
    // window rather than a separate "Approved" holding state.
    let justApproved = false;
    if (isDecision && body.status === "Approved") {
      updateData.status = "Voting";
      updateData.approvedBy = currentUser._id;
      updateData.approvalDate = new Date();
      updateData.votingDeadline = getVotingDeadline();
      justApproved = true;
    }

    const suggestion = await InvestmentSuggestion.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("suggestedBy", "name email avatarUrl")
      .populate("approvedBy", "name email");

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (isDecision) {
      await notifySuggesterOfDecision(
        suggestion,
        justApproved,
        body.rejectionReason
      );
      if (justApproved) {
        await notifyMembersVotingOpen(suggestion);
      }
    }

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const suggestion = await InvestmentSuggestion.findById(id)
      .populate("suggestedBy", "name email avatarUrl")
      .populate("approvedBy", "name email")
      .select("-__v");

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Find the suggestion
    const suggestion = await InvestmentSuggestion.findById(id);
    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is the creator or an admin
    const isCreator = suggestion.suggestedBy.toString() === user._id.toString();
    const isAdmin = user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this suggestion" },
        { status: 403 }
      );
    }

    // A non-admin creator may only delete their suggestion before it has
    // been decided on — once approved, only an admin can remove it.
    if (
      !isAdmin &&
      isCreator &&
      !CREATOR_EDITABLE_STATUSES.includes(suggestion.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This suggestion can no longer be deleted — it has already been approved.",
        },
        { status: 403 }
      );
    }

    // Delete the suggestion
    await InvestmentSuggestion.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Suggestion deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { error: "Failed to delete suggestion" },
      { status: 500 }
    );
  }
}
