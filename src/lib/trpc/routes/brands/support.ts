import { db } from "@/lib/db";
import {
    supportAttachments,
    supportInternalNotes,
    supportMessages,
    supportTickets,
    userSupportDisputes,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import { createDisputeReplacementOrder } from "@/lib/support/dispute-replacement-order";
import {
    buildAdminSupportHref,
    buildSupportHref,
    notifyAdmins,
    notifyUser,
} from "@/lib/support/utils";
import { auditEntityChange, createOperationalAlert } from "@/lib/monitoring-sla/audit";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";

const attachmentSchema = z.object({
    filename: z.string().min(1),
    url: z.string().url(),
    contentType: z.string().optional(),
    sizeBytes: z.string().optional(),
    fileKey: z.string().optional(),
});

async function attachBrandMessageFiles(
    messageId: string,
    attachments: z.infer<typeof attachmentSchema>[]
) {
    if (!attachments.length) return;

    await db.insert(supportAttachments).values(
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

export const brandSupportRouter = createTRPCRouter({
    listTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const filters = [eq(supportTickets.brandId, ctx.user.brand.id)];

            if (input.search?.trim()) {
                filters.push(
                    ilike(supportTickets.title, `%${input.search.trim()}%`)
                );
            }

            if (input.status && input.status !== "all") {
                filters.push(eq(supportTickets.status, input.status));
            }

            const rows = await db.query.supportTickets.findMany({
                where: and(...filters),
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
                orderBy: [
                    desc(supportTickets.latestMessageAt),
                    desc(supportTickets.createdAt),
                ],
            });

            return {
                data: rows,
                count: rows.length,
            };
        }),
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            const row = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, ticketId),
            });

            if (!row || row.brandId !== ctx.user.brand.id) {
                throw new Error("Unauthorized");
            }

            const notes = await db.query.supportInternalNotes.findMany({
                where: eq(supportInternalNotes.ticketId, row.id),
                orderBy: [desc(supportInternalNotes.createdAt)],
            });

            return {
                ...row,
                notes,
            };
        }),
    createTicket: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1),
                issueType: z.string(),
                issueLabel: z.string().optional(),
                description: z.string().optional(),
                priority: z
                    .enum(["low", "normal", "high", "critical"])
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const row = await db
                .insert(supportTickets)
                .values({
                    brandId: ctx.user.brand.id,
                    title: input.title.trim(),
                    issueType: input.issueType,
                    issueLabel: input.issueLabel ?? null,
                    description: input.description ?? null,
                    assignedAdminId: process.env.SUPPORT_INTERN_USER_ID || null,
                    priority: input.priority ?? "normal",
                    latestMessageAt: new Date(),
                    statusChangedAt: new Date(),
                })
                .returning()
                .then((res) => res[0]);

            if (input.description?.trim()) {
                await db.insert(supportMessages).values({
                    ticketId: row.id,
                    sender: "brand",
                    senderId: ctx.user.id,
                    text: input.description.trim(),
                });
            }

            await notifyAdmins({
                actorId: ctx.user.id,
                type: "support.brand_ticket.created",
                title: "New brand support request",
                body: `${ctx.user.brand.name} raised "${row.title}"`,
                href: buildAdminSupportHref(row.id, "brand"),
                emailSubject: `New brand support request: ${row.title}`,
                emailIntro: `${ctx.user.brand.name} created a new brand support request.`,
                emailDetails: [
                    `Ticket: ${row.id}`,
                    `Issue type: ${row.issueType}`,
                    ...(input.description
                        ? [`Description: ${input.description}`]
                        : []),
                ],
                metadata: {
                    ticketId: row.id,
                    brandId: ctx.user.brand.id,
                },
            });
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_created",
                entityType: "support_ticket",
                entityId: row.id,
                afterValue: {
                    title: row.title,
                    issueType: row.issueType,
                    status: row.status,
                    brandId: row.brandId,
                },
                reason: "brand_support_ticket_created",
            });
            await createOperationalAlert({
                actorId: ctx.user.id,
                type: "new_ticket_created",
                severity: "info",
                entityType: "support_ticket",
                entityId: row.id,
                title: "New brand support ticket",
                message: `${ctx.user.brand.name} raised "${row.title}".`,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dedupeKey: `ticket:new:brand:${row.id}`,
            });

            return row;
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
            const ticket = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, input.ticketId),
            });

            if (!ticket || ticket.brandId !== ctx.user.brand.id) {
                throw new Error("Unauthorized");
            }

            const inserted = await db
                .insert(supportMessages)
                .values({
                    ticketId: input.ticketId,
                    sender: "brand",
                    senderId: ctx.user.id,
                    text: input.text.trim(),
                })
                .returning()
                .then((res) => res[0]);

            await attachBrandMessageFiles(inserted.id, input.attachments);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_message_added",
                entityType: "support_ticket",
                entityId: ticket.id,
                afterValue: { messageId: inserted.id, sender: "brand" },
                reason: "brand_ticket_reply",
            });

            await db
                .update(supportTickets)
                .set({
                    unreadByAdmin: "true",
                    unreadByBrand: "false",
                    latestMessageAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, ticket.id));

            await notifyAdmins({
                actorId: ctx.user.id,
                type: "support.brand_ticket.reply",
                title: "Brand replied to support case",
                body: `${ctx.user.brand.name} replied on "${ticket.title}"`,
                href: buildAdminSupportHref(ticket.id, "brand"),
                emailSubject: `Brand reply on support case ${ticket.id}`,
                emailIntro: `${ctx.user.brand.name} replied to a brand support case.`,
                emailDetails: [
                    `Ticket: ${ticket.id}`,
                    `Message: ${input.text.trim().slice(0, 140)}`,
                ],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: ticketId }) => {
            const ticket = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, ticketId),
            });

            if (!ticket || ticket.brandId !== ctx.user.brand.id) {
                throw new Error("Unauthorized");
            }

            await db
                .update(supportTickets)
                .set({
                    unreadByBrand: "false",
                    lastOpenedAt: new Date(),
                })
                .where(eq(supportTickets.id, ticketId));

            const messages = await db.query.supportMessages.findMany({
                where: eq(supportMessages.ticketId, ticketId),
                orderBy: [supportMessages.createdAt],
            });

            const attachments = messages.length
                ? await db.query.supportAttachments.findMany({
                      where: inArray(
                          supportAttachments.messageId,
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
    listDisputes: protectedProcedure
        .input(
            z.object({
                status: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const disputes = await db.query.userSupportDisputes.findMany({
                where: and(
                    eq(userSupportDisputes.brandId, ctx.user.brand.id),
                    input.status && input.status !== "all"
                        ? eq(userSupportDisputes.status, input.status)
                        : undefined
                ),
                orderBy: [desc(userSupportDisputes.updatedAt)],
            });

            const ticketMap = new Map(
                (
                    await db.query.userSupportTickets.findMany({
                        where: disputes.length
                            ? inArray(
                                  userSupportTickets.id,
                                  disputes.map((dispute) => dispute.ticketId)
                              )
                            : undefined,
                    })
                ).map((ticket) => [ticket.id, ticket])
            );

            return disputes.map((dispute) => ({
                ...dispute,
                ticket: ticketMap.get(dispute.ticketId) ?? null,
            }));
        }),
    getDispute: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input: disputeId }) => {
            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.id, disputeId),
            });
            if (!dispute || dispute.brandId !== ctx.user.brand.id) {
                throw new Error("Dispute not found");
            }

            const [ticket, order] = await Promise.all([
                db.query.userSupportTickets.findFirst({
                    where: eq(userSupportTickets.id, dispute.ticketId),
                }),
                ctx.queries.orders.getOrderById(dispute.orderId),
            ]);

            return {
                ...dispute,
                ticket,
                order,
            };
        }),
    createReplacementOrder: protectedProcedure
        .input(
            z.object({
                disputeId: z.string(),
                note: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.id, input.disputeId),
            });
            if (!dispute || dispute.brandId !== ctx.user.brand.id) {
                throw new Error("Dispute not found");
            }
            if (dispute.replacementOrderId) {
                throw new Error("Replacement order already created");
            }

            const [ticket, order] = await Promise.all([
                db.query.userSupportTickets.findFirst({
                    where: eq(userSupportTickets.id, dispute.ticketId),
                }),
                ctx.queries.orders.getOrderById(dispute.orderId),
            ]);

            if (!ticket || !order) {
                throw new Error("Source order could not be loaded");
            }
            const { replacementOrderId } = await createDisputeReplacementOrder({
                sourceOrder: order,
                brandId: ctx.user.brand.id,
                orderItemId: dispute.orderItemId,
            });

            await db
                .update(userSupportDisputes)
                .set({
                    status: "replacement_created",
                    replacementOrderId,
                    actionCompletedAt: new Date(),
                    updatedAt: new Date(),
                    metadata: {
                        createdByBrandId: ctx.user.brand.id,
                        note: input.note ?? null,
                    },
                })
                .where(eq(userSupportDisputes.id, dispute.id));

            await db
                .update(userSupportTickets)
                .set({
                    linkedReplacementOrderId: replacementOrderId,
                    brandActionStatus: "replacement_created",
                    status: "waiting_for_brand",
                    unreadByAdmin: "true",
                    unreadByUser: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await db.insert(userSupportMessages).values({
                ticketId: ticket.id,
                sender: "admin",
                senderId: ctx.user.id,
                text: `Brand created replacement order ${replacementOrderId}.${input.note ? ` Note: ${input.note}` : ""}`,
                messageType: "system",
            });

            await notifyAdmins({
                actorId: ctx.user.id,
                type: "support.dispute.replacement_created",
                title: "Brand created a dispute replacement order",
                body: `${ctx.user.brand.name} created replacement order ${replacementOrderId}`,
                href: buildAdminSupportHref(ticket.id, "user"),
                emailSubject: `Replacement order created for dispute ${dispute.id}`,
                emailIntro: `${ctx.user.brand.name} created a replacement order from an approved dispute.`,
                emailDetails: [
                    `Original order: ${dispute.orderId}`,
                    `Replacement order: ${replacementOrderId}`,
                    ...(input.note ? [`Brand note: ${input.note}`] : []),
                ],
                metadata: {
                    disputeId: dispute.id,
                    replacementOrderId,
                },
            });

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.dispute.replacement_created",
                title: "Your replacement order was created",
                body: `We created replacement order ${replacementOrderId} for your support case.`,
                href: buildSupportHref(ticket.id),
                emailSubject: "Replacement order created for your support case",
                emailIntro:
                    "A replacement order has been created for your support case.",
                emailDetails: [
                    `Original order: ${dispute.orderId}`,
                    `Replacement order: ${replacementOrderId}`,
                ],
                metadata: {
                    ticketId: ticket.id,
                    replacementOrderId,
                },
            });

            return {
                success: true,
                replacementOrderId,
            };
        }),
});
