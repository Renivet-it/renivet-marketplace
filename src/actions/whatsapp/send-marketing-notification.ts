"use server";

import { whatsappMessageLogQueries } from "@/lib/db/queries/whatsapp";
import { sendPromoOfferMessage } from "@/lib/whatsapp/index";

export type CampaignTemplateKey =
  | "renivet_story_1"
  | "renivet_story_2"
  | "renivet_story_3"
  | "renivet_story_4"
  | "renivet_story_5"
  | "renivet_story_6"
  | "renivet_story_7";

const TEMPLATE_NAMES: Record<CampaignTemplateKey, string> = {
  renivet_story_1: "Story Behind It",
  renivet_story_2: "Part Of Your Life",
  renivet_story_3: "Less Like Scrolling",
  renivet_story_4: "Things That Mean Something",
  renivet_story_5: "Something Different",
  renivet_story_6: "Stumble Upon Beauty",
  renivet_story_7: "Better Stories Than Ads",
};

export type WhatsAppMessageLog = {
  id: string;
  fullName: string;
  phoneNumber: string;
  templateKey: CampaignTemplateKey;
  templateName: string;
  status: string;
  success: boolean;
  sid: string | null;
  error: string | null;
  attempts: number;
  sentAt: string;
};

function serializeLog(log: {
  id: string;
  fullName: string;
  phoneNumber: string;
  templateKey: string;
  templateName: string;
  status: string;
  success: boolean;
  sid: string | null;
  error: string | null;
  attempts: number;
  sentAt: Date;
}): WhatsAppMessageLog {
  return {
    id: log.id,
    fullName: log.fullName,
    phoneNumber: log.phoneNumber,
    templateKey: log.templateKey as CampaignTemplateKey,
    templateName: log.templateName,
    status: log.status,
    success: log.success,
    sid: log.sid,
    error: log.error,
    attempts: log.attempts,
    sentAt: log.sentAt.toISOString(),
  };
}

export async function sendSingleWhatsAppMessage(recipient: {
  full_name: string;
  phone_number: string;
  templateKey?: CampaignTemplateKey;
  attempts?: number;
}) {
  const templateName = recipient.templateKey || "renivet_story_1";
  const attempts = recipient.attempts ?? 1;

  try {
    const result = await sendPromoOfferMessage({
      recipientPhoneNumber: recipient.phone_number,
      templateName,
      languageCode: "en_US",
      parameters: [],
    });

    const messageStatus = result.data.status || "unknown";
    const success = result.success;

    const log = await whatsappMessageLogQueries.createLog({
      fullName: recipient.full_name,
      phoneNumber: recipient.phone_number,
      templateKey: templateName,
      templateName: TEMPLATE_NAMES[templateName],
      status: messageStatus,
      success,
      sid: result.data.sid,
      error: success
        ? null
        : `Failed to deliver to ${recipient.phone_number}: Status ${messageStatus}`,
      attempts,
      sentAt: new Date(),
    });

    return {
      success,
      status: messageStatus,
      sid: result.data.sid,
      log: serializeLog(log),
      error: success
        ? null
        : `Failed to deliver to ${recipient.phone_number}: Status ${messageStatus}`,
    };
  } catch (err: any) {
    const error = `Failed to send to ${recipient.phone_number}: ${err.message}`;
    const log = await whatsappMessageLogQueries.createLog({
      fullName: recipient.full_name,
      phoneNumber: recipient.phone_number,
      templateKey: templateName,
      templateName: TEMPLATE_NAMES[templateName],
      status: "failed",
      success: false,
      sid: null,
      error,
      attempts,
      sentAt: new Date(),
    });

    return {
      success: false,
      status: "failed",
      sid: null,
      log: serializeLog(log),
      error,
    };
  }
}

export async function getWhatsAppMessageLogs() {
  const logs = await whatsappMessageLogQueries.getLogs();
  return logs.map(serializeLog);
}

export async function retryWhatsAppMessageLog(logId: string) {
  const logs = await whatsappMessageLogQueries.getLogsByIds([logId]);
  const log = logs[0];

  if (!log) {
    return {
      success: false,
      error: "Log not found",
      log: null,
    };
  }

  return sendSingleWhatsAppMessage({
    full_name: log.fullName,
    phone_number: log.phoneNumber,
    templateKey: log.templateKey as CampaignTemplateKey,
    attempts: log.attempts + 1,
  });
}

export async function retrySelectedWhatsAppMessageLogs(logIds: string[]) {
  const logs = await whatsappMessageLogQueries.getLogsByIds(logIds);
  const results = [];

  for (const log of logs) {
    results.push(
      await sendSingleWhatsAppMessage({
        full_name: log.fullName,
        phone_number: log.phoneNumber,
        templateKey: log.templateKey as CampaignTemplateKey,
        attempts: log.attempts + 1,
      })
    );
  }

  return results;
}

export async function clearWhatsAppMessageLogs() {
  await whatsappMessageLogQueries.clearLogs();
  return { success: true };
}
