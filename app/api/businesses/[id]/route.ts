import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Business from "../../../../models/Business";
import User from "../../../../models/User";
import { createNotification } from "../../../../services/notificationService";
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

    const existingBusiness = await Business.findById(id).select(
      "status ownerId ownerEmail name"
    );
    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }
    const previousStatus = existingBusiness.status;

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

    // Notify the owner when the business is newly approved or rejected.
    if (
      normalizedStatus &&
      normalizedStatus !== previousStatus &&
      (normalizedStatus === "Approved" || normalizedStatus === "Rejected")
    ) {
      try {
        let ownerId = business.ownerId?.toString();
        if (!ownerId && business.ownerEmail) {
          const owner = await User.findOne({
            email: business.ownerEmail,
          }).select("_id");
          ownerId = owner?._id?.toString();
        }

        if (ownerId) {
          if (normalizedStatus === "Approved") {
            await createNotification({
              userId: ownerId,
              type: "business_approved",
              title: "Business Approved",
              message: `Your business "${business.name}" has been approved and is now visible to the community.`,
              actionUrl: "/dashboard/member-businesses",
            });
          } else {
            await createNotification({
              userId: ownerId,
              type: "business_rejected",
              title: "Business Rejected",
              message: `Your business "${business.name}" was rejected. Reason: ${business.rejectionReason || "No reason provided"}.`,
              relatedData: { rejectionReason: business.rejectionReason },
              actionUrl: "/dashboard/member-businesses",
            });
          }
        } else {
          console.error(
            "[Business Update] Could not resolve owner to notify:",
            business._id
          );
        }
      } catch (notifyError) {
        console.error(
          "[Business Update] Failed to send owner notification:",
          notifyError
        );
      }
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
