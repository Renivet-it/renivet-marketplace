import { db } from "@/lib/db";
import {
    brands,
    supportAttachments,
    supportInternalNotes,
    supportMessages,
    supportTickets,
    supportTicketStatusHistory,
    users,
    userSupportAttachments,
    userSupportDisputes,
    userSupportInternalNotes,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import { createDisputeReplacementOrder } from "@/lib/support/dispute-replacement-order";
import {
    buildBrandDisputeHref,
    buildBrandSupportHref,
    buildSupportHref,
    notifyBrandUsers,
    notifyUser,
} from "@/lib/support/utils";
import { auditEntityChange, createOperationalAlert } from "@/lib/monitoring-sla/audit";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { generateId } from "@/lib/utils";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";

const attachmentSchema = z.object({
    filename: z.string().min(1),
    url: z.string().url(),
    contentType: z.string().optional(),
    sizeBytes: z.string().optional(),
    fileKey: z.string().optional(),
});

const statusSchema = z.enum([
    "open",
    "in_review",
    "waiting_for_customer",
    "waiting_for_brand",
    "approved",
    "rejected",
    "resolved",
    "closed",
    "escalated",
]);

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

async function attachUserMessageFiles(
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

export const adminSupportRouter = createTRPCRouter({
    listTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
                brandId: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const filters = [];
            if (input.brandId)
                filters.push(eq(supportTickets.brandId, input.brandId));
            if (input.search?.trim()) {
                filters.push(
                    ilike(supportTickets.title, `%${input.search.trim()}%`)
                );
            }
            if (input.status && input.status !== "all") {
                filters.push(eq(supportTickets.status, input.status));
            }

            const rows = await db.query.supportTickets.findMany({
                where: filters.length ? and(...filters) : undefined,
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
                orderBy: [
                    desc(supportTickets.latestMessageAt),
                    desc(supportTickets.createdAt),
                ],
            });

            const brandMap = new Map(
                (
                    await db.query.brands.findMany({
                        where: rows.length
                            ? inArray(
                                  brands.id,
                                  rows.map((row) => row.brandId)
                              )
                            : undefined,
                    })
                ).map((brand) => [brand.id, brand])
            );

            return {
                data: rows.map((row) => ({
                    ...row,
                    brandName:
                        brandMap.get(row.brandId)?.name ?? "Unknown brand",
                })),
                count: rows.length,
            };
        }),
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            const ticket = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, ticketId),
            });
            if (!ticket) return null;

            const [brand, notes] = await Promise.all([
                db.query.brands.findFirst({
                    where: eq(brands.id, ticket.brandId),
                }),
                db.query.supportInternalNotes.findMany({
                    where: eq(supportInternalNotes.ticketId, ticket.id),
                    orderBy: [desc(supportInternalNotes.createdAt)],
                }),
            ]);

            return {
                ...ticket,
                brand,
                notes,
            };
        }),
    updateStatus: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                status: statusSchema,
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, input.ticketId),
            });
            if (!existing) throw new Error("Ticket not found");

            const updated = await db
                .update(supportTickets)
                .set({
                    status: input.status,
                    statusChangedAt: new Date(),
                    resolvedAt:
                        input.status === "resolved"
                            ? new Date()
                            : existing.resolvedAt,
                    resolutionSummary:
                        input.reason ?? existing.resolutionSummary ?? null,
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);

            await db.insert(supportTicketStatusHistory).values({
                ticketId: existing.id,
                prevStatus: existing.status,
                newStatus: input.status,
                changedBy: ctx.user.id,
                reason: input.reason ?? null,
            });
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_status_changed",
                entityType: "support_ticket",
                entityId: existing.id,
                beforeValue: { status: existing.status },
                afterValue: { status: input.status },
                reason: input.reason ?? "support_ticket_status_update",
            });

            await notifyBrandUsers({
                brandId: existing.brandId,
                actorId: ctx.user.id,
                type: "support.brand_ticket.status_changed",
                title: "Brand support ticket updated",
                body: `"${existing.title}" is now ${input.status.replace(/_/g, " ")}`,
                href: buildBrandSupportHref(existing.brandId, existing.id),
                emailSubject: `Support ticket updated: ${existing.title}`,
                emailIntro: `Your brand support ticket "${existing.title}" has been updated.`,
                emailDetails: [
                    `New status: ${input.status}`,
                    ...(input.reason ? [`Update: ${input.reason}`] : []),
                ],
                metadata: {
                    ticketId: existing.id,
                    status: input.status,
                },
            });

            return updated;
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
            if (!ticket) throw new Error("Ticket not found");

            const inserted = await db
                .insert(supportMessages)
                .values({
                    ticketId: ticket.id,
                    sender: "admin",
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
                afterValue: { messageId: inserted.id, sender: "admin" },
                reason: "brand_ticket_reply",
            });

            await db
                .update(supportTickets)
                .set({
                    unreadByBrand: "true",
                    unreadByAdmin: "false",
                    latestMessageAt: new Date(),
                    status: ["resolved", "closed", "rejected"].includes(
                        ticket.status
                    )
                        ? ticket.status
                        : "in_review",
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, ticket.id));

            await notifyBrandUsers({
                brandId: ticket.brandId,
                actorId: ctx.user.id,
                type: "support.brand_ticket.reply",
                title: "New reply on brand support ticket",
                body: `Our support team replied to "${ticket.title}"`,
                href: buildBrandSupportHref(ticket.brandId, ticket.id),
                emailSubject: `New reply on support ticket: ${ticket.title}`,
                emailIntro: `Our support team replied to your brand support ticket "${ticket.title}".`,
                emailDetails: [`Message: ${input.text.trim().slice(0, 140)}`],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
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
    addInternalNote: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                note: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const note = await db
                .insert(supportInternalNotes)
                .values({
                    ticketId: input.ticketId,
                    authorId: ctx.user.id,
                    note: input.note.trim(),
                })
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_internal_note_added",
                entityType: "support_ticket",
                entityId: input.ticketId,
                afterValue: { noteId: note.id },
                reason: "internal_note",
            });
            return note;
        }),
    listUserTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const filters = [];
            if (input.search?.trim()) {
                filters.push(
                    or(
                        ilike(
                            userSupportTickets.title,
                            `%${input.search.trim()}%`
                        ),
                        ilike(
                            userSupportTickets.issueType,
                            `%${input.search.trim()}%`
                        )
                    )
                );
            }
            if (input.status && input.status !== "all") {
                filters.push(eq(userSupportTickets.status, input.status));
            }

            const rows = await db.query.userSupportTickets.findMany({
                where: filters.length ? and(...filters) : undefined,
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
                orderBy: [
                    desc(userSupportTickets.latestMessageAt),
                    desc(userSupportTickets.createdAt),
                ],
            });

            const userMap = new Map(
                (
                    await db.query.users.findMany({
                        where: rows.length
                            ? inArray(
                                  users.id,
                                  rows.map((row) => row.userId)
                              )
                            : undefined,
                    })
                ).map((user) => [user.id, user])
            );

            return {
                data: rows.map((row) => ({
                    ...row,
                    userName:
                        `${userMap.get(row.userId)?.firstName ?? ""} ${userMap.get(row.userId)?.lastName ?? ""}`.trim(),
                    userEmail: userMap.get(row.userId)?.email ?? "",
                })),
                count: rows.length,
            };
        }),
    getUserTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId, ctx }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });
            if (!ticket) return null;

            const [order, notes, dispute, user] = await Promise.all([
                ticket.orderId
                    ? ctx.queries.orders.getOrderById(ticket.orderId)
                    : null,
                db.query.userSupportInternalNotes.findMany({
                    where: eq(userSupportInternalNotes.ticketId, ticket.id),
                    orderBy: [desc(userSupportInternalNotes.createdAt)],
                }),
                db.query.userSupportDisputes.findFirst({
                    where: eq(userSupportDisputes.ticketId, ticket.id),
                }),
                db.query.users.findFirst({
                    where: eq(users.id, ticket.userId),
                }),
            ]);

            return {
                ...ticket,
                order,
                notes,
                dispute,
                user,
            };
        }),
    getUserMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            await db
                .update(userSupportTickets)
                .set({ unreadByAdmin: "false", lastOpenedAt: new Date() })
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
    updateUserTicketStatus: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                status: statusSchema,
                resolutionType: z.string().optional(),
                resolutionSummary: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!existing) throw new Error("Ticket not found");

            const updated = await db
                .update(userSupportTickets)
                .set({
                    status: input.status,
                    resolutionType:
                        input.resolutionType ?? existing.resolutionType,
                    resolutionSummary:
                        input.resolutionSummary ?? existing.resolutionSummary,
                    statusChangedAt: new Date(),
                    resolvedAt:
                        input.status === "resolved"
                            ? new Date()
                            : existing.resolvedAt,
                    updatedAt: new Date(),
                    unreadByUser: "true",
                })
                .where(eq(userSupportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_status_changed",
                entityType: "user_support_ticket",
                entityId: existing.id,
                beforeValue: { status: existing.status },
                afterValue: {
                    status: input.status,
                    resolutionType: updated.resolutionType,
                    resolutionSummary: updated.resolutionSummary,
                },
                reason: input.resolutionSummary ?? "user_ticket_status_update",
            });

            await notifyUser({
                userId: existing.userId,
                actorId: ctx.user.id,
                type: "support.ticket.status_changed",
                title: "Your support case was updated",
                body: `"${existing.title}" is now ${input.status.replace(/_/g, " ")}`,
                href: buildSupportHref(existing.id),
                emailSubject: `Support case updated: ${existing.title}`,
                emailIntro: `Your support case "${existing.title}" has been updated.`,
                emailDetails: [
                    `New status: ${input.status}`,
                    ...(input.resolutionSummary
                        ? [`Update: ${input.resolutionSummary}`]
                        : []),
                ],
                metadata: {
                    ticketId: existing.id,
                    status: input.status,
                },
            });

            return updated;
        }),
    sendUserMessage: protectedProcedure
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
            if (!ticket) throw new Error("Ticket not found");

            const inserted = await db
                .insert(userSupportMessages)
                .values({
                    ticketId: ticket.id,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: input.text.trim(),
                })
                .returning()
                .then((res) => res[0]);

            await attachUserMessageFiles(inserted.id, input.attachments);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_message_added",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                afterValue: { messageId: inserted.id, sender: "admin" },
                reason: "customer_ticket_reply",
            });

            await db
                .update(userSupportTickets)
                .set({
                    unreadByUser: "true",
                    unreadByAdmin: "false",
                    latestMessageAt: new Date(),
                    status: ["resolved", "closed", "rejected"].includes(
                        ticket.status
                    )
                        ? ticket.status
                        : ticket.status === "approved"
                          ? "approved"
                          : ticket.status === "waiting_for_brand"
                            ? "waiting_for_brand"
                            : "waiting_for_customer",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.ticket.reply",
                title: "New reply on your support case",
                body: `Our support team replied to "${ticket.title}"`,
                href: buildSupportHref(ticket.id),
                emailSubject: `New reply on support case: ${ticket.title}`,
                emailIntro: `Our support team replied to your support case "${ticket.title}".`,
                emailDetails: [`Message: ${input.text.trim().slice(0, 140)}`],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
    addUserInternalNote: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                note: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const note = await db
                .insert(userSupportInternalNotes)
                .values({
                    ticketId: input.ticketId,
                    authorId: ctx.user.id,
                    note: input.note.trim(),
                })
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_internal_note_added",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                afterValue: { noteId: note.id },
                reason: "internal_note",
            });
            return note;
        }),
    assignUserTicket: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                adminId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const before = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            const updated = await db
                .update(userSupportTickets)
                .set({
                    assignedAdminId: input.adminId,
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_assigned",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                beforeValue: { assignedAdminId: before?.assignedAdminId ?? null },
                afterValue: { assignedAdminId: input.adminId },
                reason: "ticket_assignment",
            });
            await createOperationalAlert({
                actorId: ctx.user.id,
                type: "ticket_assigned",
                severity: "info",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                title: "Customer ticket assigned",
                message: `Ticket ${input.ticketId} assigned to ${input.adminId}.`,
                ownerRole: "support_manager",
                dedupeKey: `ticket:assigned:${input.ticketId}:${input.adminId}`,
            });
            return updated;
        }),
    listDisputes: protectedProcedure
        .input(
            z.object({
                status: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const disputes = await db.query.userSupportDisputes.findMany({
                where:
                    input.status && input.status !== "all"
                        ? eq(userSupportDisputes.status, input.status)
                        : undefined,
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
        .query(async ({ input: disputeId, ctx }) => {
            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.id, disputeId),
            });
            if (!dispute) return null;

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
    approveUserDispute: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                disputeType: z
                    .enum(["replacement", "refund", "manual_review"])
                    .default("replacement"),
                summary: z.string().min(1),
                quantityOverrides: z
                    .array(
                        z.object({
                            orderItemId: z.string().uuid(),
                            quantity: z.number().int().positive(),
                        })
                    )
                    .default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) {
                throw new Error("Support ticket not found");
            }
            if (!ticket.orderId) {
                throw new Error(
                    "This support ticket is not linked to an order, so brand action cannot be created."
                );
            }

            const sourceOrder = await ctx.queries.orders.getOrderById(
                ticket.orderId
            );

            if (!sourceOrder) {
                throw new Error(
                    "The linked order could not be loaded for this support ticket."
                );
            }

            const linkedOrderItem = ticket.orderItemId
                ? sourceOrder.items.find(
                      (item) => item.id === ticket.orderItemId
                  )
                : null;

            const resolvedBrandId =
                ticket.brandId ??
                linkedOrderItem?.product.brandId ??
                sourceOrder.items?.[0]?.product?.brandId ??
                null;

            if (!resolvedBrandId) {
                throw new Error(
                    "The linked order was found, but the brand could not be resolved from it."
                );
            }

            if (ticket.brandId !== resolvedBrandId) {
                await db
                    .update(userSupportTickets)
                    .set({
                        brandId: resolvedBrandId,
                        updatedAt: new Date(),
                    })
                    .where(eq(userSupportTickets.id, ticket.id));
            }

            const existing = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            let replacementOrderId: string | null =
                existing?.replacementOrderId ?? null;

            const quantityOverrideMap = Object.fromEntries(
                input.quantityOverrides.map((item) => [
                    item.orderItemId,
                    item.quantity,
                ])
            );

            if (input.disputeType === "replacement" && !replacementOrderId) {
                const createdReplacement = await createDisputeReplacementOrder({
                    sourceOrder,
                    brandId: resolvedBrandId,
                    orderItemId: ticket.orderItemId,
                    quantityOverrides: quantityOverrideMap,
                });

                replacementOrderId = createdReplacement.replacementOrderId;
            }

            const disputeStatus = replacementOrderId
                ? "replacement_created"
                : "approved_for_brand_action";

            const dispute = existing
                ? await db
                      .update(userSupportDisputes)
                      .set({
                          disputeType: input.disputeType,
                          status: disputeStatus,
                          adminDecision: "approved",
                          adminDecisionSummary: input.summary,
                          approvedBy: ctx.user.id,
                          approvedAt: new Date(),
                          actionRequestedAt: new Date(),
                          actionCompletedAt: replacementOrderId
                              ? new Date()
                              : existing.actionCompletedAt,
                          replacementOrderId,
                          updatedAt: new Date(),
                      })
                      .where(eq(userSupportDisputes.id, existing.id))
                      .returning()
                      .then((res) => res[0])
                : await db
                      .insert(userSupportDisputes)
                      .values({
                          ticketId: ticket.id,
                          orderId: ticket.orderId,
                          orderItemId: ticket.orderItemId ?? null,
                          brandId: resolvedBrandId,
                          disputeType: input.disputeType,
                          status: disputeStatus,
                          adminDecision: "approved",
                          adminDecisionSummary: input.summary,
                          approvedBy: ctx.user.id,
                          approvedAt: new Date(),
                          actionRequestedAt: new Date(),
                          actionCompletedAt: replacementOrderId
                              ? new Date()
                              : null,
                          replacementOrderId,
                      })
                      .returning()
                      .then((res) => res[0]);

            await db
                .update(userSupportTickets)
                .set({
                    brandActionRequired: true,
                    brandActionStatus: replacementOrderId
                        ? "replacement_created"
                        : "awaiting_brand_action",
                    status: "approved",
                    linkedReplacementOrderId: replacementOrderId,
                    unreadByUser: "true",
                    unreadByAdmin: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            if (replacementOrderId) {
                await db
                    .update(userSupportDisputes)
                    .set({
                        metadata: {
                            ...(dispute.metadata ?? {}),
                            autoCreatedByAdminId: ctx.user.id,
                            autoCreatedAt: new Date().toISOString(),
                        },
                    })
                    .where(eq(userSupportDisputes.id, dispute.id));

                await db.insert(userSupportMessages).values({
                    ticketId: ticket.id,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: `Replacement order ${replacementOrderId} was automatically created and forwarded to the brand for fulfilment.`,
                    messageType: "system",
                });
            }

            await notifyBrandUsers({
                brandId: resolvedBrandId,
                actorId: ctx.user.id,
                type: "support.dispute.approved",
                title: replacementOrderId
                    ? "A dispute replacement order was created"
                    : "A dispute needs brand action",
                body: replacementOrderId
                    ? `Replacement order ${replacementOrderId} was created for "${ticket.title}"`
                    : `Admin approved support case "${ticket.title}" for brand action`,
                href: buildBrandSupportHref(resolvedBrandId, ticket.id),
                emailSubject: replacementOrderId
                    ? `Replacement order created for support case ${ticket.id}`
                    : `Brand action needed for support case ${ticket.id}`,
                emailIntro: replacementOrderId
                    ? "A dispute-linked replacement order was automatically created and is now ready for brand fulfilment."
                    : "A customer support case has been approved for brand action.",
                emailDetails: replacementOrderId
                    ? [
                          `Ticket: ${ticket.id}`,
                          `Original order: ${ticket.orderId}`,
                          `Replacement order: ${replacementOrderId}`,
                          `Requested action: ${input.disputeType}`,
                          `Admin summary: ${input.summary}`,
                      ]
                    : [
                          `Ticket: ${ticket.id}`,
                          `Order: ${ticket.orderId}`,
                          `Requested action: ${input.disputeType}`,
                          `Admin summary: ${input.summary}`,
                      ],
                metadata: {
                    ticketId: ticket.id,
                    disputeId: dispute.id,
                    replacementOrderId,
                },
            });

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.dispute.approved",
                title: "Your support case moved forward",
                body: replacementOrderId
                    ? `We approved your case and created replacement order ${replacementOrderId}.`
                    : "We approved your case and asked the brand to take action.",
                href: buildSupportHref(ticket.id),
                emailSubject: replacementOrderId
                    ? "Replacement order created for your support case"
                    : "Support case approved for next action",
                emailIntro: replacementOrderId
                    ? "We reviewed your case and created a replacement order for you."
                    : "We reviewed your support case and moved it forward for the next action.",
                emailDetails: replacementOrderId
                    ? [
                          `Case: ${ticket.title}`,
                          `Replacement order: ${replacementOrderId}`,
                          "Next step: the brand will fulfil this replacement order.",
                      ]
                    : [
                          `Case: ${ticket.title}`,
                          "Next step: the brand has been notified to act on it.",
                      ],
                metadata: {
                    ticketId: ticket.id,
                    replacementOrderId,
                },
            });

            return {
                ...dispute,
                brandId: resolvedBrandId,
                replacementOrderId,
                status: replacementOrderId
                    ? "replacement_created"
                    : dispute.status,
            };
        }),
    rejectUserDispute: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                summary: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const existing = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            const dispute = existing
                ? await db
                      .update(userSupportDisputes)
                      .set({
                          status: "rejected",
                          adminDecision: "rejected",
                          adminDecisionSummary: input.summary,
                          updatedAt: new Date(),
                      })
                      .where(eq(userSupportDisputes.id, existing.id))
                      .returning()
                      .then((res) => res[0])
                : null;

            await db
                .update(userSupportTickets)
                .set({
                    status: "rejected",
                    resolutionSummary: input.summary,
                    unreadByUser: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.dispute.rejected",
                title: "Your support case was reviewed",
                body: `We reviewed "${ticket.title}" and shared an update.`,
                href: buildSupportHref(ticket.id),
                emailSubject: "Support case review update",
                emailIntro:
                    "We reviewed your support case and added an update.",
                emailDetails: [input.summary],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return dispute;
        }),
    sendApologyCoupon: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                description: z.string().min(1),
                discountType: z.enum(["percentage", "fixed"]),
                discountValue: z.number().int().positive(),
                minOrderAmount: z.number().int().nonnegative().default(0),
                maxDiscountAmount: z
                    .number()
                    .int()
                    .nonnegative()
                    .nullable()
                    .optional(),
                maxUses: z.number().int().positive().default(1),
                expiresInDays: z.number().int().positive().default(30),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const code = `CARE${generateId({ length: 6, casing: "upper" })}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

            const coupon = await ctx.queries.coupons.createCoupon({
                code,
                description: input.description,
                discountType: input.discountType,
                discountValue: input.discountValue,
                minOrderAmount: input.minOrderAmount,
                maxDiscountAmount: input.maxDiscountAmount ?? null,
                categoryId: null,
                subCategoryId: null,
                productTypeId: null,
                expiresAt,
                maxUses: input.maxUses,
            });

            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            if (dispute) {
                await db
                    .update(userSupportDisputes)
                    .set({
                        couponCode: coupon.code,
                        updatedAt: new Date(),
                    })
                    .where(eq(userSupportDisputes.id, dispute.id));
            }

            await db
                .update(userSupportTickets)
                .set({
                    resolutionType: "coupon",
                    resolutionSummary:
                        `${ticket.resolutionSummary ?? ""}\nCoupon sent: ${coupon.code}`.trim(),
                    unreadByUser: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.coupon.sent",
                title: "A goodwill coupon was added to your case",
                body: `We sent coupon ${coupon.code} for the inconvenience.`,
                href: buildSupportHref(ticket.id),
                emailSubject: "A goodwill coupon from Renivet",
                emailIntro:
                    "We shared a coupon on your support case as a goodwill gesture.",
                emailDetails: [
                    `Coupon code: ${coupon.code}`,
                    `Discount: ${input.discountType === "percentage" ? `${input.discountValue}%` : `₹${(input.discountValue / 100).toLocaleString("en-IN")}`}`,
                    `Valid until: ${expiresAt.toDateString()}`,
                ],
                metadata: {
                    ticketId: ticket.id,
                    couponCode: coupon.code,
                },
            });

            return coupon;
        }),
});
