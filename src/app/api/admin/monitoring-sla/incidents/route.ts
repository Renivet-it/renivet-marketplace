import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const incidentSchema = z.object({
    type: z.enum([
        "platform_uptime_drop",
        "failed_deployment",
        "unauthorized_access_attempt",
        "customer_legal_social_complaint",
    ]),
    entityType: z.string().min(2).default("platform_incident"),
    entityId: z.string().min(1).default("manual"),
    title: z.string().min(3).max(160),
    message: z.string().min(3).max(2000),
    severity: z.enum(["info", "warning", "critical"]).default("critical"),
});

export async function POST(req: NextRequest) {
    const { userId, sessionId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const allowed = hasPermission(
        permissions,
        [BitFieldSitePermission.ADMINISTRATOR, BitFieldSitePermission.MANAGE_MONITORING],
        "any"
    );

    if (!allowed) {
        await monitoringSlaQueries.createAlert({
            type: "unauthorized_access_attempt",
            severity: "critical",
            entityType: "user",
            entityId: userId,
            title: "Unauthorized monitoring incident attempt",
            message: `User ${userId} attempted to create a monitoring incident without permission.`,
            ownerId: userId,
            ownerRole: "admin",
            channels: ["admin", "email"],
            dedupeKey: `unauthorized:monitoring-incident:${userId}`,
            metadata: { sessionId },
        });
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const input = incidentSchema.parse(await req.json());
    const alert = await monitoringSlaQueries.createAlert({
        type: input.type,
        severity: input.severity,
        entityType: input.entityType,
        entityId: input.entityId,
        title: input.title,
        message: input.message,
        ownerId: userId,
        ownerRole: "admin",
        channels: ["admin", "email", "whatsapp"],
        dedupeKey: `${input.type}:${input.entityType}:${input.entityId}:${Date.now()}`,
        metadata: { sessionId, manualIncident: true },
    });

    return NextResponse.json({ ok: true, data: alert });
}
