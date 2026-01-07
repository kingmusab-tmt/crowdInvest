import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recurringPayment = user.paymentSettings?.recurringPayment;

    if (!recurringPayment || !recurringPayment.isActive) {
      return NextResponse.json(
        { error: "No active recurring payment found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recurringPayment, { status: 200 });
  } catch (error) {
    console.error("Error fetching recurring payment details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recurring payment details",
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

    const { newAmount } = await request.json();

    if (!newAmount || newAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.paymentSettings?.recurringPayment?.subscriptionCode) {
      return NextResponse.json(
        { error: "No active recurring payment found" },
        { status: 404 }
      );
    }

    // Update subscription plan with new amount
    const subscriptionCode =
      user.paymentSettings.recurringPayment.subscriptionCode;

    const response = await fetch(
      `https://api.paystack.co/subscription/${subscriptionCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: newAmount * 100, // Convert to kobo
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update subscription plan");
    }

    // Update user's recurring payment amount
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "paymentSettings.recurringPayment.amount": newAmount,
        },
      },
      { new: true, runValidators: false }
    );

    return NextResponse.json(
      {
        message: "Recurring payment amount updated successfully",
        newAmount: newAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating recurring payment:", error);
    return NextResponse.json(
      {
        error: "Failed to update recurring payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
