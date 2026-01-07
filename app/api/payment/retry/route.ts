import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";
import PaymentFailure from "@/models/PaymentFailure";
import Transaction from "@/models/Transaction";
import { createNotification } from "@/services/notificationService";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get pending payment failures for the user
    const failures = await PaymentFailure.find({
      userEmail: session.user.email,
      resolved: false,
      retryCount: { $lt: 3 },
    }).sort({ failedAt: -1 });

    return NextResponse.json(failures, { status: 200 });
  } catch (error) {
    console.error("Error fetching payment failures:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch payment failures",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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

    const { failureId } = await request.json();

    if (!failureId) {
      return NextResponse.json(
        { error: "Failure ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const paymentFailure = await PaymentFailure.findOne({
      _id: failureId,
      userEmail: session.user.email,
      resolved: false,
    });

    if (!paymentFailure) {
      return NextResponse.json(
        { error: "Payment failure record not found" },
        { status: 404 }
      );
    }

    if (paymentFailure.retryCount >= paymentFailure.maxRetries) {
      return NextResponse.json(
        { error: "Maximum retries exceeded. Please contact support." },
        { status: 400 }
      );
    }

    // If it's a recurring payment, use authorization code to retry
    if (
      paymentFailure.type === "recurring" &&
      user.paymentSettings?.recurringPayment?.authorizationCode
    ) {
      const authorizationCode =
        user.paymentSettings.recurringPayment.authorizationCode;

      const chargeResponse = await fetch("https://api.paystack.co/charge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorization_code: authorizationCode,
          email: user.email,
          amount: paymentFailure.amount * 100,
          metadata: {
            custom_fields: [
              {
                display_name: "Charge Type",
                variable_name: "charge_type",
                value: "retry",
              },
            ],
          },
        }),
      });

      const chargeData = await chargeResponse.json();

      if (chargeResponse.ok && chargeData.data.status === "success") {
        // Charge successful
        const amountInNaira =
          (chargeData.data.amount || paymentFailure.amount * 100) / 100;

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

        // Mark payment failure as resolved
        await PaymentFailure.findOneAndUpdate(
          { _id: failureId },
          {
            $set: {
              resolved: true,
              resolvedAt: new Date(),
            },
          },
          { new: true, runValidators: false }
        );

        // Send success notification
        await createNotification({
          userId: user._id,
          type: "general",
          title: "Payment Retry Successful",
          message: `Your retry payment of ₦${amountInNaira.toLocaleString()} has been processed successfully.`,
          actionUrl: "/dashboard/transactions",
        });

        return NextResponse.json(
          {
            message: "Payment retry successful",
            amount: amountInNaira,
          },
          { status: 200 }
        );
      } else {
        // Charge failed again, increment retry count
        const failureReason =
          chargeData.data?.gateway_response || "Payment processing failed";

        await PaymentFailure.findOneAndUpdate(
          { _id: failureId },
          {
            $inc: { retryCount: 1 },
            $set: {
              reason: failureReason,
              nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
          { new: true, runValidators: false }
        );

        return NextResponse.json(
          { error: failureReason || "Charge failed" },
          { status: 400 }
        );
      }
    } else {
      // For one-time payments, user must use Paystack link again
      return NextResponse.json(
        {
          error:
            "One-time payment retry requires new authorization from Paystack",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment retry error:", error);
    return NextResponse.json(
      {
        error: "Failed to retry payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
