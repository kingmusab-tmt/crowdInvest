import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../utils/connectDB";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import "@/models/Community"; // Ensure Community schema is registered for populate

async function getTotalContribution(email: string) {
  const agg = await Transaction.aggregate([
    { $match: { userEmail: email, type: "Monthly_Contribution" } },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);
  return agg[0]?.total || 0;
}

async function attachContribution(users: any[]) {
  const enriched = await Promise.all(
    users.map(async (u: any) => {
      const totalContribution = await getTotalContribution(u.email);
      return {
        ...(u.toObject?.() ? u.toObject() : u),
        balance: totalContribution,
        totalContribution,
      };
    })
  );
  return enriched;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const emailQuery = searchParams.get("email");
    const communityIdQuery = searchParams.get("communityId");
    const userIdQuery = searchParams.get("userId");

    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const isAdmin = role === "Admin";

    // If querying by email, allow users to fetch their own data
    if (emailQuery) {
      // Allow users to fetch their own data or if they're an Admin
      if (emailQuery === session.user.email || isAdmin) {
        const users = await User.find({ email: emailQuery })
          .select(
            "name email role status createdAt community profileCompleted isTopUser balance paymentSettings kyc"
          )
          .populate("community", "name");

        const enriched = await attachContribution(users);
        return NextResponse.json(enriched, { status: 200 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If querying by community, allow Admin; allow regular members to view their own community roster.
    if (communityIdQuery) {
      const isMemberOfCommunity =
        role === "User" &&
        currentUser?.community?.toString() === communityIdQuery;

      if (!isAdmin && !isMemberOfCommunity) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const users = await User.find({ community: communityIdQuery })
        .select(
          "name email role status createdAt community profileCompleted isTopUser balance kyc"
        )
        .populate("community", "name");
      return NextResponse.json(users, { status: 200 });
    }

    // If querying by userId, allow if it's their own or they're an Admin
    if (userIdQuery) {
      if (userIdQuery === session.user.id || isAdmin) {
        const user = await User.findById(userIdQuery)
          .select(
            "name email role status createdAt community profileCompleted isTopUser balance paymentSettings kyc"
          )
          .populate("community", "name");
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        const enriched = await attachContribution([user]);
        return NextResponse.json(enriched, { status: 200 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Default: only Admin can list all users
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await User.find({})
      .select(
        "name email role status createdAt community profileCompleted isTopUser balance kyc"
      )
      .populate("community", "name");
    const enriched = await attachContribution(users);
    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const user = new User(body);
    await user.save();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 400 }
    );
  }
}
