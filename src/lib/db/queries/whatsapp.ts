import { desc, eq, inArray } from "drizzle-orm";
import { db } from "..";
import { whatsappMessageLogs } from "../schema";

type CreateWhatsAppMessageLog = typeof whatsappMessageLogs.$inferInsert;

class WhatsAppMessageLogQuery {
    async getLogs({ limit = 500 }: { limit?: number } = {}) {
        return db.query.whatsappMessageLogs.findMany({
            limit,
            orderBy: [desc(whatsappMessageLogs.sentAt)],
        });
    }

    async getLogsByIds(ids: string[]) {
        if (!ids.length) return [];

        return db.query.whatsappMessageLogs.findMany({
            where: inArray(whatsappMessageLogs.id, ids),
            orderBy: [desc(whatsappMessageLogs.sentAt)],
        });
    }

    async getLogsBySids(sids: string[]) {
        if (!sids.length) return [];

        return db.query.whatsappMessageLogs.findMany({
            where: inArray(whatsappMessageLogs.sid, sids),
            orderBy: [desc(whatsappMessageLogs.sentAt)],
        });
    }

    async createLog(values: CreateWhatsAppMessageLog) {
        return db
            .insert(whatsappMessageLogs)
            .values(values)
            .returning()
            .then((res) => res[0]);
    }

    async createLogs(values: CreateWhatsAppMessageLog[]) {
        if (!values.length) return [];

        return db.insert(whatsappMessageLogs).values(values).returning();
    }

    async deleteLog(id: string) {
        return db
            .delete(whatsappMessageLogs)
            .where(eq(whatsappMessageLogs.id, id))
            .returning()
            .then((res) => res[0]);
    }

    async clearLogs() {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        return db.delete(whatsappMessageLogs).returning();
    }
}

export const whatsappMessageLogQueries = new WhatsAppMessageLogQuery();
