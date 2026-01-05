import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Investment from "../../../../models/Investment";
import MemberInvestment from "../../../../models/MemberInvestment";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid investment ID" },
        { status: 400 }
      );
    }

    let investment = await MemberInvestment.findById(params.id).select("-__v");

    if (!investment) {
      investment = await Investment.findById(params.id).select("-__v");
    }

    if (!investment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investment, { status: 200 });
  } catch (error) {
    console.error("Error fetching investment:", error);
    return NextResponse.json(
      { error: "Failed to fetch investment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid investment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Try to update MemberInvestment first
    let investment = await MemberInvestment.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).select("-__v");

    // If not found, try Investment model
    if (!investment) {
      investment = await Investment.findByIdAndUpdate(params.id, body, {
        new: true,
        runValidators: true,
      }).select("-__v");
    }

    if (!investment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investment, { status: 200 });
  } catch (error) {
    console.error("Error updating investment:", error);
    return NextResponse.json(
      { error: "Failed to update investment" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid investment ID" },
        { status: 400 }
      );
    }

    // Try to delete from MemberInvestment first
    let investment = await MemberInvestment.findByIdAndDelete(params.id);

    // If not found, try Investment model
    if (!investment) {
      investment = await Investment.findByIdAndDelete(params.id);
    }

    if (!investment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Investment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting investment:", error);
    return NextResponse.json(
      { error: "Failed to delete investment" },
      { status: 500 }
    );
  }
}
