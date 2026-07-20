import { NextResponse } from "next/server";
import dbConnect from "@/utils/connectDB";
import { getPlatformSettings } from "@/utils/getPlatformSettings";

// Public, unauthenticated subset of platform settings — safe to expose to
// any visitor (branding, legal text, maintenance status, theme colors).
// Never include payment/security internals here.
export async function GET() {
  try {
    await dbConnect();
    const settings = await getPlatformSettings();

    return NextResponse.json(
      {
        platformName: settings.platformName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        currencyCode: settings.currencyCode,
        currencySymbol: settings.currencySymbol,
        footerText: settings.footerText,
        minimumContribution: settings.minimumContribution,
        minimumWithdrawal: settings.minimumWithdrawal,
        enabledInvestmentTypes: settings.enabledInvestmentTypes,
        legal: {
          termsAndConditions: settings.legal.termsAndConditions,
          privacyPolicy: settings.legal.privacyPolicy,
          maintenanceMode: settings.legal.maintenanceMode,
          maintenanceMessage: settings.legal.maintenanceMessage,
        },
        appearance: settings.appearance,
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=30" },
      }
    );
  } catch (err) {
    console.error("Error fetching public platform settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}
