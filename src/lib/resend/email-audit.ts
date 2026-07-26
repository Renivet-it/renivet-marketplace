import { env } from "@/../env";

/**
 * Adds a private copy for operational review of customer- and brand-facing
 * transactional emails. Leave EMAIL_AUDIT_BCC unset to disable copies.
 */
export function emailAuditBcc(): { bcc?: string } {
    return env.EMAIL_AUDIT_BCC ? { bcc: env.EMAIL_AUDIT_BCC } : {};
}
