import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Community from "@/models/Community";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (
      session.user.role !== "General Admin" &&
      session.user.role !== "Community Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { transactionType, communityId, memberId, amount, description } =
      body;

    // Validation
    if (
      !transactionType ||
      !["profit_deposit", "manual_deposit", "refund_deposit"].includes(
        transactionType
      )
    ) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!communityId) {
      return NextResponse.json(
        { error: "Community is required" },
        { status: 400 }
      );
    }

    // For manual_deposit and refund_deposit, member is required
    if (
      (transactionType === "manual_deposit" ||
        transactionType === "refund_deposit") &&
      !memberId
    ) {
      return NextResponse.json(
        { error: "Member is required for this transaction type" },
        { status: 400 }
      );
    }

    // Verify community admin has access to this community
    if (session.user.role === "Community Admin") {
      const adminUser: any = await User.findOne({
        email: session.user.email,
      }).lean();
      if (!adminUser || adminUser.community?.toString() !== communityId) {
        return NextResponse.json(
          { error: "Access denied to this community" },
          { status: 403 }
        );
      }
    }

    // Get community details
    const community = await Community.findById(communityId);
    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    let transactionData: any = {
      community: communityId,
      type: transactionType,
      amount: amount,
      status: "Completed",
      date: new Date(),
      isAdminTransaction: true,
      performedByName: session.user.name,
    };

    // Handle different transaction types
    if (
      transactionType === "manual_deposit" ||
      transactionType === "refund_deposit"
    ) {
      // Get member details
      const member = await User.findById(memberId);
      if (!member) {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      }

      // Verify member belongs to the community
      if (member.community?.toString() !== communityId) {
        return NextResponse.json(
          { error: "Member does not belong to this community" },
          { status: 400 }
        );
      }

      transactionData.userName = member.name;
      transactionData.userEmail = member.email;

      if (transactionType === "manual_deposit") {
        transactionData.description =
          description || `Manual deposit on behalf of ${member.name}`;

        // Update member's balance
        member.balance = (member.balance || 0) + amount;
        await member.save();
      } else if (transactionType === "refund_deposit") {
        transactionData.description =
          description || `Refund deposit for ${member.name}`;

        // Update member's balance
        member.balance = (member.balance || 0) + amount;
        await member.save();
      }
    } else if (transactionType === "profit_deposit") {
      // For profit deposit, use admin's name but mark it as community-wide
      transactionData.userName = session.user.name || "Admin";
      transactionData.userEmail = session.user.email || "";
      transactionData.description = description || "Investment profit deposit";

      // Get all completed Monthly_Contribution transactions for this community
      const allContributions = await Transaction.find({
        community: communityId,
        type: "Monthly_Contribution",
        status: "Completed",
      });

      // Calculate total community contributions
      const totalCommunityContributions = allContributions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      if (totalCommunityContributions > 0) {
        // Get all community members
        const communityMembers = await User.find({ community: communityId });

        // Calculate and distribute profit share to each member
        for (const member of communityMembers) {
          // Calculate member's total contributions
          const memberContributions = allContributions.filter(
            (t) => t.userEmail === member.email
          );
          const memberTotalContribution = memberContributions.reduce(
            (sum, t) => sum + t.amount,
            0
          );

          if (memberTotalContribution > 0) {
            // Calculate member's contribution percentage
            const contributionPercentage =
              (memberTotalContribution / totalCommunityContributions) * 100;

            // Calculate member's profit share
            const memberProfitShare = (amount * contributionPercentage) / 100;

            console.log(`Creating Profit Share for ${member.name}:`, {
              email: member.email,
              contributionPercentage,
              memberProfitShare,
              amount,
            });

            // Create individual profit share transaction for the member
            const profitShareTransaction = await Transaction.create({
              userName: member.name,
              userEmail: member.email,
              community: communityId,
              type: "Profit Share",
              amount: memberProfitShare,
              status: "Completed",
              date: new Date(),
              isAdminTransaction: true,
              performedByName: session.user.name,
              description: `Profit share from investment income (${contributionPercentage.toFixed(
                2
              )}% contribution)`,
            });

            console.log(
              `Created Profit Share transaction:`,
              profitShareTransaction
            );

            // Update member's balance with their profit share
            member.balance = (member.balance || 0) + memberProfitShare;
            await member.save();
          }
        }
      }
    }

    // Create the main transaction record
    const transaction = await Transaction.create(transactionData);

    return NextResponse.json(
      {
        message: "Deposit processed successfully",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing deposit:", error);
    return NextResponse.json(
      { error: "Failed to process deposit" },
      { status: 500 }
    );
  }
}
