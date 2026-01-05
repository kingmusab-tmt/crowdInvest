import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const suggestion = await InvestmentSuggestion.findById(id);
    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    suggestion.status = "Voting";
    suggestion.approvedBy = body.adminId;
    suggestion.approvalDate = new Date();

    await suggestion.save();
    await suggestion.populate("suggestedBy", "name email avatarUrl");
    await suggestion.populate("approvedBy", "name email");

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error("Error approving suggestion:", error);
    return NextResponse.json(
      { error: "Failed to approve suggestion" },
      { status: 500 }
    );
  }
}
