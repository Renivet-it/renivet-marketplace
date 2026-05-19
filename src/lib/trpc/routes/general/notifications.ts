import { notifications, userSupportTickets } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

export const notificationsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(25),
                page: z.number().min(1).default(1),
                unreadOnly: z.boolean().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const whereClause = and(
                eq(notifications.recipientId, ctx.user.id),
                input.unreadOnly ? isNull(notifications.readAt) : undefined
            );

            const rows = await ctx.db.query.notifications.findMany({
                where: whereClause,
                orderBy: [desc(notifications.createdAt)],
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
            });

            const totalRows = await ctx.db
                .select({ count: sql<number>`count(*)` })
                .from(notifications)
                .where(whereClause);

            const supportTicketIds = rows
                .map((notification) => {
                    const ticketId = notification.metadata?.ticketId;
                    return typeof ticketId === "string" ? ticketId : null;
                })
                .filter((value): value is string => Boolean(value));

            const supportTickets = supportTicketIds.length
                ? await ctx.db.query.userSupportTickets.findMany({
                      where: inArray(userSupportTickets.id, supportTicketIds),
                  })
                : [];

            const supportTicketMap = new Map(
                supportTickets.map((ticket) => [ticket.id, ticket])
            );

            return {
                data: rows.map((notification) => {
                    const ticketId = notification.metadata?.ticketId;
                    const supportTicket =
                        typeof ticketId === "string"
                            ? (supportTicketMap.get(ticketId) ?? null)
                            : null;

                    return {
                        ...notification,
                        supportTicket,
                    };
                }),
                totalCount: Number(totalRows[0]?.count ?? 0),
                page: input.page,
                pageSize: input.limit,
            };
        }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.recipientId, ctx.user.id),
                    sql`${notifications.readAt} IS NULL`
                )
            );

        return Number(rows[0]?.count ?? 0);
    }),
    markRead: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(notifications)
                .set({ readAt: new Date().toISOString() })
                .where(
                    and(
                        eq(notifications.id, input.id),
                        eq(notifications.recipientId, ctx.user.id)
                    )
                );

            return { success: true };
        }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db
            .update(notifications)
            .set({ readAt: new Date().toISOString() })
            .where(eq(notifications.recipientId, ctx.user.id));

        return { success: true };
    }),
});
