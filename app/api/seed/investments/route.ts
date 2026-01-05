import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/connectDB";
import MemberInvestment from "@/models/MemberInvestment";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import Community from "@/models/Community";
import User from "@/models/User";
import { authOptions } from "@/app/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "General Admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only General Admin can seed data" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get all active communities
    const communities = await Community.find({ status: "Active" });

    if (communities.length === 0) {
      return NextResponse.json(
        { error: "No active communities found to seed" },
        { status: 400 }
      );
    }

    // Clear existing investments
    await MemberInvestment.deleteMany({});
    await InvestmentSuggestion.deleteMany({});

    let totalInvestmentsCreated = 0;
    let totalSuggestionsCreated = 0;
    const skippedCommunities: string[] = [];

    // Create sample investments for each community
    for (const community of communities) {
      // Get users that belong to this specific community
      const communityUsers = await User.find({
        community: community._id,
        role: "User",
      }).limit(10);

      // If no users found for this community, skip it
      if (communityUsers.length === 0) {
        skippedCommunities.push(community.name);
        continue;
      }

      // Use first user or distribute among available users
      const user1 = communityUsers[0]._id;
      const user2 = communityUsers[Math.min(1, communityUsers.length - 1)]._id;
      const user3 = communityUsers[Math.min(2, communityUsers.length - 1)]._id;
      const user4 = communityUsers[Math.min(3, communityUsers.length - 1)]._id;
      const user5 = communityUsers[Math.min(4, communityUsers.length - 1)]._id;

      const memberInvestments = [
        {
          community: community._id,
          user: user1,
          investmentType: "stock",
          title: "Apple Inc. (AAPL)",
          description: "100 shares of Apple Inc. technology stock",
          basePrice: 150.25,
          currentPrice: 175.5,
          quantity: 100,
          totalInvested: 15025,
          currentValue: 17550,
          profitOrLoss: 2525,
          profitOrLossPercentage: 16.81,
          dividendReceived: 250,
          status: "Active",
          purchaseDate: new Date("2023-06-15"),
          notes: "Long-term tech investment with strong growth potential",
        },
        {
          community: community._id,
          user: user2,
          investmentType: "business",
          title: "Local Tech Startup - FoodDeliveryApp",
          description:
            "Equity stake in a local food delivery mobile app startup",
          basePrice: 5000,
          currentPrice: 6200,
          quantity: 2,
          totalInvested: 10000,
          currentValue: 12400,
          profitOrLoss: 2400,
          profitOrLossPercentage: 24.0,
          dividendReceived: 500,
          status: "Active",
          purchaseDate: new Date("2023-03-20"),
          expectedMaturityDate: new Date("2026-03-20"),
          notes: "Series A investment in promising startup",
        },
        {
          community: community._id,
          user: user3,
          investmentType: "crypto",
          title: "Bitcoin (BTC)",
          description: "0.5 BTC cryptocurrency holding",
          basePrice: 35000,
          currentPrice: 42500,
          quantity: 0.5,
          totalInvested: 17500,
          currentValue: 21250,
          profitOrLoss: 3750,
          profitOrLossPercentage: 21.43,
          dividendReceived: 0,
          status: "Active",
          purchaseDate: new Date("2023-09-01"),
          notes: "Volatile but high growth potential digital asset",
        },
        {
          community: community._id,
          user: user4,
          investmentType: "real-estate",
          title: "Commercial Property - Downtown Office Building",
          description: "Share in a commercial real estate development",
          basePrice: 50000,
          currentPrice: 58000,
          quantity: 1,
          totalInvested: 50000,
          currentValue: 58000,
          profitOrLoss: 8000,
          profitOrLossPercentage: 16.0,
          dividendReceived: 2000,
          status: "Active",
          purchaseDate: new Date("2022-12-10"),
          expectedMaturityDate: new Date("2032-12-10"),
          notes: "Stable income-generating real estate investment",
        },
        {
          community: community._id,
          user: user5,
          investmentType: "stock",
          title: "Microsoft Corporation (MSFT)",
          description: "75 shares of Microsoft Corporation",
          basePrice: 310,
          currentPrice: 380,
          quantity: 75,
          totalInvested: 23250,
          currentValue: 28500,
          profitOrLoss: 5250,
          profitOrLossPercentage: 22.58,
          dividendReceived: 900,
          status: "Active",
          purchaseDate: new Date("2023-01-15"),
          notes: "Cloud computing leader",
        },
      ];

      const createdInvestments = await MemberInvestment.insertMany(
        memberInvestments
      );
      totalInvestmentsCreated += createdInvestments.length;

      // Create sample suggestions for each community
      const investmentSuggestions = [
        {
          community: community._id,
          suggestedBy: user2,
          investmentType: "stock",
          title: "NVIDIA Corporation (NVDA)",
          description:
            "NVIDIA is a leading designer of graphics processing units and AI chips.",
          reason:
            "AI is the future and NVIDIA is the primary beneficiary. Their GPU dominance positions them for exponential growth.",
          amountRequired: 25000,
          timeframe: "2-3 years",
          expectedReturn: "150-200%",
          riskLevel: "Medium",
          status: "Pending",
        },
        {
          community: community._id,
          suggestedBy: user4,
          investmentType: "business",
          title: "E-commerce Platform - African Market Focus",
          description:
            "An emerging e-commerce platform targeting African markets with mobile-first approach.",
          reason:
            "African e-commerce is growing at 30% annually. This platform has found product-market fit.",
          amountRequired: 100000,
          timeframe: "3-5 years",
          expectedReturn: "300-400%",
          riskLevel: "High",
          status: "Approved",
          approvedBy: user1,
          approvalDate: new Date("2024-12-20"),
        },
        {
          community: community._id,
          suggestedBy: user5,
          investmentType: "real-estate",
          title: "Residential Complex - Suburban Development",
          description:
            "New residential complex with 200 units under development in a fast-growing suburban area.",
          reason:
            "Housing demand is increasing with limited supply. Developer has successful track record.",
          amountRequired: 500000,
          timeframe: "5-10 years",
          expectedReturn: "25-30% annually",
          riskLevel: "Low",
          status: "Voting",
          approvedBy: user1,
          approvalDate: new Date("2024-12-15"),
        },
      ];

      const createdSuggestions = await InvestmentSuggestion.insertMany(
        investmentSuggestions
      );
      totalSuggestionsCreated += createdSuggestions.length;
    }

    return NextResponse.json(
      {
        message: "Investment data seeded successfully",
        data: {
          communitiesSeeded: communities.length - skippedCommunities.length,
          investmentsCreated: totalInvestmentsCreated,
          suggestionsCreated: totalSuggestionsCreated,
          skippedCommunities:
            skippedCommunities.length > 0
              ? `${skippedCommunities.join(", ")} (no users found)`
              : "None",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error seeding investments:", error);
    return NextResponse.json(
      {
        error: "Failed to seed investments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
