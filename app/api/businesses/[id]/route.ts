import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Business from "../../../../models/Business";
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
        { error: "Invalid business ID" },
        { status: 400 }
      );
    }

    const business = await Business.findById(id).select("-__v");

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
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
        { error: "Invalid business ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Normalize status to allowed enum values
    const normalizedStatus = (() => {
      const raw = body.status;
      if (!raw) return undefined;
      const lower = String(raw).toLowerCase();
      if (lower === "approved" || lower === "approve") return "Approved";
      if (lower === "pending") return "Pending";
      if (lower === "rejected" || lower === "reject") return "Rejected";
      return undefined;
    })();

    const updatePayload = {
      ...body,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    };

    const business = await Business.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
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
        { error: "Invalid business ID" },
        { status: 400 }
      );
    }

    const business = await Business.findByIdAndDelete(id);

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Business deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
