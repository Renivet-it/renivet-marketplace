"use server";

import { sendPromoOfferMessage } from "@/lib/whatsapp/index";

export type CampaignTemplateKey =
  | "campaign_launch"
  | "campaign_reminder"
  | "campaign_last_call"
  | "consciuos_click";

export async function sendSingleWhatsAppMessage(recipient: {
  full_name: string;
  phone_number: string;
  templateKey?: CampaignTemplateKey;
}) {
  try {
    const templateName = recipient.templateKey || "campaign_launch";
    // campaign_* templates have no body variables; consciuos_click needs 1 (name)
    const parameters =
      templateName === "consciuos_click" ? [recipient.full_name] : [];

    const result = await sendPromoOfferMessage({
      recipientPhoneNumber: recipient.phone_number,
      templateName,
      languageCode: "en_US",
      parameters,
    });

    const messageStatus = result.data.status || "unknown";
    const success = result.success;

    return {
      success,
      status: messageStatus,
      error: success
        ? null
        : `Failed to deliver to ${recipient.phone_number}: Status ${messageStatus}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: "failed",
      error: `Failed to send to ${recipient.phone_number}: ${err.message}`,
    };
  }
}