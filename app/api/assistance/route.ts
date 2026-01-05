import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Assistance from "../../../models/Assistance";
import User from "../../../models/User";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");

    const query: any = {};
    if (community && Types.ObjectId.isValid(community)) {
      query.community = new Types.ObjectId(community);
    }

    const assistance = await Assistance.find(query)
      .populate("requestedBy", "name email")
      .select("-__v")
      .sort({ createdAt: -1 });

    return NextResponse.json(assistance, { status: 200 });
  } catch (error) {
    console.error("Error fetching assistance requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistance requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    if (
      !body.community ||
      !body.title ||
      !body.description ||
      !body.assistanceType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert email to user ID if requestedBy is an email
    let requestedById = body.requestedBy;
    if (
      body.requestedBy &&
      typeof body.requestedBy === "string" &&
      body.requestedBy.includes("@")
    ) {
      const user = await User.findOne({ email: body.requestedBy });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      requestedById = user._id;
    }

    const assistance: any = new Assistance({
      ...body,
      requestedBy: requestedById,
      status: body.status || "Pending",
    });

    await assistance.save();
    await assistance.populate("requestedBy", "name email");

    return NextResponse.json(assistance, { status: 201 });
  } catch (error) {
    console.error("Error creating assistance request:", error);
    return NextResponse.json(
      { error: "Failed to create assistance request" },
      { status: 400 }
    );
  }
}
