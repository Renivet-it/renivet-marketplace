import {
    calculateCustomerAutoCloseEligibleAt,
    calculateFirstResponseDueAt,
    calculateResolutionDueAt,
    getSupportCategoryConfig,
    normalizeSupportCategory,
    SUPPORT_CHANNELS,
    SUPPORT_TEMPLATE_LIBRARY,
} from "@/lib/customer-support/playbook";
import { db } from "@/lib/db";
import {
    users,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { buildAdminSupportHref, notifyAdmins } from "@/lib/support/utils";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const intakeSchema = z.object({
    sourceChannel: z.enum(SUPPORT_CHANNELS),
    customerEmail: z.string().email(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    userId: z.string().optional(),
    orderId: z.string().optional(),
    brandId: z.string().uuid().optional(),
    category: z.string().optional(),
    issueType: z.string().optional(),
    subject: z.string().min(1),
    message: z.string().min(1),
    externalMessageId: z.string().optional(),
});

function isAuthorized(request: Request) {
    const secret = process.env.SUPPORT_INTAKE_SECRET;
    if (!secret) return false;

    const header = request.headers.get("authorization") ?? "";
    return header === `Bearer ${secret}`;
}

function buildAutoAck(ticketId: string) {
    return SUPPORT_TEMPLATE_LIBRARY.AUTO_ACK.replaceAll("[ID]", ticketId);
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: "Unauthorized support intake request" },
            { status: 401 }
        );
    }

    const parsed = intakeSchema.safeParse(await request.json());
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const input = parsed.data;
    const existingUser = input.userId
        ? await db.query.users.findFirst({ where: eq(users.id, input.userId) })
        : await db.query.users.findFirst({
              where: eq(users.email, input.customerEmail),
          });

    const userId =
        existingUser?.id ?? `guest:${input.customerEmail.trim().toLowerCase()}`;
    const category = normalizeSupportCategory({
        category: input.category,
        issueType: input.issueType,
        text: `${input.subject} ${input.message}`,
    });
    const config = getSupportCategoryConfig(category);
    const now = new Date();

    const ticket = await db
        .insert(userSupportTickets)
        .values({
            userId,
            orderId: input.orderId ?? null,
            brandId: input.brandId ?? null,
            title: input.subject.trim(),
            category,
            issueType: input.issueType ?? category,
            issueLabel: category.replaceAll("_", " "),
            description: input.message.trim(),
            sourceChannel: input.sourceChannel,
            priority: config.priority,
            status:
                config.priority === "critical" ? "escalated" : "acknowledged",
            assignedAdminId:
                config.priority === "critical"
                    ? process.env.AJ_USER_ID ||
                      process.env.SUPPORT_MANAGER_USER_ID ||
                      process.env.SUPPORT_INTERN_USER_ID ||
                      null
                    : process.env.SUPPORT_INTERN_USER_ID || null,
            firstResponseDueAt: calculateFirstResponseDueAt(category, now),
            resolutionDueAt: calculateResolutionDueAt(category, now),
            autoAckSentAt: now,
            autoAckTemplateKey: "AUTO_ACK",
            autoCloseEligibleAt: calculateCustomerAutoCloseEligibleAt(now),
            escalatedAt: config.priority === "critical" ? now : null,
            escalationOwner: config.priority === "critical" ? "AJ" : null,
            latestMessageAt: now,
            statusChangedAt: now,
            intakeContext: {
                customerName: input.customerName ?? null,
                contactEmail: input.customerEmail,
                contactPhone: input.customerPhone ?? null,
                externalMessageId: input.externalMessageId ?? null,
            },
        })
        .returning()
        .then((res) => res[0]);

    await db.insert(userSupportMessages).values([
        {
            ticketId: ticket.id,
            sender: "customer",
            senderId: userId,
            text: input.message.trim(),
            messageType: "message",
            metadata: {
                sourceChannel: input.sourceChannel,
                externalMessageId: input.externalMessageId ?? null,
            },
        },
        {
            ticketId: ticket.id,
            sender: "system",
            senderId: "support-bot",
            text: buildAutoAck(ticket.id),
            messageType: "system",
            metadata: { template: "AUTO_ACK" },
        },
    ]);

    await notifyAdmins({
        type: "support.inbound_intake.created",
        title: "Inbound support case created",
        body: `${input.sourceChannel.replaceAll("_", " ")} message routed to support.`,
        href: buildAdminSupportHref(ticket.id, "user"),
        emailSubject: `Inbound support case: ${input.subject}`,
        emailIntro:
            "An inbound customer message was routed into the support queue.",
        emailDetails: [
            `Ticket: ${ticket.id}`,
            `Channel: ${input.sourceChannel}`,
            `Customer: ${input.customerEmail}`,
            `Category: ${category}`,
        ],
        metadata: { ticketId: ticket.id, sourceChannel: input.sourceChannel },
    });

    await auditEntityChange({
        actionType: "inbound_support_ticket_created",
        entityType: "user_support_ticket",
        entityId: ticket.id,
        afterValue: {
            sourceChannel: input.sourceChannel,
            category,
            firstResponseDueAt: ticket.firstResponseDueAt,
            resolutionDueAt: ticket.resolutionDueAt,
        },
        reason: "chapter_3_inbound_channel_intake",
    });

    await createOperationalAlert({
        type:
            config.priority === "critical"
                ? "critical_inbound_support_ticket"
                : "new_ticket_created",
        severity: config.priority === "critical" ? "critical" : "info",
        entityType: "user_support_ticket",
        entityId: ticket.id,
        title: "Inbound support ticket created",
        message: `${input.sourceChannel.replaceAll("_", " ")} message created ticket ${ticket.id}.`,
        ownerRole: config.priority === "critical" ? "aj" : "support_manager",
        channels: ["admin", "email", "whatsapp"],
        dedupeKey: `ticket:inbound:${ticket.id}`,
        metadata: { sourceChannel: input.sourceChannel, category },
    });

    return NextResponse.json({ ticketId: ticket.id, category });
}
