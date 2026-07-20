import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import connectDB from "@/utils/connectDB";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getPlatformSettings } from "@/utils/getPlatformSettings";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query: any = {};

    // For regular users, only show their own withdrawals
    if (session.user.role !== "Admin") {
      query.userEmail = session.user.email;
    }
    // Admin sees all withdrawals

    if (status) {
      query.status = status;
    }

    const withdrawals = await WithdrawalRequest.find(query)
      .sort({ requestDate: -1 })
      .lean();

    return NextResponse.json(withdrawals, { status: 200 });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal requests" },
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

    await connectDB();

    const body = await request.json();
    const { amount, userName, userEmail, communityId, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const platformSettings = await getPlatformSettings();
    if (
      platformSettings.minimumWithdrawal > 0 &&
      amount < platformSettings.minimumWithdrawal
    ) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ₦${platformSettings.minimumWithdrawal.toLocaleString()}`,
        },
        { status: 400 }
      );
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

    // Auto-approve small withdrawals if configured
    const autoApprove =
      platformSettings.autoApproveWithdrawalUnder > 0 &&
      amount <= platformSettings.autoApproveWithdrawalUnder;

    // Create withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
      user: user._id,
      userName: userName || session.user.name,
      userEmail: userEmail || session.user.email,
      community: user.community || communityId,
      amount,
      description,
      status: autoApprove ? "Approved" : "Pending",
      requestDate: new Date(),
      ...(autoApprove && {
        processedDate: new Date(),
        processedByName: "System (Auto-Approved)",
      }),
    });

    if (autoApprove) {
      await Transaction.create({
        userName: withdrawalRequest.userName,
        userEmail: withdrawalRequest.userEmail,
        community: withdrawalRequest.community,
        type: "Profit Share",
        amount: -amount,
        status: "Completed",
        date: new Date(),
        isAdminTransaction: true,
        performedByName: "System (Auto-Approved)",
        description: `Withdrawal auto-approved - ${
          description || "Profit share withdrawal"
        }`,
      });
    }

    return NextResponse.json(
      {
        message: autoApprove
          ? "Withdrawal auto-approved and processed successfully"
          : "Withdrawal request submitted successfully",
        withdrawalRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { withdrawalId, status, rejectionReason } = body;

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: "Withdrawal ID and status are required" },
        { status: 400 }
      );
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const withdrawal: any = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "Pending") {
      return NextResponse.json(
        { error: "Withdrawal request already processed" },
        { status: 400 }
      );
    }

    withdrawal.status = status;
    withdrawal.processedDate = new Date();
    withdrawal.processedByName = session.user.name;

    if (status === "Approved") {
      // Create a transaction for the withdrawal
      await Transaction.create({
        userName: withdrawal.userName,
        userEmail: withdrawal.userEmail,
        community: withdrawal.community,
        type: "Profit Share",
        amount: -withdrawal.amount, // Negative amount to deduct from profit share
        status: "Completed",
        date: new Date(),
        isAdminTransaction: true,
        performedByName: session.user.name ?? undefined,
        description: `Withdrawal approved - ${
          withdrawal.description || "Profit share withdrawal"
        }`,
      });
    } else if (status === "Rejected") {
      withdrawal.rejectionReason =
        rejectionReason || "Withdrawal rejected by admin";
    }

    await withdrawal.save();

    return NextResponse.json(
      {
        message: `Withdrawal ${status.toLowerCase()} successfully`,
        withdrawal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
