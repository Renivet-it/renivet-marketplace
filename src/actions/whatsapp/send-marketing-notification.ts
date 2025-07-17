"use server";

import { sendPromoOfferMessage } from "@/lib/whatsapp/index";

export async function sendSingleWhatsAppMessage(recipient: {
  full_name: string;
  phone_number: string;

}) {
  try {
    const result = await sendPromoOfferMessage({
      recipientPhoneNumber: recipient.phone_number,
      templateName: "intro_message1_2025",
      languageCode: "en_US",
      parameters: [recipient.full_name],
    });

    const messageStatus = result.data.status || "unknown";
    const success = result.success;

    return {
      success,
      status: messageStatus,
      error: success ? null : `Failed to deliver to ${recipient.phone_number}: Status ${messageStatus}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: "failed",
      error: `Failed to send to ${recipient.phone_number}: ${err.message}`,
    };
  }
}