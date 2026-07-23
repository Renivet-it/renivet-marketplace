import { db } from "@/lib/db";
import { userSupportMessages, userSupportTickets } from "@/lib/db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

function isAuthorized(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";

    return (
        request.headers.get("authorization") === `Bearer ${secret}` ||
        request.nextUrl.searchParams.get("secret") === secret
    );
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const inactiveSince = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const tickets = await db.query.userSupportTickets.findMany({
        where: and(
            inArray(userSupportTickets.status, ACTIVE_STATUSES),
            lt(userSupportTickets.latestMessageAt, inactiveSince)
        ),
    });

    for (const ticket of tickets) {
        await db
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
            );

        await db.insert(userSupportMessages).values({
            ticketId: ticket.id,
            sender: "system",
            senderId: "system",
            text: "Case closed automatically after 8 days without further activity.",
            messageType: "system",
        });
    }

    return NextResponse.json({
        ok: true,
        closedCount: tickets.length,
        inactiveSince,
    });
}
