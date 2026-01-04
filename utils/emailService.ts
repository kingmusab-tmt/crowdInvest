import nodemailer from "nodemailer";

// Send email with reset code
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST!,
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.COMPANY_EMAIL_USER!,
    pass: process.env.COMPANY_EMAIL_PASS!,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SUPPORT_EMAIL,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}
