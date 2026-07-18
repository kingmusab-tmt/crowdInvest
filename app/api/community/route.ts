import connectDB from "@/utils/connectDB";
import { getSingletonCommunity } from "@/utils/getCommunity";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const community = await getSingletonCommunity();
    return NextResponse.json(community, { status: 200 });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, enabledFunctions, status } = body;

    const community = await getSingletonCommunity();

    if (name !== undefined) community.name = name;
    if (description !== undefined) community.description = description;
    if (enabledFunctions !== undefined)
      community.enabledFunctions = enabledFunctions;
    if (status !== undefined) community.status = status;

    await community.save();

    return NextResponse.json(community, { status: 200 });
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Failed to update community" },
      { status: 400 }
    );
  }
}
