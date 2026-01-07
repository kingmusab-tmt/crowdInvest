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

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a reserved account
    if (user.paymentSettings?.reservedAccountNumber) {
      return NextResponse.json({
        account: {
          accountNumber: user.paymentSettings.reservedAccountNumber,
          accountName: user.paymentSettings.reservedAccountName,
          bankName: user.paymentSettings.reservedAccountBank,
        },
      });
    }

    // Create customer on Paystack if not exists
    let customerCode = user.paymentSettings?.paystackCustomerCode;

    if (!customerCode) {
      const customerResponse = await fetch("https://api.paystack.co/customer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          first_name: user.name.split(" ")[0],
          last_name: user.name.split(" ").slice(1).join(" ") || user.name,
        }),
      });

      const customerData = await customerResponse.json();

      if (!customerResponse.ok) {
        throw new Error(customerData.message || "Failed to create customer");
      }

      customerCode = customerData.data.customer_code;
    }

    // Create dedicated virtual account
    // Note: In test mode, don't specify preferred_bank to use default test bank
    // In production, you can use "wema-bank", "titan-paystack", etc.
    const requestBody: any = {
      customer: customerCode,
    };

    // Only add preferred_bank in production mode
    const isTestMode = PAYSTACK_SECRET_KEY?.startsWith("sk_test_");
    if (!isTestMode) {
      requestBody.preferred_bank = "wema-bank";
    }

    const accountResponse = await fetch(
      "https://api.paystack.co/dedicated_account",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const accountData = await accountResponse.json();

    if (!accountResponse.ok) {
      throw new Error(
        accountData.message || "Failed to create dedicated account"
      );
    }

    // Update user with reserved account details using findOneAndUpdate to avoid validation issues
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "paymentSettings.preferredPaymentMethod": "reserved-account",
          "paymentSettings.paystackCustomerCode": customerCode,
          "paymentSettings.reservedAccountNumber":
            accountData.data.account_number,
          "paymentSettings.reservedAccountBank": accountData.data.bank.name,
          "paymentSettings.reservedAccountName": accountData.data.account_name,
        },
      },
      { new: true, runValidators: false }
    );

    return NextResponse.json(
      {
        account: {
          accountNumber: accountData.data.account_number,
          accountName: accountData.data.account_name,
          bankName: accountData.data.bank.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reserved account creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create reserved account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
