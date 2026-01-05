import { NextResponse, NextRequest } from "next/server";
import dbConnect from "../../../../utils/connectDB";
import MemberInvestment from "../../../../models/MemberInvestment";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 }
      );
    }

    const investments = await MemberInvestment.find({ community: communityId })
      .select("-__v")
      .sort({ createdAt: -1 });

    return NextResponse.json(investments, { status: 200 });
  } catch (error) {
    console.error("Error fetching community investments:", error);
    return NextResponse.json(
      { error: "Failed to fetch community investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    if (!body.community || !body.investmentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate profit/loss if currentPrice is provided
    const totalInvested = body.totalInvested || body.basePrice * body.quantity;
    const currentValue = body.currentValue || body.currentPrice * body.quantity;
    const profitOrLoss = currentValue - totalInvested;
    const profitOrLossPercentage = (profitOrLoss / totalInvested) * 100;

    const investment = new MemberInvestment({
      ...body,
      totalInvested,
      currentValue,
      profitOrLoss,
      profitOrLossPercentage,
    });

    await investment.save();

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Error creating community investment:", error);
    return NextResponse.json(
      { error: "Failed to create community investment" },
      { status: 400 }
    );
  }
}
