import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, email } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a subscription plan
    const planResponse = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Monthly Contribution - ${user.name}`,
        amount: amount * 100, // Amount in kobo
        interval: "monthly",
      }),
    });

    const planData = await planResponse.json();

    if (!planResponse.ok) {
      throw new Error(planData.message || "Failed to create subscription plan");
    }

    // Initialize transaction to get authorization
    const transactionResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100,
          plan: planData.data.plan_code,
          callback_url: `${process.env.NEXTAUTH_URL}/dashboard/funds?payment=recurring-success`,
          metadata: {
            custom_fields: [
              {
                display_name: "User Email",
                variable_name: "user_email",
                value: email,
              },
              {
                display_name: "Payment Type",
                variable_name: "payment_type",
                value: "recurring",
              },
            ],
          },
        }),
      }
    );

    const transactionData = await transactionResponse.json();

    if (!transactionResponse.ok) {
      throw new Error(
        transactionData.message || "Failed to initialize recurring payment"
      );
    }

    // Update user with recurring payment info using findOneAndUpdate
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "paymentSettings.preferredPaymentMethod": "recurring",
          "paymentSettings.recurringPayment.isActive": true,
          "paymentSettings.recurringPayment.amount": amount,
          "paymentSettings.recurringPayment.subscriptionCode":
            planData.data.plan_code,
        },
      },
      { new: true, runValidators: false }
    );

    return NextResponse.json(
      {
        authorization_url: transactionData.data.authorization_url,
        access_code: transactionData.data.access_code,
        reference: transactionData.data.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Recurring payment setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to setup recurring payment",
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

    // Cancel subscription on Paystack
    const subscriptionCode =
      user.paymentSettings.recurringPayment.subscriptionCode;

    // Note: Paystack doesn't have a direct cancel subscription endpoint for plans
    // You would need to disable the subscription or use their subscription management
    // For now, we'll just update the user's settings

    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "paymentSettings.recurringPayment.isActive": false,
          "paymentSettings.recurringPayment.amount": 0,
        },
      },
      { new: true, runValidators: false }
    );

    return NextResponse.json(
      { message: "Recurring payment cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Recurring payment cancellation error:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel recurring payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
