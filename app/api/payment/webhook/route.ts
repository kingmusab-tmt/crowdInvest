import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import PaymentFailure from "@/models/PaymentFailure";
import { createNotification } from "@/services/notificationService";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    await dbConnect();

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "charge.failed":
        await handleChargeFailed(event.data);
        break;

      case "dedicatedaccount.assign.success":
        await handleDedicatedAccountAssign(event.data);
        break;

      case "dedicatedaccount.assign.failed":
        console.error("Dedicated account assignment failed:", event.data);
        break;

      case "subscription.create":
        await handleSubscriptionCreate(event.data);
        break;

      case "subscription.disable":
        await handleSubscriptionDisable(event.data);
        break;

      default:
        console.log("Unhandled event type:", event.event);
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const { customer, amount, metadata, reference } = data;

    // Find user by email
    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.error("User not found for email:", customer.email);
      return;
    }

    // Convert amount from kobo to naira
    const amountInNaira = amount / 100;

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
      { email: customer.email },
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
      `Deposit processed: ₦${amountInNaira} for ${user.email} (Ref: ${reference})`
    );
  } catch (error) {
    console.error("Error handling charge success:", error);
    throw error;
  }
}

async function handleDedicatedAccountAssign(data: any) {
  try {
    const { customer, dedicated_account } = data;

    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.error("User not found for email:", customer.email);
      return;
    }

    // Update user with reserved account details
    await User.findOneAndUpdate(
      { email: customer.email },
      {
        $set: {
          "paymentSettings.reservedAccountNumber":
            dedicated_account.account_number,
          "paymentSettings.reservedAccountBank": dedicated_account.bank.name,
          "paymentSettings.reservedAccountName": dedicated_account.account_name,
          "paymentSettings.paystackCustomerCode": customer.customer_code,
        },
      },
      { new: true, runValidators: false }
    );

    // Send notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Reserved Account Created",
      message: `Your reserved account (${dedicated_account.account_number}) has been successfully created. You can now make deposits directly to this account.`,
      actionUrl: "/dashboard/funds",
    });

    console.log(`Reserved account assigned to ${user.email}`);
  } catch (error) {
    console.error("Error handling dedicated account assign:", error);
    throw error;
  }
}

async function handleSubscriptionCreate(data: any) {
  try {
    const { customer, subscription_code, authorization } = data;

    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.error("User not found for email:", customer.email);
      return;
    }

    // Update user with subscription details
    await User.findOneAndUpdate(
      { email: customer.email },
      {
        $set: {
          "paymentSettings.recurringPayment.subscriptionCode":
            subscription_code,
          "paymentSettings.recurringPayment.authorizationCode":
            authorization.authorization_code,
          "paymentSettings.recurringPayment.isActive": true,
        },
      },
      { new: true, runValidators: false }
    );

    // Send notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Recurring Payment Active",
      message: `Your recurring monthly contribution of ₦${user.paymentSettings?.recurringPayment?.amount.toLocaleString()} has been set up successfully.`,
      actionUrl: "/dashboard/funds",
    });

    console.log(`Subscription created for ${user.email}`);
  } catch (error) {
    console.error("Error handling subscription create:", error);
    throw error;
  }
}

async function handleSubscriptionDisable(data: any) {
  try {
    const { customer } = data;

    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.error("User not found for email:", customer.email);
      return;
    }

    // Update user to disable recurring payment
    await User.findOneAndUpdate(
      { email: customer.email },
      {
        $set: {
          "paymentSettings.recurringPayment.isActive": false,
        },
      },
      { new: true, runValidators: false }
    );

    // Send notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Recurring Payment Cancelled",
      message: "Your recurring monthly contribution has been cancelled.",
      actionUrl: "/dashboard/funds",
    });

    console.log(`Subscription disabled for ${user.email}`);
  } catch (error) {
    console.error("Error handling subscription disable:", error);
    throw error;
  }
}

async function handleChargeFailed(data: any) {
  try {
    const { customer, amount, gateway_response, authorization, reference } =
      data;

    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.error("User not found for email:", customer.email);
      return;
    }

    const amountInNaira = amount / 100;
    const failureReason =
      gateway_response || "Payment declined by payment gateway";

    // Create payment failure record
    const paymentFailure = await PaymentFailure.create({
      userEmail: user.email,
      userId: user._id,
      type: authorization ? "recurring" : "one-time",
      amount: amountInNaira,
      reason: failureReason,
      reference: reference,
      retryCount: 0,
      maxRetries: 3,
      nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Retry after 24 hours
      resolved: false,
    });

    // Send failure notification
    await createNotification({
      userId: user._id,
      type: "general",
      title: "Payment Failed",
      message: `Your payment of ₦${amountInNaira.toLocaleString()} failed: ${failureReason}. We'll retry in 24 hours. You can also retry manually from your dashboard.`,
      relatedData: {
        failureId: paymentFailure._id,
        failureReason,
      },
      actionUrl: "/dashboard/funds",
    });

    console.log(
      `Payment failed for ${user.email}: ${failureReason} (Ref: ${reference})`
    );
  } catch (error) {
    console.error("Error handling charge failed:", error);
    throw error;
  }
}
