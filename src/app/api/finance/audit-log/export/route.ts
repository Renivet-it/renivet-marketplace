import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function parseDate(value: string | null) {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) {
        return "timestamp_utc,entity_type,entity_id,action_type,actor_id,actor_type,reason,attachment_url\n";
    }

    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
    return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions: permissions,
        roles: user?.roles,
        moduleKey: "audit_log_finance",
    });

    if (!access.canView && !access.canManage) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams;
    const logs = await financeComplianceQueries.listFinanceAuditLogs({
        entityType: search.get("entityType") || undefined,
        entityId: search.get("entityId") || undefined,
        actionType: search.get("actionType") || undefined,
        actorId: search.get("actorId") || undefined,
        actorType: search.get("actorType") || undefined,
        from: parseDate(search.get("from")),
        to: parseDate(search.get("to")),
        q: search.get("q") || undefined,
        attachmentOnly: search.get("attachmentOnly") === "true",
    });

    const csv = toCsv(
        logs.map((log) => ({
            timestamp_utc: log.timestampUtc.toISOString(),
            entity_type: log.entityType,
            entity_id: log.entityId,
            action_type: log.actionType,
            actor_id: log.userId ?? "",
            actor_type: log.actorType ?? "",
            reason: log.reason ?? "",
            attachment_url: log.attachmentUrl ?? "",
            finance_event_code: String((log.metadata as Record<string, unknown> | null)?.financeEventCode ?? ""),
            previous_value: JSON.stringify(log.beforeValue ?? {}),
            new_value: JSON.stringify(log.afterValue ?? {}),
        }))
    );

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=\"finance-audit-log.csv\"",
        },
    });
}
