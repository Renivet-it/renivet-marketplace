import { monitoringSlaQueries } from "@/lib/db/queries";

type AuditEntityChangeInput = {
    actorId?: string | null;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeValue?: Record<string, unknown> | null;
    afterValue?: Record<string, unknown> | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
};

type AlertChangeInput = {
    actorId?: string | null;
    entityType: string;
    entityId: string;
    title: string;
    message: string;
    severity?: "info" | "warning" | "critical";
    ownerRole?: string;
    type?: string;
    dedupeKey?: string;
    channels?: Array<"admin" | "email" | "whatsapp">;
    metadata?: Record<string, unknown>;
};

export async function auditEntityChange(input: AuditEntityChangeInput) {
    return monitoringSlaQueries.writeAudit({
        userId: input.actorId,
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeValue: input.beforeValue,
        afterValue: input.afterValue,
        reason: input.reason,
        metadata: input.metadata ?? {},
    });
}

export async function createOperationalAlert(input: AlertChangeInput) {
    return monitoringSlaQueries.createAlert({
        type: input.type ?? "operational_event",
        severity: input.severity ?? "info",
        entityType: input.entityType,
        entityId: input.entityId,
        title: input.title,
        message: input.message,
        ownerId: input.actorId,
        ownerRole: input.ownerRole,
        channels: input.channels ?? ["admin"],
        dedupeKey:
            input.dedupeKey ??
            `${input.type ?? "operational_event"}:${input.entityType}:${input.entityId}`,
        metadata: input.metadata ?? {},
    });
}

export async function auditAndAlert(input: AuditEntityChangeInput & AlertChangeInput) {
    await auditEntityChange(input);
    return createOperationalAlert(input);
}
