import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import User from "@/models/User";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      status: body.status,
    };

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
    const isAdmin =
      user.role === "General Admin" || user.role === "Community Admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this suggestion" },
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
