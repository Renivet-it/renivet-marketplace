import { db } from "@/lib/db";
import {
    orderItems,
    userSupportAttachments,
    userSupportDisputes,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import {
    buildAdminSupportHref,
    buildSupportHref,
    notifyAdmins,
} from "@/lib/support/utils";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, inArray, SQL } from "drizzle-orm";
import { z } from "zod";

const attachmentSchema = z.object({
    filename: z.string().min(1),
    url: z.string().url(),
    contentType: z.string().optional(),
    sizeBytes: z.string().optional(),
    fileKey: z.string().optional(),
});

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
    const orderSnippet = input.orderId
        ? ` linked to Order #${input.orderId}`
        : "";
    const issueLabel = formatIssueLabel(input.issueLabel, input.issueType);

    return [
        `Thanks, I've logged ${issueLabel}${orderSnippet}.`,
        "Your case has been created and our support team has the details.",
        "You can continue adding updates, photos, and screenshots in this conversation while the team reviews it.",
    ].join("\n\n");
};

const buildTicketTitle = (input: {
    issueLabel?: string;
    issueType: string;
    orderId?: string;
}) => {
    const label = formatIssueLabel(input.issueLabel, input.issueType);
    return input.orderId ? `${label} (Order #${input.orderId})` : label;
};

async function attachFilesToUserMessage(
    messageId: string,
    attachments: z.infer<typeof attachmentSchema>[]
) {
    if (!attachments.length) return;

    await db.insert(userSupportAttachments).values(
        attachments.map((attachment) => ({
            messageId,
            filename: attachment.filename,
            url: attachment.url,
            contentType: attachment.contentType ?? null,
            sizeBytes: attachment.sizeBytes ?? null,
            fileKey: attachment.fileKey ?? null,
        }))
    );
}

