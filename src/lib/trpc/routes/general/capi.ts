import { db } from "@/lib/db";
import { capiLogs } from "@/lib/db/schema";
import { adminProcedure, createTRPCRouter } from "@/lib/trpc/trpc";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const capiLogsRouter = createTRPCRouter({
    getLogs: adminProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().nullish(),
                page: z.number().min(1).default(1),
            })
        )
        .query(async ({ input }) => {
            const limit = input.limit;
            const offset = (input.page - 1) * limit;

            const logs = await db
                .select()
                .from(capiLogs)
                .orderBy(desc(capiLogs.createdAt))
                .limit(limit)
                .offset(offset);

            const totalCountResult = await db.$count(capiLogs);

            return {
                logs,
                totalCount: totalCountResult,
                totalPages: Math.ceil(totalCountResult / limit),
            };
        }),
});
