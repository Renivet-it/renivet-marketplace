import { db } from "@/lib/db";
import { capiLogs } from "@/lib/db/schema";
import { BitFieldSitePermission } from "@/config/permissions";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";

const DATE_FILTER_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const capiAccessProcedure = protectedProcedure.use(({ ctx, next }) => {
    const normalizedRoleNames = ctx.user.roles.map((role) =>
        role.name.trim().toLowerCase()
    );

    const hasOrderManagerRole = normalizedRoleNames.some(
        (name) => name === "order manager" || name === "order amanger"
    );

    const hasOrderPermissions = hasPermission(
        ctx.user.sitePermissions,
        [
            BitFieldSitePermission.VIEW_ORDERS,
            BitFieldSitePermission.MANAGE_ORDERS,
        ],
        "any"
    );

    const isAdmin = hasPermission(ctx.user.sitePermissions, [
        BitFieldSitePermission.ADMINISTRATOR,
    ]);

    if (!hasOrderManagerRole && !hasOrderPermissions && !isAdmin) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You're not authorized",
        });
    }

    return next();
});

const buildCapiWhereClause = (input: {
    eventName?: string;
    fromDate?: string;
    toDate?: string;
}) => {
    const fromDate = input.fromDate
        ? new Date(`${input.fromDate}T00:00:00.000Z`)
        : undefined;

    const toDateExclusive = input.toDate
        ? new Date(`${input.toDate}T00:00:00.000Z`)
        : undefined;

    if (toDateExclusive) {
        toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);
    }

    return and(
        input.eventName ? eq(capiLogs.eventName, input.eventName) : undefined,
        fromDate ? gte(capiLogs.createdAt, fromDate) : undefined,
        toDateExclusive ? lt(capiLogs.createdAt, toDateExclusive) : undefined
    );
};

export const capiLogsRouter = createTRPCRouter({
    getLogs: capiAccessProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().nullish(),
                page: z.number().min(1).default(1),
                eventName: z.string().optional(),
                fromDate: z.string().regex(DATE_FILTER_REGEX).optional(),
                toDate: z.string().regex(DATE_FILTER_REGEX).optional(),
            })
        )
        .query(async ({ input }) => {
            const limit = input.limit;
            const offset = (input.page - 1) * limit;
            const whereClause = buildCapiWhereClause(input);

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

    getAllLogs: capiAccessProcedure
        .input(
            z.object({
                eventName: z.string().optional(),
                fromDate: z.string().regex(DATE_FILTER_REGEX).optional(),
                toDate: z.string().regex(DATE_FILTER_REGEX).optional(),
            })
        )
        .query(async ({ input }) => {
            const whereClause = buildCapiWhereClause(input);

            const logs = await db
                .select()
                .from(capiLogs)
                .where(whereClause)
                .orderBy(desc(capiLogs.createdAt));

            return { logs };
        }),
});
