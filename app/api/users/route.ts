import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../utils/connectDB";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import "@/models/Community"; // Ensure Community schema is registered for populate

function ensurePermission(
  role: string | null | undefined,
  permissions: any,
  required: string = "canManageUsers"
) {
  if (role === "General Admin") return true;
  if (role === "Community Admin" && permissions?.[required]) return true;
  return false;
}

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
    const perms = currentUser?.permissions;

    // If querying by email, allow users to fetch their own data
    if (emailQuery) {
      // Allow users to fetch their own data or if they have permission
      if (
        emailQuery === session.user.email ||
        ensurePermission(role, perms, "canManageUsers")
      ) {
        const users = await User.find({ email: emailQuery })
          .select(
            "name email role status createdAt community permissions profileCompleted isTopUser balance paymentSettings kyc"
          )
          .populate("community", "name");

        const enriched = await attachContribution(users);
        return NextResponse.json(enriched, { status: 200 });
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If querying by community, allow General Admin; allow Community Admin for their own community;
    // allow regular members to view their own community roster.
    if (communityIdQuery) {
      const isGeneralAdmin = role === "General Admin";
      const isCommunityAdminForOwn =
        role === "Community Admin" &&
        currentUser?.community?.toString() === communityIdQuery;
      const isMemberOfCommunity =
        role === "User" &&
        currentUser?.community?.toString() === communityIdQuery;

      if (!isGeneralAdmin && !isCommunityAdminForOwn && !isMemberOfCommunity) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const users = await User.find({ community: communityIdQuery })
        .select(
          "name email role status createdAt community permissions profileCompleted isTopUser balance kyc"
        )
        .populate("community", "name");
      return NextResponse.json(users, { status: 200 });
    }

    // If querying by userId, allow if it's their own or they have permission
    if (userIdQuery) {
      if (
        userIdQuery === session.user.id ||
        ensurePermission(role, perms, "canManageUsers")
      ) {
        const user = await User.findById(userIdQuery)
          .select(
            "name email role status createdAt community permissions profileCompleted isTopUser balance paymentSettings kyc"
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

    // Default: allow General Admin; Community Admin sees only their community
    if (role !== "General Admin" && role !== "Community Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query: any = {};
    if (role === "Community Admin") {
      query.community = currentUser?.community;
    }

    const users = await User.find(query)
      .select(
        "name email role status createdAt community permissions profileCompleted isTopUser balance kyc"
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
    const currentUser = await User.findById(session.user.id);
    const role = session.user.role;
    const perms = currentUser?.permissions;

    if (!ensurePermission(role, perms, "canManageUsers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Community admins can only create users within their community and cannot create General Admins
    if (role === "Community Admin") {
      if (body.role === "General Admin") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
      body.community = currentUser?.community;
    }

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
