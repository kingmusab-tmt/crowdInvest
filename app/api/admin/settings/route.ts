import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/auth";
import dbConnect from "@/utils/connectDB";
import { getPlatformSettings } from "@/utils/getPlatformSettings";
import { INVESTMENT_TYPE_VALUES } from "@/lib/investmentTypes";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "Admin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await dbConnect();
    const settings = await getPlatformSettings();

    const paystackStatus = {
      secretKeyConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      keyMode: process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_live_")
        ? "live"
        : process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_")
        ? "test"
        : "unknown",
    };

    return NextResponse.json(
      { ...settings.toObject(), paystackStatus },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching platform settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    await dbConnect();

    const body = await request.json();

    // Only accept known top-level sections to avoid arbitrary field injection
    const allowedTopLevel = [
      "platformName",
      "tagline",
      "logoUrl",
      "faviconUrl",
      "supportEmail",
      "supportPhone",
      "currencyCode",
      "currencySymbol",
      "footerText",
      "minimumContribution",
      "minimumWithdrawal",
      "autoApproveWithdrawalUnder",
      "enabledInvestmentTypes",
      "kyc",
      "notifications",
      "payment",
      "security",
      "legal",
      "appearance",
    ];

    if (body.enabledInvestmentTypes) {
      const valid = body.enabledInvestmentTypes.every((t: string) =>
        (INVESTMENT_TYPE_VALUES as readonly string[]).includes(t)
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid investment type in enabledInvestmentTypes" },
          { status: 400 }
        );
      }
    }

    const settings = await getPlatformSettings();

    for (const key of allowedTopLevel) {
      if (body[key] !== undefined) {
        (settings as any).set(key, body[key]);
      }
    }
    settings.updatedBy = session!.user!.id as any;

    await settings.save();

    return NextResponse.json(
      { message: "Platform settings updated successfully", settings },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating platform settings:", err);
    return NextResponse.json(
      {
        error: "Failed to update platform settings",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
