import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import Assistance from "../../../../models/Assistance";
import User from "../../../../models/User";
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
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const assistance = await Assistance.findById(id)
      .populate("requestedBy", "name email")
      .select("-__v");

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error fetching assistance request:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistance request" },
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
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // If requestedBy is provided as an email, convert to user ObjectId
    if (
      body.requestedBy &&
      typeof body.requestedBy === "string" &&
      body.requestedBy.includes("@")
    ) {
      const user = await User.findOne({ email: body.requestedBy });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      body.requestedBy = user._id;
    }

    const assistance = await Assistance.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("requestedBy", "name email")
      .select("-__v");

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error updating assistance request:", error);
    return NextResponse.json(
      { error: "Failed to update assistance request" },
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
        { error: "Invalid assistance request ID" },
        { status: 400 }
      );
    }

    const assistance = await Assistance.findByIdAndDelete(id);

    if (!assistance) {
      return NextResponse.json(
        { error: "Assistance request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Assistance request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting assistance request:", error);
    return NextResponse.json(
      { error: "Failed to delete assistance request" },
      { status: 500 }
    );
  }
}
