import { env } from "@/../env";
import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import {
    calculateCustomerAutoCloseEligibleAt,
    calculateFirstResponseDueAt,
    calculateResolutionDueAt,
    getSupportCategoryConfig,
    normalizeSupportCategory,
    SUPPORT_TEMPLATE_LIBRARY,
} from "@/lib/customer-support/playbook";
import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { posthog } from "@/lib/posthog/client";
import { resend } from "@/lib/resend";
import { buildAdminSupportHref, notifyAdmins } from "@/lib/support/utils";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createTicketSchema } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

function buildContactAutoAck(ticketId: string, customerName?: string) {
    const humanizedId = ticketId.split("-")[0].toUpperCase();
    return SUPPORT_TEMPLATE_LIBRARY.AUTO_ACK
        .replaceAll("[Customer Name]", customerName || "Customer")
        .replaceAll("[ID]", humanizedId);
}

export const ticketRouter = createTRPCRouter({
    getTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_FEEDBACK |
                    BitFieldSitePermission.MANAGE_FEEDBACK,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search } = input;

            const tickets = await queries.tickets.getTickets({
                limit,
                page,
                search,
            });

            return tickets;
        }),
    getTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_FEEDBACK |
                    BitFieldSitePermission.MANAGE_FEEDBACK,
                "any"
            )
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingTicket = await queries.tickets.getTicket(id);
            if (!existingTicket)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });

            return existingTicket;
        }),
    createTicket: publicProcedure
        .input(createTicketSchema)
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { userId } = await auth();

            const newTicket = await queries.tickets.createTicket(input);
            const category = normalizeSupportCategory({
                category: "OTHER",
                issueType: "general_query",
                text: `${input.message} ${input.company ?? ""}`,
            });
            const categoryConfig = getSupportCategoryConfig(category);
            const now = new Date();
            const supportTicket = await db
                .insert(userSupportTickets)
                .values({
                    userId:
                        userId ?? `guest:${input.email.trim().toLowerCase()}`,
                    title: `Contact form: ${input.name}`,
                    category,
                    issueType: "general_query",
                    issueLabel: "Contact form message",
                    description: input.message,
                    sourceChannel: "web_form",
                    priority: categoryConfig.priority,
                    status:
                        categoryConfig.priority === "critical"
                            ? "escalated"
                            : "acknowledged",
                    assignedAdminId:
                        categoryConfig.requiresAj ||
                        categoryConfig.priority === "critical"
                            ? process.env.AJ_USER_ID ||
                              process.env.SUPPORT_MANAGER_USER_ID ||
                              process.env.SUPPORT_INTERN_USER_ID ||
                              null
                            : categoryConfig.defaultOwnerRole === "order_ops"
                              ? process.env.ORDER_OPS_INTERN_USER_ID ||
                                process.env.SUPPORT_INTERN_USER_ID ||
                                null
                              : process.env.SUPPORT_INTERN_USER_ID || null,
                    firstResponseDueAt: calculateFirstResponseDueAt(
                        category,
                        now
                    ),
                    resolutionDueAt: calculateResolutionDueAt(category, now),
                    autoAckSentAt: now,
                    autoAckTemplateKey: "AUTO_ACK",
                    autoCloseEligibleAt:
                        calculateCustomerAutoCloseEligibleAt(now),
                    escalatedAt:
                        categoryConfig.priority === "critical" ? now : null,
                    escalationOwner:
                        categoryConfig.priority === "critical" ? "AJ" : null,
                    latestMessageAt: now,
                    statusChangedAt: now,
                    intakeContext: {
                        legacyTicketId: newTicket.id,
                        contactName: input.name,
                        contactEmail: input.email,
                        contactPhone: input.phone,
                        company: input.company ?? null,
                    },
                })
                .returning()
                .then((res) => res[0]);

            await db.insert(userSupportMessages).values([
                {
                    ticketId: supportTicket.id,
                    sender: "customer",
                    senderId:
                        userId ?? `guest:${input.email.trim().toLowerCase()}`,
                    text: input.message,
                    messageType: "message",
                    metadata: {
                        sourceChannel: "web_form",
                        legacyTicketId: newTicket.id,
                        email: input.email,
                        phone: input.phone,
                    },
                },
                {
                    ticketId: supportTicket.id,
                    sender: "system",
                    senderId: "support-bot",
                    text: buildContactAutoAck(supportTicket.id, input.name),
                    messageType: "system",
                    metadata: { template: "AUTO_ACK" },
                },
            ]);

            await Promise.allSettled([
                notifyAdmins({
                    actorId: userId,
                    type: "support.contact.created",
                    title: "New contact form support case",
                    body: `${input.name} submitted a contact form message.`,
                    href: buildAdminSupportHref(supportTicket.id, "user"),
                    emailSubject: `New Renivet contact message: ${input.name}`,
                    emailIntro:
                        "A public contact form message has been routed into the customer support queue.",
                    emailDetails: [
                        `Ticket: ${supportTicket.id}`,
                        `Name: ${input.name}`,
                        `Email: ${input.email}`,
                        `Phone: ${input.phone}`,
                        `Category: ${category}`,
                    ],
                    metadata: {
                        ticketId: supportTicket.id,
                        legacyTicketId: newTicket.id,
                    },
                }),
                resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: [input.email],
                    subject: `Renivet support case ${supportTicket.id.slice(0, 8)} created`,
                    text: buildContactAutoAck(supportTicket.id, input.name),
                }),
            ]);

            await auditEntityChange({
                actorId: userId,
                actionType: "public_contact_support_ticket_created",
                entityType: "user_support_ticket",
                entityId: supportTicket.id,
                afterValue: {
                    legacyTicketId: newTicket.id,
                    category,
                    sourceChannel: "web_form",
                    firstResponseDueAt: supportTicket.firstResponseDueAt,
                    resolutionDueAt: supportTicket.resolutionDueAt,
                },
                reason: "chapter_3_contact_form_intake",
            });

            await createOperationalAlert({
                actorId: userId,
                type:
                    categoryConfig.priority === "critical"
                        ? "critical_contact_support_ticket"
                        : "new_ticket_created",
                severity:
                    categoryConfig.priority === "critical"
                        ? "critical"
                        : "info",
                entityType: "user_support_ticket",
                entityId: supportTicket.id,
                title: "New contact form support ticket",
                message: `${input.name} submitted a public contact form support case.`,
                ownerRole:
                    categoryConfig.priority === "critical"
                        ? "aj"
                        : "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dedupeKey: `ticket:contact:${supportTicket.id}`,
                metadata: {
                    category,
                    legacyTicketId: newTicket.id,
                },
            });

            posthog.capture({
                distinctId: userId ?? "unknown",
                event: POSTHOG_EVENTS.TICKET.CREATED,
                properties: {
                    ticketId: newTicket.id,
                    ticketName: newTicket.name,
                },
            });

            return newTicket;
        }),
    deleteTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_FEEDBACK))
        .mutation(async ({ ctx, input }) => {
            const { queries, user } = ctx;
            const { id } = input;

            const existingTicket = await queries.tickets.getTicket(id);
            if (!existingTicket)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });

            await queries.tickets.deleteTicket(id);

            posthog.capture({
                event: POSTHOG_EVENTS.TICKET.DELETED,
                distinctId: user.id,
                properties: {
                    ticketId: id,
                    ticketName: existingTicket.name,
                },
            });

            return true;
        }),
});
