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

    // Build update payload
    const updatePayload: any = {
      ...body,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    };

    // Handle rejection
    if (normalizedStatus === "Rejected") {
      if (!body.rejectionReason || !body.rejectionReason.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      updatePayload.rejectionReason = body.rejectionReason.trim();
      updatePayload.rejectedAt = new Date();
      // Note: rejectedBy would be set from session if we have auth context
      console.log("[Business Update] Rejecting business:", {
        businessId: id,
        reason: updatePayload.rejectionReason,
      });
    }

    // Clear rejection fields if status is being changed from Rejected
    if (normalizedStatus && normalizedStatus !== "Rejected") {
      if (body.clearRejection) {
        updatePayload.rejectionReason = undefined;
        updatePayload.rejectedAt = undefined;
        updatePayload.rejectedBy = undefined;
      }
    }

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

    console.log("[Business Update] Updated business:", {
      businessId: business._id,
      name: business.name,
      status: business.status,
    });

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
