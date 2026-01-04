import connectDB from "@/utils/connectDB";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get query param for filtering by role
    const role = req.nextUrl.searchParams.get("role");

    let query: any = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select("_id name email role");

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
