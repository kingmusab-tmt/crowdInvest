import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/emailService";

const CONTACT_EMAIL = "info@triplemultipurposetechnology.com.ng";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, organization, email, phone, communitySize, message } = body;

    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: "Name, organization, and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2>New CrowdInvest Access Request</h2>
          <p>A potential customer has requested access to CrowdInvest for their community.</p>
          <table cellpadding="8" style="border-collapse: collapse;">
            <tr><td style="font-weight: bold;">Name</td><td>${name}</td></tr>
            <tr><td style="font-weight: bold;">Organization / Community</td><td>${organization}</td></tr>
            <tr><td style="font-weight: bold;">Email</td><td>${email}</td></tr>
            <tr><td style="font-weight: bold;">Phone</td><td>${phone || "Not provided"}</td></tr>
            <tr><td style="font-weight: bold;">Community Size</td><td>${communitySize || "Not provided"}</td></tr>
            <tr><td style="font-weight: bold; vertical-align: top;">Message</td><td>${message || "Not provided"}</td></tr>
          </table>
        </body>
      </html>
    `;

    await sendEmail({
      to: CONTACT_EMAIL,
      subject: `New CrowdInvest Access Request from ${name}`,
      html,
      fromName: "CrowdInvest Website",
      replyTo: email,
    });

    return NextResponse.json(
      { message: "Request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting access request:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again later." },
      { status: 500 }
    );
  }
}
