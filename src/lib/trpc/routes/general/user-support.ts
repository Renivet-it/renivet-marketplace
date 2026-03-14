import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, SQL } from "drizzle-orm";
import { z } from "zod";

const formatIssueLabel = (issueLabel?: string, issueType?: string) => {
    if (issueLabel?.trim()) return issueLabel.trim();
    if (!issueType) return "your support request";

    return issueType.replace(/_/g, " ");
};

const buildAutomatedSupportReply = (input: {
    category: string;
    issueLabel?: string;
    issueType: string;
    orderId?: string;
}) => {
    if (input.category !== "order") return null;

    const orderSnippet = input.orderId
        ? ` for Order #${input.orderId.slice(0, 8)}`
        : "";
    const issueLabel = formatIssueLabel(input.issueLabel, input.issueType);

    return [
        `Thanks for sharing those details. I've logged your order support request${orderSnippet} regarding ${issueLabel}.`,
        "This chat is not live, so you do not need to stay online while waiting here.",
        "A support specialist will review the information you shared and reply in this conversation as soon as possible.",
        "If this case involves the item, packaging, or delivery handoff, please keep them available until the review is completed.",
    ].join("\n\n");
};

const buildOngoingSupportReply = (input: {
    category: string;
    issueType: string;
    orderId?: string | null;
    supportBotReplyCount: number;
}) => {
    if (input.category !== "order") return null;

    const orderSnippet = input.orderId
        ? ` for Order #${input.orderId.slice(0, 8)}`
        : "";

    if (input.supportBotReplyCount <= 1) {
        const careNote = [
            "wrong_item",
            "item_damaged",
            "return_exchange",
        ].includes(input.issueType)
            ? "If possible, please keep the item and packaging available until the review is completed."
            : "You can keep adding updates here and I'll attach them to the case timeline for the support team.";

        return [
            `I've added your latest update${orderSnippet} to the support case.`,
            careNote,
            "A support specialist will pick this up in the same chat as soon as they review the queue.",
        ].join("\n\n");
    }

    return [
        `Noted. I've saved this latest update${orderSnippet}.`,
        "You do not need to stay online here. The support team will continue in this conversation once they review it.",
    ].join("\n\n");
};

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
                issueLabel: z.string().optional(),
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

            const automatedReply = buildAutomatedSupportReply(input);

            if (row && automatedReply) {
                await db.insert(userSupportMessages).values({
                    ticketId: row.id,
                    sender: "admin",
                    senderId: "support-bot",
                    text: automatedReply,
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

            const existingMessages = await db.query.userSupportMessages.findMany({
                where: eq(userSupportMessages.ticketId, input.ticketId),
                orderBy: [userSupportMessages.createdAt],
            });

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

            const hasHumanAdminReply = existingMessages.some(
                (message) =>
                    message.sender === "admin" &&
                    message.senderId !== "support-bot"
            );
            const supportBotReplyCount = existingMessages.filter(
                (message) =>
                    message.sender === "admin" &&
                    message.senderId === "support-bot"
            ).length;
            const supportReply = buildOngoingSupportReply({
                category: ticket.category,
                issueType: ticket.issueType,
                orderId: ticket.orderId,
                supportBotReplyCount,
            });

            if (!hasHumanAdminReply && supportReply) {
                await db.insert(userSupportMessages).values({
                    ticketId: input.ticketId,
                    sender: "admin",
                    senderId: "support-bot",
                    text: supportReply,
                });
            }

            return inserted;
        }),
});
