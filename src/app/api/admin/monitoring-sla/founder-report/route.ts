import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    accessReviewItems,
    accessReviewRuns,
    carrierClaims,
    codReconciliationItems,
    codReconciliationRuns,
    dailyHealthSnapshots,
    fraudReviews,
    monitoringAlerts,
    orderOpsCommunications,
    orderOpsStates,
    orderReturnRequests,
    orders,
    orderShipments,
    refunds,
    rtoDispositions,
    slaCheckRuns,
    weeklyReportingPacks,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { and, desc, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

type ReportRow = Record<string, unknown>;

function monthWindow(month: string) {
    const [yearRaw, monthRaw] = month.split("-");
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);
    return { start, end };
}

function normalizeValue(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
}

function normalizeRows(rows: ReportRow[]) {
    return rows.map((row) =>
        Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
                key,
                normalizeValue(value),
            ])
        )
    );
}

function csvEscape(value: unknown) {
    const normalized = String(normalizeValue(value));
    const quote = String.fromCharCode(34);
    const escaped = normalized.replace(/"/g, quote + quote);
    return /[",\n\r]/.test(normalized) ? `"${escaped}"` : normalized;
}

function toCsv(sections: Array<{ name: string; rows: ReportRow[] }>) {
    return sections
        .map((section) => {
            const rows = normalizeRows(section.rows);
            const headers = Array.from(
                new Set(rows.flatMap((row) => Object.keys(row)))
            );
            const body = rows.length
                ? rows.map((row) =>
                      headers.map((header) => csvEscape(row[header])).join(",")
                  )
                : [headers.map(() => "").join(",")];

            return [
                `# ${section.name}`,
                headers.map(csvEscape).join(","),
                ...body,
            ].join("\n");
        })
        .join("\n\n");
}

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

    const now = new Date();
    const reportMonth =
        req.nextUrl.searchParams.get("month") ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const format = req.nextUrl.searchParams.get("format") ?? "xlsx";
    const { start, end } = monthWindow(reportMonth);

    const [
        slaRuns,
        snapshots,
        weeklyPacks,
        accessReviews,
        accessItems,
        alerts,
        orderOpsOrders,
        orderOpsShipments,
        orderOpsReturns,
        orderOpsRefunds,
        orderOpsStateRows,
        fraudReviewRows,
        rtoDispositionRows,
        carrierClaimRows,
        codRunRows,
        codItemRows,
        orderOpsCommunicationRows,
    ] = await Promise.all([
        db.query.slaCheckRuns.findMany({
            where: and(
                gte(slaCheckRuns.createdAt, start),
                lt(slaCheckRuns.createdAt, end)
            ),
            orderBy: [desc(slaCheckRuns.createdAt)],
        }),
        db.query.dailyHealthSnapshots.findMany({
            where: and(
                gte(dailyHealthSnapshots.createdAt, start),
                lt(dailyHealthSnapshots.createdAt, end)
            ),
            orderBy: [desc(dailyHealthSnapshots.createdAt)],
        }),
        db.query.weeklyReportingPacks.findMany({
            where: and(
                gte(weeklyReportingPacks.createdAt, start),
                lt(weeklyReportingPacks.createdAt, end)
            ),
            orderBy: [desc(weeklyReportingPacks.createdAt)],
        }),
        db.query.accessReviewRuns.findMany({
            where: and(
                gte(accessReviewRuns.createdAt, start),
                lt(accessReviewRuns.createdAt, end)
            ),
            orderBy: [desc(accessReviewRuns.createdAt)],
        }),
        db.query.accessReviewItems.findMany({
            where: and(
                gte(accessReviewItems.createdAt, start),
                lt(accessReviewItems.createdAt, end)
            ),
            orderBy: [desc(accessReviewItems.createdAt)],
        }),
        db.query.monitoringAlerts.findMany({
            where: and(
                gte(monitoringAlerts.createdAt, start),
                lt(monitoringAlerts.createdAt, end)
            ),
            orderBy: [desc(monitoringAlerts.createdAt)],
        }),
        db
            .select({
                id: orders.id,
                status: orders.status,
                paymentMethod: orders.paymentMethod,
                paymentStatus: orders.paymentStatus,
                totalAmount: orders.totalAmount,
                brandAcknowledgedAt: orders.brandAcknowledgedAt,
                cancellationReasonCode: orders.cancellationReasonCode,
                manualOverrideReason: orders.manualOverrideReason,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt,
            })
            .from(orders)
            .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)))
            .orderBy(desc(orders.createdAt)),
        db
            .select({
                id: orderShipments.id,
                orderId: orderShipments.orderId,
                brandId: orderShipments.brandId,
                courierName: orderShipments.courierName,
                awbNumber: orderShipments.awbNumber,
                trackingNumber: orderShipments.trackingNumber,
                status: orderShipments.status,
                shipmentDate: orderShipments.shipmentDate,
                estimatedDeliveryDate: orderShipments.estimatedDeliveryDate,
                isPickupScheduled: orderShipments.isPickupScheduled,
                pickupScheduledDate: orderShipments.pickupScheduledDate,
                isRtoReturn: orderShipments.isRtoReturn,
                createdAt: orderShipments.createdAt,
                updatedAt: orderShipments.updatedAt,
            })
            .from(orderShipments)
            .where(
                and(
                    gte(orderShipments.createdAt, start),
                    lt(orderShipments.createdAt, end)
                )
            )
            .orderBy(desc(orderShipments.createdAt)),
        db
            .select({
                id: orderReturnRequests.id,
                orderId: orderReturnRequests.orderId,
                orderItemId: orderReturnRequests.orderItemId,
                brandId: orderReturnRequests.brandId,
                requestType: orderReturnRequests.requestType,
                reason: orderReturnRequests.reason,
                status: orderReturnRequests.status,
                createdAt: orderReturnRequests.createdAt,
                updatedAt: orderReturnRequests.updatedAt,
            })
            .from(orderReturnRequests)
            .where(
                and(
                    gte(orderReturnRequests.createdAt, start),
                    lt(orderReturnRequests.createdAt, end)
                )
            )
            .orderBy(desc(orderReturnRequests.createdAt)),
        db
            .select({
                id: refunds.id,
                orderId: refunds.orderId,
                paymentId: refunds.paymentId,
                status: refunds.status,
                amount: refunds.amount,
                reasonCode: refunds.reasonCode,
                reasonNotes: refunds.reasonNotes,
                processedBy: refunds.processedBy,
                failedReason: refunds.failedReason,
                createdAt: refunds.createdAt,
                updatedAt: refunds.updatedAt,
            })
            .from(refunds)
            .where(
                and(gte(refunds.createdAt, start), lt(refunds.createdAt, end))
            )
            .orderBy(desc(refunds.createdAt)),
        db
            .select()
            .from(orderOpsStates)
            .where(
                and(
                    gte(orderOpsStates.createdAt, start),
                    lt(orderOpsStates.createdAt, end)
                )
            )
            .orderBy(desc(orderOpsStates.createdAt)),
        db
            .select()
            .from(fraudReviews)
            .where(
                and(
                    gte(fraudReviews.createdAt, start),
                    lt(fraudReviews.createdAt, end)
                )
            )
            .orderBy(desc(fraudReviews.createdAt)),
        db
            .select()
            .from(rtoDispositions)
            .where(
                and(
                    gte(rtoDispositions.createdAt, start),
                    lt(rtoDispositions.createdAt, end)
                )
            )
            .orderBy(desc(rtoDispositions.createdAt)),
        db
            .select()
            .from(carrierClaims)
            .where(
                and(
                    gte(carrierClaims.createdAt, start),
                    lt(carrierClaims.createdAt, end)
                )
            )
            .orderBy(desc(carrierClaims.createdAt)),
        db
            .select()
            .from(codReconciliationRuns)
            .where(
                and(
                    gte(codReconciliationRuns.createdAt, start),
                    lt(codReconciliationRuns.createdAt, end)
                )
            )
            .orderBy(desc(codReconciliationRuns.createdAt)),
        db
            .select()
            .from(codReconciliationItems)
            .where(
                and(
                    gte(codReconciliationItems.createdAt, start),
                    lt(codReconciliationItems.createdAt, end)
                )
            )
            .orderBy(desc(codReconciliationItems.createdAt)),
        db
            .select()
            .from(orderOpsCommunications)
            .where(
                and(
                    gte(orderOpsCommunications.createdAt, start),
                    lt(orderOpsCommunications.createdAt, end)
                )
            )
            .orderBy(desc(orderOpsCommunications.createdAt)),
    ]);

    const sections = [
        {
            name: "Summary",
            rows: [
                {
                    reportMonth,
                    generatedAt: new Date().toISOString(),
                    slaRunCount: slaRuns.length,
                    dailySnapshotCount: snapshots.length,
                    weeklyPackCount: weeklyPacks.length,
                    accessReviewCount: accessReviews.length,
                    accessReviewItemCount: accessItems.length,
                    alertCount: alerts.length,
                    orderOpsOrderCount: orderOpsOrders.length,
                    orderOpsShipmentCount: orderOpsShipments.length,
                    orderOpsReturnCount: orderOpsReturns.length,
                    orderOpsRefundCount: orderOpsRefunds.length,
                    orderOpsStateCount: orderOpsStateRows.length,
                    fraudReviewCount: fraudReviewRows.length,
                    rtoDispositionCount: rtoDispositionRows.length,
                    carrierClaimCount: carrierClaimRows.length,
                    codReconciliationRunCount: codRunRows.length,
                    codReconciliationItemCount: codItemRows.length,
                },
            ],
        },
        { name: "SLA Runs", rows: slaRuns },
        { name: "Daily Snapshots", rows: snapshots },
        { name: "Weekly Packs", rows: weeklyPacks },
        { name: "Access Reviews", rows: accessReviews },
        { name: "Access Review Items", rows: accessItems },
        { name: "Alerts", rows: alerts },
        { name: "Order Ops Orders", rows: orderOpsOrders },
        { name: "Order Ops Shipments", rows: orderOpsShipments },
        { name: "Order Ops Returns", rows: orderOpsReturns },
        { name: "Order Ops Refunds", rows: orderOpsRefunds },
        { name: "Order Ops States", rows: orderOpsStateRows },
        { name: "Fraud Reviews", rows: fraudReviewRows },
        { name: "RTO Dispositions", rows: rtoDispositionRows },
        { name: "Carrier Claims", rows: carrierClaimRows },
        { name: "COD Recon Runs", rows: codRunRows },
        { name: "COD Recon Items", rows: codItemRows },
        { name: "Order Ops Comms", rows: orderOpsCommunicationRows },
    ];

    if (format === "csv") {
        return new NextResponse(toCsv(sections), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${reportMonth}-founder-monitoring-report.csv"`,
            },
        });
    }

    const workbook = XLSX.utils.book_new();
    for (const section of sections) {
        const rows = normalizeRows(section.rows);
        const worksheet = XLSX.utils.json_to_sheet(
            rows.length ? rows : [{ note: "No records found" }]
        );
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            section.name.slice(0, 31)
        );
    }

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(buffer, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${reportMonth}-founder-monitoring-report.xlsx"`,
        },
    });
}
