import { db } from "@/lib/db";
import { brandTdsTracking } from "@/lib/db/schema";
import { toCsv } from "@/lib/finance/reporting";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const financialYear = req.nextUrl.searchParams.get("financialYear");
    const rows = await db.query.brandTdsTracking.findMany({
        where: financialYear ? eq(brandTdsTracking.financialYear, financialYear) : undefined,
        orderBy: [desc(brandTdsTracking.financialYear)],
    });

    const csv = toCsv(
        rows.map((row) => ({
            brandId: row.brandId,
            financialYear: row.financialYear,
            cumulativeCommissionPaise: row.cumulativeCommissionPaise,
            cumulativeTdsPaise: row.cumulativeTdsPaise,
            thresholdPaise: row.thresholdPaise,
            tdsRateBps: row.tdsRateBps,
        }))
    );

    await writeFinanceAuditEvent({
        actorId: "api",
        actionType: "tds_summary.exported",
        entityType: "tds_summary",
        entityId: financialYear ?? "all",
        metadata: {
            rowCount: rows.length,
        },
    });

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="RENIVET_TDS_${financialYear ?? "ALL"}.csv"`,
        },
    });
}
