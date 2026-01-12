import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { bvn, nin } = await request.json();

    // Validate inputs
    if (!bvn || !nin) {
      return NextResponse.json(
        { error: "BVN and NIN are required" },
        { status: 400 }
      );
    }

    if (bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
      return NextResponse.json(
        { error: "BVN must be exactly 11 digits" },
        { status: 400 }
      );
    }

    if (nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return NextResponse.json(
        { error: "NIN must be exactly 11 digits" },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        bvn,
        nin,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[BVN/NIN API] Updated BVN and NIN for user: ${user.email}`);

    // Trigger reserved account creation
    try {
      // Call Paystack to create reserved account with BVN and NIN
      const paystackResponse = await fetch(
        "https://api.paystack.co/dedicated_account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: user.paymentSettings?.paystackCustomerCode || user.email,
            preferred_bank: "wema", // You can make this configurable
            bvn,
            nin,
          }),
        }
      );

      const paystackData = await paystackResponse.json();

      if (paystackResponse.ok && paystackData.status) {
        const { account_number, account_name, bank_name } = paystackData.data;

        // Update user with reserved account details
        await User.findOneAndUpdate(
          { email: session.user.email },
          {
            "paymentSettings.reservedAccountNumber": account_number,
            "paymentSettings.reservedAccountName": account_name,
            "paymentSettings.reservedAccountBank": bank_name,
            "paymentSettings.preferredPaymentMethod": "reserved-account",
          }
        );

        console.log(
          `[BVN/NIN API] Reserved account created for user: ${account_number}`
        );

        return NextResponse.json(
          {
            message:
              "BVN and NIN submitted successfully. Reserved account created!",
            account: {
              accountNumber: account_number,
              accountName: account_name,
              bankName: bank_name,
            },
          },
          { status: 200 }
        );
      } else {
        console.error(
          `[BVN/NIN API] Paystack error: ${
            paystackData.message || "Unknown error"
          }`
        );

        return NextResponse.json(
          {
            message:
              "BVN and NIN saved, but reserved account creation is pending. You will be notified once your account is ready.",
            warning:
              paystackData.message || "Reserved account creation pending",
          },
          { status: 200 }
        );
      }
    } catch (paystackError) {
      console.error("[BVN/NIN API] Paystack API error:", paystackError);

      // Still return success as BVN/NIN are saved
      return NextResponse.json(
        {
          message:
            "BVN and NIN saved successfully. Reserved account will be created shortly.",
          warning:
            "Please wait while we process your reserved account request.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[BVN/NIN API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
