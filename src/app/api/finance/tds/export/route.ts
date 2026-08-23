import { getFinanceModuleAccess } from "@/lib/finance/access";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { canExportTdsReport } from "@/lib/finance/export-access";
import {
    buildQuarterlyTdsExport,
    getCurrentFinancialYear,
    getQuarterForDate,
} from "@/lib/finance/tds";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const user = await userCache.get(userId);
    const sitePermissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions,
        roles: user?.roles,
        moduleKey: "tds_reports",
    });
    if (!canExportTdsReport(access)) {
        return NextResponse.json(
            { ok: false, error: "Forbidden" },
            { status: 403 }
        );
    }

    const financialYear =
        req.nextUrl.searchParams.get("financialYear") ??
        getCurrentFinancialYear();
    const quarterParam = req.nextUrl.searchParams.get("quarter");
    const quarter =
        quarterParam === "Q1" ||
        quarterParam === "Q2" ||
        quarterParam === "Q3" ||
        quarterParam === "Q4"
            ? quarterParam
            : getQuarterForDate();
    const result = await buildQuarterlyTdsExport({
        financialYear,
        quarter,
    });

    await writeFinanceAuditEvent({
        actorId: userId,
        actionType: "tds_summary.exported",
        entityType: "tds_summary",
        entityId: `${financialYear}-${quarter}`,
        metadata: {
            financialYear,
            quarter,
            rowCount: result.rows.length,
        },
    });

    return new NextResponse(result.csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="RENIVET_TDS_${financialYear}_${quarter}.csv"`,
        },
    });
}
