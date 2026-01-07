import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";

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

    // Initialize Paystack transaction
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100, // Paystack expects amount in kobo
          callback_url: `${process.env.NEXTAUTH_URL}/dashboard/funds?payment=success`,
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
                value: "deposit",
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to initialize payment");
    }

    return NextResponse.json(
      {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
