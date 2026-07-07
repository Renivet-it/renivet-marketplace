import { userCache } from "@/lib/redis/methods";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import { formatINR, getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function escapeCsv(value: unknown) {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/"/g, "\"\"")}"`;
    }
    return text;
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const sitePermissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions,
        roles: user?.roles,
        moduleKey: "cod_reconciliation",
    });

    if (!access.canView && !access.canManage) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const attentionOnly = req.nextUrl.searchParams.get("attentionOnly") === "true";
    const rows = await financeComplianceQueries.listCodReconciliation({
        status,
        q,
        attentionOnly,
    });

    const header = [
        "Order ID",
        "AWB",
        "Carrier",
        "COD Amount",
        "Expected Remittance",
        "Remitted Amount",
        "Discrepancy",
        "Ageing Days",
        "Status",
        "Remittance Reference",
        "Notes",
    ];
    const data = rows.map((row) => [
        row.orderId ?? "",
        row.awbNumber ?? "",
        row.carrier,
        formatINR(row.codAmountPaise),
        formatINR(row.expectedRemittancePaise ?? row.expectedAmountPaise),
        formatINR(row.remittedAmountPaise ?? 0),
        formatINR(row.discrepancyAmountPaise ?? 0),
        row.ageingDays,
        row.status,
        row.remittanceReference ?? "",
        row.notes ?? "",
    ]);

    const csv = [header, ...data]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=\"renivet-cod-reconciliation.csv\"",
        },
    });
}
