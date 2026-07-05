import { auditLogQueries } from "@/lib/db/queries";

export async function writeFinanceAuditEvent(input: {
    actorId?: string | null;
    actionType: string;
    entityType: string;
    entityId: string;
    reason?: string | null;
    beforeValue?: Record<string, unknown> | null;
    afterValue?: Record<string, unknown> | null;
    metadata?: Record<string, unknown>;
}) {
    return auditLogQueries.write({
        userId: input.actorId ?? null,
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason ?? null,
        beforeValue: input.beforeValue ?? null,
        afterValue: input.afterValue ?? null,
        metadata: {
            module: "finance_compliance",
            ...(input.metadata ?? {}),
        },
    });
}