export const userSupportRouter = createTRPCRouter({
    createTicket: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).optional(),
                category: z.string(),
                issueType: z.string(),
                issueLabel: z.string().optional(),
                description: z.string().optional(),
                orderId: z.string().optional(),
                orderItemId: z.string().uuid().optional(),
                brandId: z.string().uuid().optional(),
                priority: z
                    .enum(["low", "normal", "high", "critical"])
                    .optional(),
                intakeContext: z.record(z.string(), z.any()).optional(),
                attachments: z.array(attachmentSchema).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            let linkedBrandId = input.brandId ?? null;

            if (!linkedBrandId && input.orderItemId) {
                const orderItem = await db.query.orderItems.findFirst({
                    where: eq(orderItems.id, input.orderItemId),
                    with: {
                        product: true,
                    },
                });
                linkedBrandId = orderItem?.product.brandId ?? null;
            }

            if (!linkedBrandId && input.orderId) {
                const order = await ctx.queries.orders.getOrderById(
                    input.orderId
                );
                linkedBrandId = order?.items?.[0]?.product?.brandId ?? null;
            }

            const title =
                input.title?.trim() ||
                buildTicketTitle({
                    issueLabel: input.issueLabel,
                    issueType: input.issueType,
                    orderId: input.orderId,
                });

            const row = await db
                .insert(userSupportTickets)
                .values({
                    userId: ctx.user.id,
                    orderId: input.orderId ?? null,
                    orderItemId: input.orderItemId ?? null,
                    brandId: linkedBrandId,
                    title,
                    category: input.category,
                    issueType: input.issueType,
                    issueLabel: input.issueLabel ?? null,
                    description: input.description ?? null,
                    priority: input.priority ?? "normal",
                    intakeContext: input.intakeContext ?? null,
                    latestMessageAt: new Date(),
                    statusChangedAt: new Date(),
                })
                .returning()
                .then((res) => res[0]);

            if (input.description?.trim()) {
                const initialMessage = await db
                    .insert(userSupportMessages)
                    .values({
                        ticketId: row.id,
                        sender: "user",
                        senderId: ctx.user.id,
                        text: input.description.trim(),
                        metadata: {
                            issueLabel: input.issueLabel ?? null,
                        },
                    })
                    .returning()
                    .then((res) => res[0]);

                await attachFilesToUserMessage(
                    initialMessage.id,
                    input.attachments
                );
            }

            const automatedReply = buildAutomatedSupportReply(input);
            await db.insert(userSupportMessages).values({
                ticketId: row.id,
                sender: "admin",
                senderId: "support-bot",
                text: automatedReply,
                messageType: "system",
            });

            await notifyAdmins({
                actorId: ctx.user.id,
                type: "support.ticket.created",
                title: "New customer support case",
                body: `${ctx.user.firstName} raised "${title}"`,
                href: buildAdminSupportHref(row.id, "user"),
                emailSubject: `New support case: ${title}`,
                emailIntro: `${ctx.user.firstName} ${ctx.user.lastName} created a new customer support case.`,
                emailDetails: [
                    `Ticket: ${row.id}`,
                    `Issue: ${formatIssueLabel(input.issueLabel, input.issueType)}`,
                    ...(input.orderId ? [`Order: ${input.orderId}`] : []),
                ],
                metadata: {
                    ticketId: row.id,
                    category: input.category,
                    orderId: input.orderId ?? null,
                },
            });

            return row;
        }),
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

            if (status && status !== "all") {
                filters.push(eq(userSupportTickets.status, status));
            }

            return db.query.userSupportTickets.findMany({
                where: filters.length === 1 ? filters[0] : and(...filters),
                limit,
                offset: (page - 1) * limit,
                orderBy: [
                    desc(userSupportTickets.latestMessageAt),
                    desc(userSupportTickets.createdAt),
                ],
            });
        }),
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            const row = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });

            if (!row || row.userId !== ctx.user.id) {
                throw new Error("Ticket not found");
            }

            const [order, dispute] = await Promise.all([
                row.orderId
                    ? ctx.queries.orders.getOrderById(row.orderId)
                    : null,
                db.query.userSupportDisputes.findFirst({
                    where: eq(userSupportDisputes.ticketId, row.id),
                }),
            ]);

            return {
                ...row,
                order,
                dispute,
                notificationHref: buildSupportHref(row.id),
            };
        }),
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });
            if (!ticket || ticket.userId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            await db
                .update(userSupportTickets)
                .set({ unreadByUser: "false", lastOpenedAt: new Date() })
                .where(eq(userSupportTickets.id, ticketId));

            const messages = await db.query.userSupportMessages.findMany({
                where: eq(userSupportMessages.ticketId, ticketId),
                orderBy: [userSupportMessages.createdAt],
            });

            const attachments = messages.length
                ? await db.query.userSupportAttachments.findMany({
                      where: inArray(
                          userSupportAttachments.messageId,
                          messages.map((message) => message.id)
                      ),
                  })
                : [];

            const attachmentMap = new Map<string, typeof attachments>();
            for (const attachment of attachments) {
                const current = attachmentMap.get(attachment.messageId) ?? [];
                current.push(attachment);
                attachmentMap.set(attachment.messageId, current);
            }

            return messages.map((message) => ({
                ...message,
                attachments: attachmentMap.get(message.id) ?? [],
            }));
        }),
    sendMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string().min(1),
                attachments: z.array(attachmentSchema).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
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
                    text: input.text.trim(),
                })
                .returning()
                .then((res) => res[0]);

            await attachFilesToUserMessage(inserted.id, input.attachments);

            await db
                .update(userSupportTickets)
                .set({
                    unreadByAdmin: "true",
                    latestMessageAt: new Date(),
                    updatedAt: new Date(),
                    status:
                        ticket.status === "waiting_for_customer"
                            ? "open"
                            : ticket.status,
                })
                .where(eq(userSupportTickets.id, input.ticketId));

            await notifyAdmins({
                actorId: ctx.user.id,
                type: "support.ticket.customer_reply",
                title: "Customer replied to support case",
                body: `${ctx.user.firstName} added a new message to "${ticket.title}"`,
                href: buildAdminSupportHref(ticket.id, "user"),
                emailSubject: `Customer reply on support case ${ticket.id}`,
                emailIntro: `${ctx.user.firstName} ${ctx.user.lastName} added a new message to an existing support case.`,
                emailDetails: [
                    `Ticket: ${ticket.id}`,
                    `Title: ${ticket.title}`,
                    `Message: ${input.text.trim().slice(0, 140)}`,
                ],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
});
