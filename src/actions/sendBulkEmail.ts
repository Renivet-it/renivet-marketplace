"use server";

import React from "react";
import { Resend } from "resend";
import { DynamicMarketingEmailTemplate } from "@/lib/resend/emails/bulk-email-marketing-template";

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
    const subject = formData.get("subject") as string;
    const emailContent = formData.get("emailContent") as string;

    if (!recipientsString) {
      return { success: false, message: "No recipients provided" };
    }

    const recipients: Recipient[] = JSON.parse(recipientsString);
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { success: false, message: "Invalid or empty recipient list" };
    }

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const {
          email,
          firstName,
          discount,
          expiryDate,
          brandName,
          additionalMessage,
          ctaText,
        } = recipient;

        try {
          const { error } = await resend.emails.send({
            from: "Renivet <no-reply@notifications.renivet.com>",
            to: email,
            subject: subject || `🎉 ${discount}% OFF - Limited Time Offer!`,

            // ✅ Use React.createElement instead of JSX
            react: React.createElement(DynamicMarketingEmailTemplate, {
              firstName,
              discount,
              expiryDate,
              brandName,
              additionalMessage,
              ctaText: ctaText || "Check out our Website",
              emailContent, // from ReactQuill
            }),
          });

          return {
            email,
            success: !error,
            message: error ? error.message : "Email sent successfully",
          };
        } catch (err: any) {
          console.error(`Error sending to ${email}:`, err);
          return {
            email,
            success: false,
            message: err.message || "Send failed",
          };
        }
      })
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return {
        success: false,
        message: `Failed to send ${failed.length} email(s): ${failed
          .map((r) => `${r.email}: ${r.message}`)
          .join(", ")}`,
      };
    }

    return { success: true, message: `Successfully sent ${results.length} email(s)` };
  } catch (error) {
    console.error("Bulk email error:", error);
    return { success: false, message: "Failed to process bulk email request" };
  }
}
