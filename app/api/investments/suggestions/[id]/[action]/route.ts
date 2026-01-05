import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    await dbConnect();
    const { id, action } = params;
    const body = await request.json();

    const suggestion = await InvestmentSuggestion.findById(id);
    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      suggestion.status = "Voting";
      suggestion.approvedBy = body.adminId;
      suggestion.approvalDate = new Date();
    } else if (action === "reject") {
      suggestion.status = "Rejected";
      suggestion.rejectionReason = body.reason || "";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await suggestion.save();
    await suggestion.populate("suggestedBy", "name email avatarUrl");
    await suggestion.populate("approvedBy", "name email");

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error(`Error processing suggestion:`, error);
    return NextResponse.json(
      { error: "Failed to process suggestion" },
      { status: 500 }
    );
  }
}
