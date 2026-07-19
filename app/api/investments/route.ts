import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth";
import dbConnect from "../../../utils/connectDB";
import Investment from "../../../models/Investment";
import MemberInvestment from "../../../models/MemberInvestment";
import Transaction from "../../../models/Transaction";
import { getSingletonCommunity } from "../../../utils/getCommunity";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");
    const status = searchParams.get("status");

    // Only filter by status when explicitly requested — omitting it
    // returns investments in every status (Active, Completed, Sold) so
    // the UI can show both "current" and "past" investments.
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (community) {
      // Convert string community ID to ObjectId
      if (Types.ObjectId.isValid(community)) {
        query.community = new Types.ObjectId(community);
      }
    }

    console.log("Investment query:", JSON.stringify(query));

    // Fetch from both Investment (admin-created) and MemberInvestment (member portfolios)
    const [adminInvestments, memberInvestments] = await Promise.all([
      Investment.find(query).select("-__v").sort({ createdAt: -1 }),
      MemberInvestment.find(query).select("-__v").sort({ createdAt: -1 }),
    ]);

    console.log("Found admin Investments:", adminInvestments.length);
    console.log("Found MemberInvestments:", memberInvestments.length);

    // Combine both types of investments
    const allInvestments = [...adminInvestments, ...memberInvestments];

    return NextResponse.json(allInvestments, { status: 200 });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      { error: "Failed to fetch investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const community = await getSingletonCommunity();

    const investment = new Investment({ ...body, community: community._id });
    await investment.save();

    // Automatically record the capital deployed into this investment as
    // community spending, so it's deducted from funds available for
    // investment and reflected in total spending — no manual bookkeeping.
    try {
      await Transaction.create({
        userName: session.user.name || "Admin",
        userEmail: session.user.email || "",
        community: community._id,
        type: "Investment",
        amount: investment.totalInvested,
        status: "Completed",
        date: new Date(),
        isAdminTransaction: true,
        performedByName: session.user.name ?? undefined,
        description: `Investment in ${investment.title}`,
      });
    } catch (transactionError) {
      console.error(
        "Failed to record investment spending transaction:",
        transactionError
      );
      // Don't fail investment creation if the spending record fails
    }

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      { error: "Failed to create investment" },
      { status: 400 }
    );
  }
}
