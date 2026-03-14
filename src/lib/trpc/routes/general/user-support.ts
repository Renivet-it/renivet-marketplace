import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, SQL } from "drizzle-orm";
import { z } from "zod";

export const userSupportRouter = createTRPCRouter({
    // ------------------------------------------------------
    // CREATE TICKET
    // ------------------------------------------------------
    createTicket: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1),
                category: z.string(),
                issueType: z.string(),
                description: z.string().optional(),
                orderId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await db
                .insert(userSupportTickets)
                .values({
                    userId: ctx.user.id,
                    title: input.title,
                    category: input.category,
                    issueType: input.issueType,
                    description: input.description ?? null,
                    orderId: input.orderId ?? null,
                })
                .returning()
                .then((res) => res[0]);

            // Auto-create initial message if description provided
            if (input.description && row) {
                await db.insert(userSupportMessages).values({
                    ticketId: row.id,
                    sender: "user",
                    senderId: ctx.user.id,
                    text: input.description,
                });
            }

            return row;
        }),

    // ------------------------------------------------------
    // LIST MY TICKETS
    // ------------------------------------------------------
    listMyTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                status: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { limit, page, status } = input;

            const filters: SQL[] = [eq(userSupportTickets.userId, ctx.user.id)];

            if (status && status !== "all")
                filters.push(eq(userSupportTickets.status, status));

            const where = filters.length === 1 ? filters[0] : and(...filters);

            const rows = await db.query.userSupportTickets.findMany({
                where,
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(userSupportTickets.createdAt)],
            });

            return rows;
        }),

    // ------------------------------------------------------
    // GET SINGLE TICKET
    // ------------------------------------------------------
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            const row = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });

            if (!row || row.userId !== ctx.user.id) {
                throw new Error("Ticket not found");
            }

            return row;
        }),

    // ------------------------------------------------------
    // GET MESSAGES
    // ------------------------------------------------------
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            // Verify ownership
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });
            if (!ticket || ticket.userId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            return await db.query.userSupportMessages.findMany({
                where: eq(userSupportMessages.ticketId, ticketId),
                orderBy: [userSupportMessages.createdAt],
            });
        }),

    // ------------------------------------------------------
    // SEND MESSAGE
    // ------------------------------------------------------
    sendMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket || ticket.userId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            const inserted = await db
                .insert(userSupportMessages)
                .values({
                    ticketId: input.ticketId,
                    sender: "user",
                    senderId: ctx.user.id,
                    text: input.text,
                })
                .returning()
                .then((res) => res[0]);

            // Mark unread for admin
            await db
                .update(userSupportTickets)
                .set({ unreadByAdmin: "true", updatedAt: new Date() })
                .where(eq(userSupportTickets.id, input.ticketId));

            return inserted;
        }),
});
