import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { amount, userName, userEmail, communityId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Get user to verify community
    const user: any = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate available profit share from actual Profit Share transactions
    // Positive amounts = profit distributions, Negative amounts = withdrawals/contributions
    const profitShareTransactions = await Transaction.find({
      userEmail: session.user.email,
      type: "Profit Share",
      status: "Completed",
    });

    const availableProfitShare = profitShareTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    if (amount > availableProfitShare) {
      return NextResponse.json(
        {
          error: `Insufficient profit share. Available: ₦${availableProfitShare.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Create a withdrawal request (auto-approved since member is using their own profit share)
    const withdrawalRequest = await WithdrawalRequest.create({
      user: user._id,
      userName: userName || session.user.name,
      userEmail: userEmail || session.user.email,
      community: user.community || communityId,
      amount,
      description: "Converting profit share to monthly contribution",
      status: "Approved",
      requestDate: new Date(),
      processedDate: new Date(),
      processedByName: "Self (Auto-approved)",
    });

    // Create a negative Profit Share transaction to deduct from profit share
    await Transaction.create({
      userName: userName || session.user.name,
      userEmail: userEmail || session.user.email,
      community: user.community || communityId,
      type: "Profit Share",
      amount: -amount,
      status: "Completed",
      date: new Date(),
      isAdminTransaction: true,
      performedByName: session.user.name,
      description: "Profit share converted to monthly contribution",
    });

    // Create Monthly_Contribution transaction
    const contributionTransaction = await Transaction.create({
      userName: userName || session.user.name,
      userEmail: userEmail || session.user.email,
      community: user.community || communityId,
      type: "Monthly_Contribution",
      amount,
      status: "Completed",
      date: new Date(),
      isAdminTransaction: false,
      performedByName: session.user.name,
      description: "Monthly contribution from profit share",
    });

    // Update user's balance
    const userDoc = await User.findOne({ email: session.user.email });
    if (userDoc) {
      userDoc.balance = (userDoc.balance || 0) + amount;
      await userDoc.save();
    }

    return NextResponse.json(
      {
        message: "Contribution from profit share processed successfully",
        transaction: contributionTransaction,
        withdrawalRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing contribution from profit share:", error);
    return NextResponse.json(
      { error: "Failed to process contribution" },
      { status: 500 }
    );
  }
}
