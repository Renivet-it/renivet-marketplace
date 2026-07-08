import { buildQuarterlyTdsExport, getCurrentFinancialYear, getQuarterForDate } from "@/lib/finance/tds";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const financialYear = req.nextUrl.searchParams.get("financialYear") ?? getCurrentFinancialYear();
    const quarterParam = req.nextUrl.searchParams.get("quarter");
    const quarter =
        quarterParam === "Q1" || quarterParam === "Q2" || quarterParam === "Q3" || quarterParam === "Q4"
            ? quarterParam
            : getQuarterForDate();
    const result = await buildQuarterlyTdsExport({
        financialYear,
        quarter,
    });

    await writeFinanceAuditEvent({
        actorId: "api",
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
