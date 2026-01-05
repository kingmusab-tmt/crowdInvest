import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/utils/connectDB";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const suggestion = await InvestmentSuggestion.findByIdAndUpdate(
      id,
      {
        status: body.status,
        rejectionReason: body.rejectionReason || undefined,
      },
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
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

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
