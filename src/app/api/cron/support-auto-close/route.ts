import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

const ACTIVE_STATUSES = [
    "new",
    "acknowledged",
    "in_progress",
    "waiting_customer",
    "waiting_brand",
    "waiting_internal",
    "reopened",
    "escalated",
] as const;

// Intentionally public at the administrator's request. Configure a scheduler
// to invoke this endpoint once per day.
export async function GET() {
    const inactiveSince = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const tickets = await db.query.userSupportTickets.findMany({
        where: and(
            inArray(userSupportTickets.status, ACTIVE_STATUSES),
            lt(userSupportTickets.latestMessageAt, inactiveSince)
        ),
    });

    let closedCount = 0;
    for (const ticket of tickets) {
        const updated = await db
            .update(userSupportTickets)
            .set({
                status: "closed",
                resolutionCode: "RES_AUTOCLOSED_NO_RESPONSE",
                resolutionSummary:
                    "Automatically closed after 8 days without further activity.",
                statusChangedAt: new Date(),
                closedAt: new Date(),
                resolvedAt: new Date(),
                updatedAt: new Date(),
                unreadByUser: "true",
            })
            .where(
                and(
                    eq(userSupportTickets.id, ticket.id),
                    inArray(userSupportTickets.status, ACTIVE_STATUSES)
                )
            )
            .returning({ id: userSupportTickets.id });

        if (!updated.length) continue;
        closedCount += 1;
        await db.insert(userSupportMessages).values({
            ticketId: ticket.id,
            sender: "system",
            senderId: "system",
            text: "Case closed automatically after 8 days without further activity.",
            messageType: "system",
        });
    }

    return NextResponse.json({ ok: true, closedCount, inactiveSince });
}
