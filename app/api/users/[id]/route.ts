import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../../utils/connectDB";
import User from "../../../../models/User";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(id)
      .select("-__v")
      .populate("community", "name");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();

    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatePayload: any = {};

    if (body.role) {
      updatePayload.role = body.role;
    }

    if (body.community !== undefined) {
      updatePayload.community = body.community;
    }

    if (body.status) {
      updatePayload.status = body.status;
    }

    const updated = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await targetUser.deleteOne();

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
