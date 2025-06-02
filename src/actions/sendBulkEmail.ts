"use server";

import { Resend } from "resend";
import { MarketingEmailTemplate } from "@/lib/resend/emails/bulk-email-marketing-template";

const resend = new Resend(process.env.RESEND_API_KEY);

type Recipient = {
  email: string;
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  additionalMessage?: string;
  ctaText?: string;
};

export async function sendBulkEmail(formData: FormData) {
  try {
    const recipientsString = formData.get("recipients") as string;
    if (!recipientsString) {
      return { success: false, message: "No recipients provided" };
    }

    const recipients: Recipient[] = JSON.parse(recipientsString);
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { success: false, message: "Invalid or empty recipient list" };
    }

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const { email, firstName, discount, expiryDate, brandName, additionalMessage, ctaText } = recipient;

        const { data, error } = await resend.emails.send({
          from: "Renivet <no-reply@notifications.renivet.com>",
          to: email,
          subject: `🎉 ${discount}% OFF - Limited Time Offer!`,
          // @ts-ignore
          react: MarketingEmailTemplate({
            firstName,
            discount,
            expiryDate,
            brandName,
            additionalMessage,
            ctaText: ctaText || "Redeem Now",
          }),
        });

        return { email, success: !error, message: error ? error.message : "Email sent successfully" };
      })
    );

    const failedEmails = results.filter((result) => !result.success);
    if (failedEmails.length > 0) {
      return {
        success: false,
        message: `Failed to send ${failedEmails.length} email(s): ${failedEmails.map((r) => `${r.email}: ${r.message}`).join(", ")}`,
      };
    }

    return { success: true, message: `Successfully sent ${results.length} email(s)` };
  } catch (error) {
    return { success: false, message: "Failed to process bulk email request" };
  }
}