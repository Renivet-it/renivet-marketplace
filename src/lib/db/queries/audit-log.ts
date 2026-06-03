import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "..";
import { auditLogs } from "../schema";

export type AuditLogInput = {
    userId?: string | null;
    userRoleSnapshot?: string | null;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeValue?: Record<string, unknown> | null;
    afterValue?: Record<string, unknown> | null;
    reason?: string | null;
    ipAddress?: string | null;
    sessionId?: string | null;
    metadata?: Record<string, unknown>;
};

export type AuditLogFilters = {
    entityType?: string;
    entityId?: string;
    actionType?: string;
    userId?: string;
    q?: string;
    from?: Date;
    to?: Date;
    limit?: number;
};

class AuditLogQuery {
    async write(input: AuditLogInput) {
        return db
            .insert(auditLogs)
            .values({
                userId: input.userId,
                userRoleSnapshot: input.userRoleSnapshot,
                actionType: input.actionType,
                entityType: input.entityType,
                entityId: input.entityId,
                beforeValue: input.beforeValue,
                afterValue: input.afterValue,
                reason: input.reason,
                ipAddress: input.ipAddress,
                sessionId: input.sessionId,
                metadata: input.metadata ?? {},
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
            filters.q ? ilike(auditLogs.reason, `%${filters.q}%`) : undefined,
            filters.from ? gte(auditLogs.timestampUtc, filters.from) : undefined,
            filters.to ? lte(auditLogs.timestampUtc, filters.to) : undefined,
        ].filter(Boolean);

        return db.query.auditLogs.findMany({
            where: clauses.length ? and(...clauses) : undefined,
            orderBy: [desc(auditLogs.timestampUtc)],
            limit: filters.limit ?? 100,
        });
    }

    async voidEntry(id: string, actorId: string, reason: string) {
        return db
            .update(auditLogs)
            .set({
                voidedBy: actorId,
                voidedAt: new Date(),
                voidReason: reason,
            })
            .where(eq(auditLogs.id, id))
            .returning()
            .then((res) => res[0]);
    }
}

export const auditLogQueries = new AuditLogQuery();
