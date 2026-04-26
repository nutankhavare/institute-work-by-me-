import nodemailer from "nodemailer";

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email using Nodemailer via Gmail SMTP (or any SMTP provider)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  senderName?: string
): Promise<EmailResponse> {
  try {
    // 1. Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // e.g. your-institute@gmail.com
        pass: process.env.SMTP_PASS, // your 16-digit App Password
      },
    });

    const displayName = senderName || process.env.SMTP_SENDER_NAME || "Institute Admin";

    // 2. Send the mail
    const info = await transporter.sendMail({
      from: `"${displayName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Nodemailer Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Stub for SMS sending (can be implemented later with Twilio/ACS)
 */
export async function sendSms(to: string, message: string) {
  console.log(`[SMS STUB] To: ${to}, Message: ${message}`);
  return { success: false, error: "SMS channel not yet configured" };
}
