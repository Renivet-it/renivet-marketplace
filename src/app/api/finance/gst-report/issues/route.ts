import { getFinanceModuleAccess } from "@/lib/finance/access";
import { previewGstExport } from "@/lib/finance/gst";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) {
        return "severity,code,entity_type,entity_id,message\n";
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
        moduleKey: "gst_reports",
    });

    if (!access.canView && !access.canManage) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const monthKey = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const preview = await previewGstExport(monthKey);
    const fileMonth = monthKey.split("-")[1] + monthKey.split("-")[0];
    const csv = toCsv(
        preview.validationIssues.map((issue) => ({
            severity: issue.severity,
            code: issue.code,
            entity_type: issue.entityType,
            entity_id: issue.entityId,
            message: issue.message,
        }))
    );

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="RENIVET_GST_ISSUES_${fileMonth}.csv"`,
        },
    });
}
