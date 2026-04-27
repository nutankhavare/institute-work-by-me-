import { EmailClient } from "@azure/communication-email";

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email using Azure Communication Services
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  senderName?: string
): Promise<EmailResponse> {
  try {
    const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
    const senderAddress = process.env.SENDER_EMAIL_ADDRESS; // e.g., DoNotReply@xxxx-xxxx.azurecomm.net

    if (!connectionString || !senderAddress) {
      console.warn("Azure Communication Services is not fully configured (missing env vars).");
      return { success: false, error: "Email service not configured." };
    }

    const client = new EmailClient(connectionString);
    const displayName = senderName || "Institute Admin";

    const emailMessage = {
      senderAddress: senderAddress,
      content: {
        subject: subject,
        html: html,
      },
      recipients: {
        to: [{ address: to, displayName: to }],
      },
      // You could theoretically set replyTo to a different address
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    if (result.status === "Succeeded") {
      return { success: true, messageId: result.id };
    } else {
      return { success: false, error: result.error?.message || "Send failed" };
    }
  } catch (error: any) {
    console.error("Azure Email Error:", error);
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
