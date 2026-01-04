import connectDB from "@/utils/connectDB";
import Community from "@/models/Community";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Optional: Restrict to admin users only
    if (session) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });

      if (user && user.role !== "General Admin") {
        return NextResponse.json(
          { error: "Only General Admin can seed communities" },
          { status: 403 }
        );
      }
    }

    await connectDB();

    // Find any user to use as generalAdmin (preferably a General Admin)
    let generalAdmin = await User.findOne({ role: "General Admin" });

    if (!generalAdmin) {
      // If no General Admin exists, use the first user
      generalAdmin = await User.findOne();
    }

    if (!generalAdmin) {
      return NextResponse.json(
        { error: "No users found in database. Please create a user first." },
        { status: 400 }
      );
    }

    const communities = [
      {
        name: "IMIC 2014",
        description: "Investment Members Investment Cooperative 2014 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2016",
        description: "Investment Members Investment Cooperative 2016 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2017",
        description: "Investment Members Investment Cooperative 2017 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
      {
        name: "IMIC 2018",
        description: "Investment Members Investment Cooperative 2018 cohort",
        generalAdmin: generalAdmin._id,
        status: "Active",
        enabledFunctions: {
          investments: true,
          proposals: true,
          events: true,
          assistance: true,
          kyc: true,
          withdrawals: true,
        },
        memberCount: 0,
      },
    ];

    // Delete existing communities to avoid duplicates
    await Community.deleteMany({
      name: { $in: ["IMIC 2014", "IMIC 2016", "IMIC 2017", "IMIC 2018"] },
    });

    // Insert new communities
    const result = await Community.insertMany(communities);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${result.length} communities`,
      communities: result.map((c) => ({ id: c._id, name: c.name })),
    });
  } catch (error) {
    console.error("Error seeding communities:", error);
    return NextResponse.json(
      { error: "Failed to seed communities" },
      { status: 500 }
    );
  }
}
