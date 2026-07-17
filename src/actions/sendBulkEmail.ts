"use server";

import React from "react";
import { emailMessageLogQueries } from "@/lib/db/queries/email";
import { DynamicMarketingEmailTemplate } from "@/lib/resend/emails/bulk-email-marketing-template";
import {
  buildUnsubscribeUrl,
  createMarketingCampaign,
  sendMarketingEmail,
  updateMarketingCampaignStatus,
} from "@/lib/marketing/email";

type Recipient = {
  email: string;
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  additionalMessage?: string;
  ctaText?: string;
};

export type EmailMessageLog = {
  id: string;
  email: string;
  firstName: string | null;
  subject: string;
  status: string;
  success: boolean;
  messageId: string | null;
  error: string | null;
  attempts: number;
  sentAt: string;
};

function serializeEmailLog(log: {
  id: string;
  email: string;
  firstName: string | null;
  subject: string;
  status: string;
  success: boolean;
  messageId: string | null;
  error: string | null;
  attempts: number;
  sentAt: Date;
}): EmailMessageLog {
  return {
    id: log.id,
    email: log.email,
    firstName: log.firstName,
    subject: log.subject,
    status: log.status,
    success: log.success,
    messageId: log.messageId,
    error: log.error,
    attempts: log.attempts,
    sentAt: log.sentAt.toISOString(),
  };
}

async function sendSingleMarketingEmail({
  recipient,
  subject,
  emailContent,
  campaignId,
  attempts = 1,
}: {
  recipient: Recipient;
  subject: string;
  emailContent: string;
  campaignId?: string | null;
  attempts?: number;
}) {
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
    const unsubscribeUrl = await buildUnsubscribeUrl(email);
    const result = await sendMarketingEmail({
      email,
      firstName,
      name: firstName,
      subject: subject || `${discount}% OFF - Limited Time Offer!`,
      emailContent,
      campaignType: "promotional",
      campaignId,
      attempts,
      source: "manual_campaign",
      react: React.createElement(DynamicMarketingEmailTemplate, {
        firstName,
        discount,
        expiryDate,
        brandName,
        additionalMessage,
        ctaText: ctaText || "Check out our Website",
        emailContent,
        unsubscribeUrl,
      }),
      metadata: {
        discount,
        expiryDate,
        brandName,
      },
    });

    return {
      email,
      success: result.ok,
      message:
        result.ok
          ? "Email sent successfully"
          : result.reason === "inactive"
            ? "Subscriber is unsubscribed"
            : result.reason === "frequency_cap"
              ? "Subscriber hit marketing send cap"
              : result.log.error ?? "Email failed",
      log: serializeEmailLog(result.log),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Send failed";
    const log = await emailMessageLogQueries.createLog({
      email,
      firstName,
      subject,
      emailContent,
      status: "failed",
      success: false,
      messageId: null,
      error: message,
      attempts,
      sentAt: new Date(),
    });

    console.error(`Error sending to ${email}:`, err);
    return {
      email,
      success: false,
      message,
      log: serializeEmailLog(log),
    };
  }
}

export async function sendBulkEmail(formData: FormData) {
  try {
    const recipientsString = formData.get("recipients") as string;
    const subject = formData.get("subject") as string;
    const emailContent = formData.get("emailContent") as string;

    if (!recipientsString) {
      return { success: false, message: "No recipients provided", logs: [] };
    }

    const recipients: Recipient[] = JSON.parse(recipientsString);
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return {
        success: false,
        message: "Invalid or empty recipient list",
        logs: [],
      };
    }

    const campaign = await createMarketingCampaign({
      name: subject || `Promotional campaign ${new Date().toISOString()}`,
      type: "promotional",
      subject: subject || "Renivet promotion",
      contentHtml: emailContent,
      status: "sending",
      metadata: {
        recipientCount: recipients.length,
      },
    });

    const results = await Promise.all(
      recipients.map((recipient) =>
        sendSingleMarketingEmail({
          recipient,
          subject,
          emailContent,
          campaignId: campaign.id,
        })
      )
    );

    const failed = results.filter((r) => !r.success);
    await updateMarketingCampaignStatus(
      campaign.id,
      failed.length > 0 ? "failed" : "completed"
    );
    if (failed.length > 0) {
      return {
        success: false,
        logs: results.map((result) => result.log),
        message: `Failed to send ${failed.length} email(s): ${failed
          .map((r) => `${r.email}: ${r.message}`)
          .join(", ")}`,
      };
    }

    return {
      success: true,
      logs: results.map((result) => result.log),
      message: `Successfully sent ${results.length} email(s)`,
    };
  } catch (error) {
    console.error("Bulk email error:", error);
    return {
      success: false,
      message: "Failed to process bulk email request",
      logs: [],
    };
  }
}

export async function getEmailMessageLogs() {
  const logs = await emailMessageLogQueries.getLogs();
  return logs.map(serializeEmailLog);
}

export async function retrySelectedEmailMessageLogs(logIds: string[]) {
  const logs = await emailMessageLogQueries.getLogsByIds(logIds);
  const results = [];

  for (const log of logs) {
    results.push(
      await sendSingleMarketingEmail({
        recipient: {
          email: log.email,
          firstName: log.firstName ?? "",
          discount: "",
          expiryDate: "",
          brandName: "Renivet",
        },
        subject: log.subject,
        emailContent: log.emailContent,
        attempts: log.attempts + 1,
      })
    );
  }

  return results;
}

export async function clearEmailMessageLogs() {
  await emailMessageLogQueries.clearLogs();
  return { success: true };
}
