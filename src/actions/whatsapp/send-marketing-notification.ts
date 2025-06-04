"use server";

import { sendPromoOfferMessage } from "@/lib/whatsapp/index";

export async function sendWhatsAppMessages(data: {
  data: Array<{ full_name: string; phone_number: string; discount: string; expiry_date: string }>;
}) {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const row of data.data) {
      try {
        const result = await sendPromoOfferMessage({
          recipientPhoneNumber: row.phone_number,
          template: "promo_offer_2025",
          lang: "en_US",
          // @ts-ignore
          parameters: [row.full_name, row.discount, row.expiry_date],
        });
        if (result.success) {
          successCount++;
        }
      } catch (err: any) {
        errors.push(`Failed to send to ${row.phone_number}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        error: `Sent ${successCount} messages, but encountered errors: ${errors.join("; ")}`,
        successCount,
      };
    }

    return { successCount };
  } catch (err: any) {
    return { error: err.message || "Failed to process WhatsApp messages", successCount: 0 };
  }
}