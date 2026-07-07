import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "..";
import { auditLogs } from "../schema";

const financeEntityMap: Record<string, string> = {
    refund: "refund",
    payout_cycle: "payout",
    brand_payout: "payout",
    brand_payout_config: "brand_bank_details",
    commission_rule: "commission_rule",
    cod_reconciliation: "cod_reconciliation",
    gst_report_run: "gst_report",
    brand_tds_tracking: "tds_deduction",
    brand_payout_override: "payout_override",
    pl_manual_entry: "p_and_l_entry",
    pl_snapshot: "p_and_l_entry",
    module_access: "module_access",
    data_deletion_request: "data_deletion",
    legal_contact: "legal_contact",
    platform_setting: "platform_settings",
    platform_settings: "platform_settings",
    brand_sustainability_cert: "sustainability_cert",
};

function deriveFinanceActorType(userId?: string | null, actorType?: string | null) {
    if (actorType) return actorType;
    if (!userId || userId === "system" || userId === "cron" || userId.includes("webhook")) {
        return "system";
    }
    if (userId.startsWith("brand_")) return "brand";
    if (userId.startsWith("cust_")) return "customer";
    return "admin";
}

function normalizeFinanceAction(actionType: string) {
    const value = actionType.toLowerCase();
    if (value.includes("written_off") || value.includes("write_off")) return "written_off";
    if (value.includes("unlocked")) return "unlocked";
    if (value.includes("locked")) return "locked";
    if (value.includes("export")) return "exported";
    if (value.includes("override")) return "overridden";
    if (value.includes("approve")) return "approved";
    if (value.includes("reject")) return "rejected";
    if (value.includes("execute") || value.includes("processed") || value.includes("completed")) return "executed";
    if (value.includes("escalat") || value.includes("sla_")) return "escalated";
    if (value.includes("delete")) return "deleted";
    if (
        value.includes("update") ||
        value.includes("failed") ||
        value.includes("changed") ||
        value.includes("verified") ||
        value.includes("received") ||
        value.includes("qc_") ||
        value.includes("started")
    ) {
        return "updated";
    }
    return "created";
}

function pickFinanceAttachment(input: AuditLogInput) {
    if (input.attachmentUrl) return input.attachmentUrl;
    if (typeof input.metadata?.attachmentUrl === "string") return input.metadata.attachmentUrl;
    if (typeof input.metadata?.proofFileUrl === "string") return input.metadata.proofFileUrl;
    if (typeof input.metadata?.fileUrl === "string") return input.metadata.fileUrl;
    return null;
}

export type AuditLogInput = {
    userId?: string | null;
    actorType?: string | null;
    userRoleSnapshot?: string | null;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeValue?: Record<string, unknown> | null;
    afterValue?: Record<string, unknown> | null;
    reason?: string | null;
    attachmentUrl?: string | null;
    ipAddress?: string | null;
    sessionId?: string | null;
    metadata?: Record<string, unknown>;
};

export type AuditLogFilters = {
    entityType?: string;
    entityId?: string;
    actionType?: string;
    userId?: string;
    actorType?: string;
    q?: string;
    from?: Date;
    to?: Date;
    module?: string;
    attachmentOnly?: boolean;
    limit?: number;
};

class AuditLogQuery {
    async write(input: AuditLogInput) {
        const isFinanceAudit = input.metadata?.module === "finance_compliance";
        const normalizedEntityType = isFinanceAudit
            ? (financeEntityMap[input.entityType] ?? input.entityType)
            : input.entityType;
        const normalizedActionType = isFinanceAudit
            ? normalizeFinanceAction(input.actionType)
            : input.actionType;
        const normalizedActorType = isFinanceAudit
            ? deriveFinanceActorType(input.userId, input.actorType)
            : (input.actorType ?? null);
        const attachmentUrl = isFinanceAudit ? pickFinanceAttachment(input) : (input.attachmentUrl ?? null);

        return db
            .insert(auditLogs)
            .values({
                userId: input.userId,
                actorType: normalizedActorType,
                userRoleSnapshot: input.userRoleSnapshot,
                actionType: normalizedActionType,
                entityType: normalizedEntityType,
                entityId: input.entityId,
                beforeValue: input.beforeValue,
                afterValue: input.afterValue,
                reason: input.reason,
                attachmentUrl,
                ipAddress: input.ipAddress,
                sessionId: input.sessionId,
                metadata: isFinanceAudit
                    ? {
                          ...(input.metadata ?? {}),
                          financeEventCode: input.actionType,
                          financeSourceEntityType: input.entityType,
                      }
                    : (input.metadata ?? {}),
            })
            .returning()
            .then((res) => res[0]);
    }

    async list(filters: AuditLogFilters = {}) {
        const clauses = [
            filters.entityType ? eq(auditLogs.entityType, filters.entityType) : undefined,
            filters.entityId ? eq(auditLogs.entityId, filters.entityId) : undefined,
            filters.actionType ? eq(auditLogs.actionType, filters.actionType) : undefined,
            filters.userId ? eq(auditLogs.userId, filters.userId) : undefined,
            filters.actorType ? eq(auditLogs.actorType, filters.actorType) : undefined,
            filters.q
                ? sql`(
                    ${auditLogs.reason} ILIKE ${`%${filters.q}%`}
                    OR ${auditLogs.entityId} ILIKE ${`%${filters.q}%`}
                    OR ${auditLogs.actionType} ILIKE ${`%${filters.q}%`}
                    OR COALESCE(${auditLogs.metadata} ->> 'financeEventCode', '') ILIKE ${`%${filters.q}%`}
                )`
                : undefined,
            filters.from ? gte(auditLogs.timestampUtc, filters.from) : undefined,
            filters.to ? lte(auditLogs.timestampUtc, filters.to) : undefined,
            filters.module ? sql`${auditLogs.metadata} ->> 'module' = ${filters.module}` : undefined,
            filters.attachmentOnly ? sql`${auditLogs.attachmentUrl} IS NOT NULL` : undefined,
        ].filter(Boolean);

        return db.query.auditLogs.findMany({
            where: clauses.length ? and(...clauses) : undefined,
            orderBy: [desc(auditLogs.timestampUtc)],
            limit: filters.limit ?? 100,
        });
    }

    async voidEntry(id: string, actorId: string, reason: string) {
        throw new Error(
            `Audit logs are append-only and cannot be mutated. Attempted by ${actorId} for ${id}: ${reason}`
        );
    }
}

export const auditLogQueries = new AuditLogQuery();
