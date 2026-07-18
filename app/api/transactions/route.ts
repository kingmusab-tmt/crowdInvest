import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "../../../utils/connectDB";
import Transaction from "../../../models/Transaction";
import User from "../../../models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const withdrawal = searchParams.get("withdrawal");

    const query: any = {};

    // If withdrawal filter is requested, only return admin transactions with withdrawal types
    if (withdrawal === "true") {
      query.isAdminTransaction = true;
      query.type = {
        $in: ["Investment", "Profit Share", "Assistance", "Event"],
      };
    }

    // Admin can view all transactions
    if (session.user.role === "Admin") {
      const adminTransactions = await Transaction.find(query)
        .select("-__v")
        .sort({ date: -1 });
      return NextResponse.json(adminTransactions, { status: 200 });
    }

    // Community scoped access
    const requester: any = await User.findOne({ email: session.user.email })
      .select("community")
      .lean();

    if (!requester || !requester.community) {
      // No community means nothing to show for community-scoped users
      return NextResponse.json([], { status: 200 });
    }

    const communityId = requester.community;

    // Collect community member emails to include legacy transactions that may not have community tagged
    const communityMembers = await User.find({ community: communityId })
      .select("email")
      .lean();
    const memberEmails = communityMembers.map((m) => m.email);

    query.$or = [
      { community: communityId },
      {
        community: { $exists: false },
        userEmail: { $in: memberEmails },
      },
    ];

    const transactions = await Transaction.find(query)
      .select("-__v")
      .sort({ date: -1 });
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const transaction = new Transaction(body);
    await transaction.save();

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 400 }
    );
  }
}
