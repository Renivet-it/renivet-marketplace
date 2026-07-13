import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { analyticsSavedReports } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

async function assertAllowed() {
    const { userId } = await auth();
    if (!userId) return { ok: false as const, status: 401 };

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const allowed = hasPermission(
        permissions,
        [
            BitFieldSitePermission.ADMINISTRATOR,
            BitFieldSitePermission.MANAGE_MONITORING,
        ],
        "any"
    );

    return allowed
        ? { ok: true as const, userId }
        : { ok: false as const, status: 403 };
}

function normalizeValue(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value) || (value && typeof value === "object")) {
        return JSON.stringify(value);
    }
    return value ?? "";
}

function rowsToCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) return "";
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const quote = String.fromCharCode(34);
    const escape = (value: unknown) => {
        const raw = String(normalizeValue(value));
        const escaped = raw.replace(/"/g, quote + quote);
        return /[",\n\r]/.test(raw) ? `"${escaped}"` : raw;
    };

    return [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
    ].join("\n");
}

export async function GET(req: NextRequest) {
    const access = await assertAllowed();
    if (!access.ok) {
        return NextResponse.json(
            {
                ok: false,
                error: access.status === 401 ? "Unauthorized" : "Forbidden",
            },
            { status: access.status }
        );
    }

    const format = req.nextUrl.searchParams.get("format") ?? "xlsx";
    const reportMonth =
        req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const report = await monitoringSlaQueries.getMarketingPerformance();

    await db.insert(analyticsSavedReports).values({
        name: `Marketing Report ${reportMonth}`,
        category: "Acquisition",
        createdBy: access.userId,
        metrics: [
            "sessions",
            "visitors",
            "orders_count",
            "total_sales",
        ],
        dimensions: ["date"],
        filtersJson: {
            reportMonth,
            generatedFrom: "marketing-monitoring-dashboard",
            snapshot: report,
        },
        visualizationType: "table",
        isSystemReport: true,
    });

    const summaryRows = [
        {
            reportMonth,
            weekStart: report.weekStart,
            weekEnd: report.weekEnd,
            sessions: report.kpis.sessions,
            visitors: report.kpis.visitors,
            browseRate: report.kpis.browseRate,
            cartRate: report.kpis.cartRate,
            checkoutRate: report.kpis.checkoutRate,
            purchaseRate: report.kpis.purchaseRate,
            returningCustomerRate: report.kpis.returningCustomerRate,
            emailSends: report.kpis.emailSends,
            blendedCac: report.blendedCac,
            blendedRoas: report.blendedRoas,
        },
    ];

    const sourceMediumRows = report.sourceMediumPerformance.map(
        (row: Record<string, unknown>) => ({
            source: row.source,
            medium: row.medium,
            sessions: row.sessions,
            visitors: row.visitors,
        })
    );

    const landingRows = report.landingPerformanceByCampaign.map(
        (row: Record<string, unknown>) => ({
            campaign: row.campaign,
            landingPath: row.landingPath,
            sessions: row.sessions,
            visitors: row.visitors,
        })
    );

    const emailRows = report.emailSends.byCampaignType.map(
        (row: Record<string, unknown>) => ({
            campaignType: row.campaignType,
            sends: row.sends,
        })
    );

    const partnershipRows = [report.partnerships];

    if (format === "csv") {
        const sections = [
            "# Summary",
            rowsToCsv(summaryRows),
            "",
            "# Source Medium",
            rowsToCsv(sourceMediumRows),
            "",
            "# Landing By Campaign",
            rowsToCsv(landingRows),
            "",
            "# Email Sends",
            rowsToCsv(emailRows),
            "",
            "# Partnerships",
            rowsToCsv(partnershipRows),
        ].join("\n");

        return new NextResponse(sections, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${reportMonth}-marketing-report.csv"`,
            },
        });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(summaryRows.map((row) => Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])
        ))),
        "Summary"
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(sourceMediumRows),
        "Source Medium"
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(landingRows),
        "Landing Campaigns"
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(emailRows),
        "Email Sends"
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(partnershipRows),
        "Partnerships"
    );

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(buffer, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${reportMonth}-marketing-report.xlsx"`,
        },
    });
}
