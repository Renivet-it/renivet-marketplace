import { db } from "@/lib/db";
import { capiLogs } from "@/lib/db/schema";
import { adminProcedure, createTRPCRouter } from "@/lib/trpc/trpc";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const capiLogsRouter = createTRPCRouter({
    getLogs: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().nullish(),
                page: z.number().min(1).default(1),
                eventName: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const limit = input.limit;
            const offset = (input.page - 1) * limit;

            const whereClause = input.eventName
                ? eq(capiLogs.eventName, input.eventName)
                : undefined;

            const logs = await db
                .select()
                .from(capiLogs)
                .where(whereClause)
                .orderBy(desc(capiLogs.createdAt))
                .limit(limit)
                .offset(offset);

            const totalCountResult = await db.$count(capiLogs, whereClause);

            return {
                logs,
                totalCount: totalCountResult,
                totalPages: Math.ceil(totalCountResult / limit),
            };
        }),

    getAllLogs: adminProcedure
        .input(
            z.object({
                eventName: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const whereClause = input.eventName
                ? eq(capiLogs.eventName, input.eventName)
                : undefined;

            const logs = await db
                .select()
                .from(capiLogs)
                .where(whereClause)
                .orderBy(desc(capiLogs.createdAt));

            return { logs };
        }),
});
