import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../utils/connectDB";
import Investment from "../../../models/Investment";
import MemberInvestment from "../../../models/MemberInvestment";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const community = searchParams.get("community");
    const status = searchParams.get("status") || "Active";

    const query: any = { status };
    if (community) {
      // Convert string community ID to ObjectId
      if (Types.ObjectId.isValid(community)) {
        query.community = new Types.ObjectId(community);
      }
    }

    console.log("Investment query:", JSON.stringify(query));

    // First try to fetch from MemberInvestment (member portfolios)
    let investments = await MemberInvestment.find(query)
      .select("-__v")
      .sort({ createdAt: -1 });

    console.log("Found MemberInvestments:", investments.length);

    // If no member investments, try Investment model (admin-managed)
    if (investments.length === 0) {
      investments = await Investment.find(query)
        .select("-__v")
        .sort({ createdAt: -1 });
      console.log("Found Investments:", investments.length);
    }

    return NextResponse.json(investments, { status: 200 });
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
    await dbConnect();
    const body = await request.json();

    const investment = new Investment(body);
    await investment.save();

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      { error: "Failed to create investment" },
      { status: 400 }
    );
  }
}
