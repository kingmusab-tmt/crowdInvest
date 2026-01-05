import connectDB from "@/utils/connectDB";
import MemberInvestment from "@/models/MemberInvestment";
import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import Community from "@/models/Community";
import User from "@/models/User";

async function seedInvestments() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Find communities
    const communities = await Community.find({ status: "Active" }).limit(2);
    if (communities.length === 0) {
      console.log("No communities found. Please seed communities first.");
      process.exit(1);
    }

    console.log(`Found ${communities.length} communities`);

    // Find users to assign as investors
    const users = await User.find({ role: "User" }).limit(5);
    if (users.length === 0) {
      console.log("No users found. Please seed users first.");
      process.exit(1);
    }

    console.log(`Found ${users.length} users`);

    // Clear existing investments
    await MemberInvestment.deleteMany({});
    console.log("Cleared existing member investments");

    // Clear existing suggestions
    await InvestmentSuggestion.deleteMany({});
    console.log("Cleared existing investment suggestions");

    // Sample member investments
    const memberInvestments = [
      {
        community: communities[0]._id,
        user: users[0]._id,
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
        expectedMaturityDate: null,
        notes: "Long-term tech investment with strong growth potential",
      },
      {
        community: communities[0]._id,
        user: users[1]._id,
        investmentType: "business",
        title: "Local Tech Startup - FoodDeliveryApp",
        description: "Equity stake in a local food delivery mobile app startup",
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
        notes: "Series A investment in promising startup with user traction",
      },
      {
        community: communities[0]._id,
        user: users[2]._id,
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
        expectedMaturityDate: null,
        notes: "Volatile but high growth potential digital asset",
      },
      {
        community: communities[0]._id,
        user: users[3]._id,
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
        community: communities[1]._id,
        user: users[4]._id,
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
        expectedMaturityDate: null,
        notes: "Cloud computing and enterprise software leader",
      },
      {
        community: communities[1]._id,
        user: users[0]._id,
        investmentType: "stock",
        title: "Tesla Inc. (TSLA)",
        description: "50 shares of Tesla Inc.",
        basePrice: 200,
        currentPrice: 185,
        quantity: 50,
        totalInvested: 10000,
        currentValue: 9250,
        profitOrLoss: -750,
        profitOrLossPercentage: -7.5,
        dividendReceived: 0,
        status: "Active",
        purchaseDate: new Date("2023-11-20"),
        expectedMaturityDate: null,
        notes: "Volatile EV manufacturer with future growth potential",
      },
    ];

    // Insert member investments
    const createdInvestments = await MemberInvestment.insertMany(
      memberInvestments
    );
    console.log(`✓ Created ${createdInvestments.length} member investments`);

    // Sample investment suggestions
    const investmentSuggestions = [
      {
        community: communities[0]._id,
        suggestedBy: users[1]._id,
        investmentType: "stock",
        title: "NVIDIA Corporation (NVDA)",
        description:
          "NVIDIA is a leading designer of graphics processing units (GPUs) and AI chips. The company is at the forefront of the AI revolution with products used in data centers, gaming, and autonomous vehicles.",
        reason:
          "AI is the future and NVIDIA is the primary beneficiary. With their dominance in GPU technology and partnerships with major cloud providers, they are positioned to grow exponentially. The current market correction presents a good entry point.",
        amountRequired: 25000,
        timeframe: "2-3 years",
        expectedReturn: "150-200%",
        riskLevel: "Medium",
        status: "Pending",
        approvedBy: null,
        approvalDate: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        community: communities[0]._id,
        suggestedBy: users[3]._id,
        investmentType: "business",
        title: "E-commerce Platform - African Market Focus",
        description:
          "An emerging e-commerce platform targeting African markets with mobile-first approach. Currently operational in 3 countries with 50,000+ monthly active users.",
        reason:
          "African e-commerce is growing at 30% annually. This platform has found product-market fit and is expanding rapidly. The founders have proven track record and the market timing is perfect.",
        amountRequired: 100000,
        timeframe: "3-5 years",
        expectedReturn: "300-400%",
        riskLevel: "High",
        status: "Approved",
        approvedBy: users[2]._id,
        approvalDate: new Date("2024-12-20"),
        rejectionReason: null,
        createdAt: new Date("2024-12-10"),
        updatedAt: new Date("2024-12-20"),
      },
      {
        community: communities[0]._id,
        suggestedBy: users[4]._id,
        investmentType: "real-estate",
        title: "Residential Complex - Suburban Development",
        description:
          "New residential complex with 200 units under development in a fast-growing suburban area. All units pre-sold with strong demand.",
        reason:
          "Housing demand is increasing in this region with limited supply. The developer has completed 5 similar projects successfully. Expected completion in 18 months with immediate tenant occupancy.",
        amountRequired: 500000,
        timeframe: "5-10 years",
        expectedReturn: "25-30% annually",
        riskLevel: "Low",
        status: "Approved",
        approvedBy: users[2]._id,
        approvalDate: new Date("2024-12-15"),
        rejectionReason: null,
        createdAt: new Date("2024-12-05"),
        updatedAt: new Date("2024-12-15"),
      },
      {
        community: communities[1]._id,
        suggestedBy: users[3]._id,
        investmentType: "crypto",
        title: "DeFi Protocol - Ethereum-based",
        description:
          "A decentralized finance protocol offering yield farming and liquidity pools on Ethereum. Currently managing $50M in total value locked (TVL).",
        reason:
          "DeFi is transforming financial services. This protocol has a strong community, innovative features, and sustainable tokenomics. Growing TVL indicates market confidence.",
        amountRequired: 50000,
        timeframe: "1-2 years",
        expectedReturn: "100-300%",
        riskLevel: "High",
        status: "Voting",
        approvedBy: users[2]._id,
        approvalDate: new Date("2024-12-25"),
        rejectionReason: null,
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date("2024-12-25"),
      },
      {
        community: communities[1]._id,
        suggestedBy: users[0]._id,
        investmentType: "stock",
        title: "Healthcare ETF - Diversified Medical",
        description:
          "Exchange-traded fund focused on healthcare and pharmaceutical companies. Provides diversified exposure to the healthcare sector.",
        reason:
          "Healthcare is recession-proof and aging demographics ensure long-term demand growth. This ETF provides diversification across companies, reducing single-stock risk while maintaining sector exposure.",
        amountRequired: 75000,
        timeframe: "5+ years",
        expectedReturn: "8-12% annually",
        riskLevel: "Low",
        status: "Rejected",
        approvedBy: null,
        approvalDate: null,
        rejectionReason:
          "Similar healthcare investment already in community portfolio",
        createdAt: new Date("2024-12-18"),
        updatedAt: new Date("2024-12-28"),
      },
    ];

    // Insert investment suggestions
    const createdSuggestions = await InvestmentSuggestion.insertMany(
      investmentSuggestions
    );
    console.log(
      `✓ Created ${createdSuggestions.length} investment suggestions`
    );

    console.log("\n✅ Investment seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding investments:", error);
    process.exit(1);
  }
}

seedInvestments();
