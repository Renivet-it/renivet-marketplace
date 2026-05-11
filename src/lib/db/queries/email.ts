import { desc, eq, inArray } from "drizzle-orm";
import { db } from "..";
import { emailMessageLogs } from "../schema";

type CreateEmailMessageLog = typeof emailMessageLogs.$inferInsert;

class EmailMessageLogQuery {
    async getLogs({ limit = 500 }: { limit?: number } = {}) {
        return db.query.emailMessageLogs.findMany({
            limit,
            orderBy: [desc(emailMessageLogs.sentAt)],
        });
    }

    async getLogsByIds(ids: string[]) {
        if (!ids.length) return [];

        return db.query.emailMessageLogs.findMany({
            where: inArray(emailMessageLogs.id, ids),
            orderBy: [desc(emailMessageLogs.sentAt)],
        });
    }

    async createLog(values: CreateEmailMessageLog) {
        return db
            .insert(emailMessageLogs)
            .values(values)
            .returning()
            .then((res) => res[0]);
    }

    async clearLogs() {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        return db.delete(emailMessageLogs).returning();
    }

    async deleteLog(id: string) {
        return db
            .delete(emailMessageLogs)
            .where(eq(emailMessageLogs.id, id))
            .returning()
            .then((res) => res[0]);
    }
}

export const emailMessageLogQueries = new EmailMessageLogQuery();
