import { WhatsappNotificationModuleKey } from "@/lib/validations";

export const DEFAULT_SUPPORT_WHATSAPP_NUMBERS = [
    "7001047092",
    "8983676772",
    "7356499350",
] as const;

export const DEFAULT_SLA_WHATSAPP_NUMBERS = [
    "7001047092",
    "8983676772",
    "7356499350",
] as const;

export const WHATSAPP_NOTIFICATION_MODULE_LABELS: Record<
    WhatsappNotificationModuleKey,
    string
> = {
    support: "Support",
    sla: "SLA",
};
