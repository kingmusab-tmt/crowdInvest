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

    suggestion.status = "Rejected";
    suggestion.rejectionReason = body.reason || "";

    await suggestion.save();
    await suggestion.populate("suggestedBy", "name email avatarUrl");

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error("Error rejecting suggestion:", error);
    return NextResponse.json(
      { error: "Failed to reject suggestion" },
      { status: 500 }
    );
  }
}
