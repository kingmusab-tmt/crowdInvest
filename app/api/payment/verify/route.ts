import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { createNotification } from "@/services/notificationService";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status || data.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if transaction already exists for this reference
    const existingTransaction = await Transaction.findOne({
      userEmail: session.user.email,
      ["metadata.reference"]: reference,
    });

    if (existingTransaction) {
      return NextResponse.json(
        {
          message: "Payment already processed",
          amount: existingTransaction.amount,
        },
        { status: 200 }
      );
    }

    const { amount } = data.data;
    const amountInNaira = amount / 100;

    // Create transaction record
    const transaction = await Transaction.create({
      userName: user.name,
      userEmail: user.email,
      type: "Deposit",
      status: "Completed",
      amount: amountInNaira,
      date: new Date(),
    });

    // Update user balance
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $inc: { balance: amountInNaira } },
      { new: true, runValidators: false }
    );

    // Send notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Deposit Successful",
      message: `Your deposit of ₦${amountInNaira.toLocaleString()} has been credited to your account.`,
      actionUrl: "/dashboard/transactions",
    });

    console.log(
      `Payment verified and processed: ₦${amountInNaira} for ${user.email} (Ref: ${reference})`
    );

    return NextResponse.json(
      {
        message: "Payment verified successfully",
        amount: amountInNaira,
        transactionId: transaction._id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
