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

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      !user.paymentSettings?.recurringPayment?.isActive ||
      !user.paymentSettings?.recurringPayment?.authorizationCode
    ) {
      return NextResponse.json(
        { error: "No active recurring payment found" },
        { status: 404 }
      );
    }

    const amount = user.paymentSettings.recurringPayment.amount;
    const authorizationCode =
      user.paymentSettings.recurringPayment.authorizationCode;

    // Manually charge the user
    const chargeResponse = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorization_code: authorizationCode,
        email: user.email,
        amount: amount * 100, // Convert to kobo
        metadata: {
          custom_fields: [
            {
              display_name: "Charge Type",
              variable_name: "charge_type",
              value: "manual_recurring",
            },
          ],
        },
      }),
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok || chargeData.data.status !== "success") {
      // Charge failed
      const failureReason =
        chargeData.data.gateway_response || "Payment processing failed";

      await createNotification({
        userId: user._id,
        type: "general",
        title: "Manual Recurring Charge Failed",
        message: `Your manual recurring charge of ₦${amount.toLocaleString()} failed: ${failureReason}. Please try again or use another payment method.`,
        actionUrl: "/dashboard/funds",
      });

      return NextResponse.json(
        { error: failureReason || "Charge failed" },
        { status: 400 }
      );
    }

    // Charge successful
    const amountInNaira = (chargeData.data.amount || amount * 100) / 100;

    // Create transaction record
    await Transaction.create({
      userName: user.name,
      userEmail: user.email,
      type: "Deposit",
      status: "Completed",
      amount: amountInNaira,
      date: new Date(),
    });

    // Update user balance
    await User.findOneAndUpdate(
      { email: user.email },
      { $inc: { balance: amountInNaira } },
      { new: true, runValidators: false }
    );

    // Send success notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Manual Recurring Charge Successful",
      message: `Your manual recurring charge of ₦${amountInNaira.toLocaleString()} has been processed successfully.`,
      actionUrl: "/dashboard/transactions",
    });

    return NextResponse.json(
      {
        message: "Manual charge processed successfully",
        amount: amountInNaira,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Manual charge error:", error);
    return NextResponse.json(
      {
        error: "Failed to process manual charge",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
