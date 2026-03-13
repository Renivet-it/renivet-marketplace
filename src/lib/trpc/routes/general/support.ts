import { db } from "@/lib/db";
import {
    supportMessages,
    supportTickets,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const adminSupportRouter = createTRPCRouter({
    // ------------------------------------------------------
    // LIST ALL TICKETS (ADMIN SIDE)
    // ------------------------------------------------------
    listTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(10),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
                brandId: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const { limit, page, search, status, brandId } = input;

            const filters: any[] = [];

            if (brandId) filters.push(eq(supportTickets.brandId, brandId));
            if (search?.length)
                filters.push(ilike(supportTickets.title, `%${search}%`));
            if (status && status !== "all")
                filters.push(eq(supportTickets.status, status));

            const where =
                filters.length === 0
                    ? undefined
                    : filters.length === 1
                      ? filters[0]
                      : and(...filters);

            const rows = await db.query.supportTickets.findMany({
                where,
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(supportTickets.createdAt)],
                extras: {
                    count: db.$count(supportTickets, where).as("total_count"),
                },
            });

            return {
                data: rows,
                count: +rows?.[0]?.total_count || 0,
            };
        }),

    resolveTicket: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            await db
                .update(supportTickets)
                .set({ status: "resolved" })
                .where(eq(supportTickets.id, input.ticketId));

            return { success: true };
        }),
    // ------------------------------------------------------
    // GET A SINGLE TICKET
    // ------------------------------------------------------
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            return await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, ticketId),
            });
        }),

    // ------------------------------------------------------
    // UPDATE STATUS (RESOLVE / OPEN / ESCALATED)
    // ------------------------------------------------------
    updateStatus: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                status: z.string(), // "resolved" | "open" | "in_progress"
            })
        )
        .mutation(async ({ input }) => {
            const updated = await db
                .update(supportTickets)
                .set({
                    status: input.status,
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);

            return updated;
        }),

    // ------------------------------------------------------
    // ADMIN SENDS MESSAGE
    // ------------------------------------------------------
    sendMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string(),
                adminId: z.string().optional(), // optional for now
            })
        )
        .mutation(async ({ ctx, input }) => {
            const inserted = await db
                .insert(supportMessages)
                .values({
                    ticketId: input.ticketId,
                    sender: "admin",
                    senderId: ctx.user.id, // admin user
                    text: input.text,
                })
                .returning()
                .then((res) => res[0]);

            return inserted;
        }),

    // ------------------------------------------------------
    // GET TICKET MESSAGES
    // ------------------------------------------------------
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            return await db.query.supportMessages.findMany({
                where: eq(supportMessages.ticketId, ticketId),
                orderBy: [supportMessages.createdAt],
            });
        }),

    // ========================================================
    // USER TICKETS LOGIC (CUSTOMER SUPPORT)
    // ========================================================

    listUserTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(10),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const { limit, page, search, status } = input;

            const filters: any[] = [];

            if (search?.length)
                filters.push(ilike(userSupportTickets.title, `%${search}%`));
            if (status && status !== "all")
                filters.push(eq(userSupportTickets.status, status));

            const where =
                filters.length === 0
                    ? undefined
                    : filters.length === 1
                      ? filters[0]
                      : and(...filters);

            const rows = await db.query.userSupportTickets.findMany({
                where,
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(userSupportTickets.createdAt)],
                extras: {
                    count: db
                        .$count(userSupportTickets, where)
                        .as("total_count"),
                },
            });

            return {
                data: rows,
                count: +rows?.[0]?.total_count || 0,
            };
        }),

    resolveUserTicket: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            await db
                .update(userSupportTickets)
                .set({ status: "resolved" })
                .where(eq(userSupportTickets.id, input.ticketId));

            return { success: true };
        }),

    getUserTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            return await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });
        }),

    sendUserMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const inserted = await db
                .insert(userSupportMessages)
                .values({
                    ticketId: input.ticketId,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: input.text,
                })
                .returning()
                .then((res) => res[0]);

            // Mark unread for user
            await db
                .update(userSupportTickets)
                .set({ unreadByUser: "true", updatedAt: new Date() })
                .where(eq(userSupportTickets.id, input.ticketId));

            return inserted;
        }),

    getUserMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            // mark messages as read by admin when fetching
            await db
                .update(userSupportTickets)
                .set({ unreadByAdmin: "false" })
                .where(eq(userSupportTickets.id, ticketId));

            return await db.query.userSupportMessages.findMany({
                where: eq(userSupportMessages.ticketId, ticketId),
                orderBy: [userSupportMessages.createdAt],
            });
        }),
});
