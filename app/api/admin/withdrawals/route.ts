import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Community from "@/models/Community";
import { createNotification } from "@/services/notificationService";
import { formatNaira } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Community Admin and General Admin can initiate withdrawals
    if (
      session.user.role !== "Community Admin" &&
      session.user.role !== "General Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can initiate withdrawals" },
        { status: 403 }
      );
    }

    const {
      type,
      amount,
      recipientEmail,
      recipientName,
      description,
      communityId,
      performedBy,
    } = await request.json();

    // Validate basic required fields
    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, and description" },
        { status: 400 }
      );
    }

    // Validate withdrawal type
    if (!["Investment", "Profit Share", "Assistance", "Event"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid withdrawal type" },
        { status: 400 }
      );
    }

    // For Profit Share and Assistance, recipient fields are required
    if (
      (type === "Profit Share" || type === "Assistance") &&
      (!recipientEmail || !recipientName)
    ) {
      return NextResponse.json(
        {
          error:
            "Recipient name and email are required for this withdrawal type",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get admin user details
    const admin = await User.findOne({ email: session.user.email });
    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Find recipient user only if recipient email is provided
    let recipientUser: any = null;
    if (recipientEmail) {
      recipientUser = await User.findOne({ email: recipientEmail });
      if (!recipientUser) {
        return NextResponse.json(
          { error: "Recipient user not found" },
          { status: 404 }
        );
      }
    }

    // Create transaction record for the withdrawal
    // For Profit Share/Assistance: store recipient details
    // For Investment/Event: store admin details (community expenses)
    const transaction = await Transaction.create({
      userName:
        type === "Profit Share" || type === "Assistance"
          ? recipientName
          : admin.name,
      userEmail:
        type === "Profit Share" || type === "Assistance"
          ? recipientEmail
          : admin.email,
      community: communityId,
      type: type,
      status: "Completed",
      amount: amount,
      date: new Date(),
      isAdminTransaction: true,
      performedByName: performedBy || session.user.name,
      description: description,
    });

    // For Profit Share: add to user's balance (they can withdraw later)
    // For Assistance: add to balance but don't count toward withdrawal limit
    if (recipientUser && (type === "Profit Share" || type === "Assistance")) {
      await User.findOneAndUpdate(
        { email: recipientEmail },
        { $inc: { balance: amount } },
        { new: true, runValidators: false }
      );
    }

    // Update community finances: debit from totalContributions and add to totalSpending
    // All withdrawal types affect community finances
    if (communityId) {
      await Community.findByIdAndUpdate(
        communityId,
        {
          $inc: {
            totalContributions: -amount,
            totalSpending: amount,
          },
        },
        { new: true, runValidators: false }
      );

      console.log(
        `[Community Finances] Community ${communityId}: Debited ${formatNaira(
          amount
        )} from contributions, added to spending for ${type}`
      );
    }

    // Send notification to recipient (only if recipient exists)
    if (recipientUser) {
      await createNotification({
        userId: recipientUser._id,
        type: "general",
        title: `${type} Payment Received`,
        message: `You have received ${formatNaira(amount)} for ${description}`,
        actionUrl: "/dashboard/transactions",
      });
    }

    // Get all community members to notify them
    if (communityId) {
      const communityMembers = await User.find({ community: communityId });

      // Notify all community members about the withdrawal (including the recipient)
      for (const member of communityMembers) {
        await createNotification({
          userId: member._id,
          type: "general",
          title: `Community ${type} Withdrawal`,
          message: `A ${type.toLowerCase()} withdrawal of ${formatNaira(
            amount
          )} has been processed${
            recipientName ? ` for ${recipientName}` : ""
          }. ${description}`,
          actionUrl: "/dashboard/transactions",
        });
      }
    }

    console.log(
      `[Admin Withdrawal] ${type} of ${formatNaira(
        amount
      )} initiated by ${performedBy} for ${recipientEmail}`
    );

    return NextResponse.json(
      {
        message: "Withdrawal initiated successfully",
        transaction: transaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating withdrawal:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate withdrawal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "Community Admin" &&
      session.user.role !== "General Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can update withdrawals" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const { description, type, amount } = await request.json();

    await dbConnect();

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify admin belongs to the same community or is General Admin
    if (
      session.user.role === "Community Admin" &&
      transaction.community?.toString() !== session.user.community
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot update withdrawal from another community" },
        { status: 403 }
      );
    }

    // Update transaction
    const updates: any = {};
    if (description) updates.description = description;
    if (type) updates.type = type;
    if (amount) updates.amount = amount;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updates,
      { new: true, runValidators: false }
    );

    console.log(
      `[Admin Withdrawal Update] Transaction ${transactionId} updated by ${session.user.email}`
    );

    return NextResponse.json(
      {
        message: "Withdrawal updated successfully",
        transaction: updatedTransaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    return NextResponse.json(
      {
        error: "Failed to update withdrawal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "Community Admin" &&
      session.user.role !== "General Admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can delete withdrawals" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify admin belongs to the same community or is General Admin
    if (
      session.user.role === "Community Admin" &&
      transaction.community?.toString() !== session.user.community
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete withdrawal from another community" },
        { status: 403 }
      );
    }

    // Revert changes based on transaction type
    // For Profit Share and Assistance: revert user balance
    if (
      (transaction.type === "Profit Share" ||
        transaction.type === "Assistance") &&
      transaction.userEmail
    ) {
      await User.findOneAndUpdate(
        { email: transaction.userEmail },
        { $inc: { balance: -transaction.amount } },
        { new: true, runValidators: false }
      );
    }

    // Revert community finances for all withdrawal types
    if (transaction.community) {
      await Community.findByIdAndUpdate(
        transaction.community,
        {
          $inc: {
            totalContributions: transaction.amount,
            totalSpending: -transaction.amount,
          },
        },
        { new: true, runValidators: false }
      );
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(transactionId);

    // Notify community members of the deletion
    if (transaction.community) {
      const communityMembers = await User.find({
        community: transaction.community,
      });

      for (const member of communityMembers) {
        await createNotification({
          userId: member._id,
          type: "general",
          title: `Community ${transaction.type} Withdrawal Cancelled`,
          message: `A ${transaction.type.toLowerCase()} withdrawal of ${formatNaira(
            transaction.amount
          )} has been cancelled. ${transaction.description}`,
          actionUrl: "/dashboard/transactions",
        });
      }
    }

    console.log(
      `[Admin Withdrawal Delete] Transaction ${transactionId} deleted by ${session.user.email}`
    );

    return NextResponse.json(
      {
        message: "Withdrawal deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting withdrawal:", error);
    return NextResponse.json(
      {
        error: "Failed to delete withdrawal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
