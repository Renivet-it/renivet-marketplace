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
    brands,
    products,
    categories,
    orderItems,
} from "@/lib/db/schema";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { and, desc, gte, lt, ne } from "drizzle-orm";
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

function paiseToRupees(paise: unknown): number {
    const p = Number(paise);
    return isNaN(p) ? 0 : p / 100;
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

    // Fetch raw database queries for supplementary audit sheets and general logs
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

    // Fetch the detailed aggregated models for business & brand health
    const [weeklyBusiness, brandHealth] = await Promise.all([
        monitoringSlaQueries.getWeeklyBusiness(),
        monitoringSlaQueries.getBrandHealth(),
    ]);

    // Calculate dates for current week window
    const weekEnd = now;
    const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Get count of new brands onboarded in the week
    const newBrandsThisWeek = await db.$count(
        brands,
        and(gte(brands.createdAt, weekStart), lt(brands.createdAt, weekEnd))
    );

    // Fetch detailed weekly orders with items, products, categories, and shipments for precise financial calculations
    const weeklyOrders = await db.query.orders.findMany({
        where: and(
            gte(orders.createdAt, weekStart),
            lt(orders.createdAt, weekEnd),
            ne(orders.status, "cancelled"),
            ne(orders.paymentStatus, "failed")
        ),
        with: {
            items: {
                with: {
                    product: {
                        with: {
                            category: true,
                        },
                    },
                },
            },
            shipments: true,
        },
    });

    // Detailed financial calculations matching dashboard system
    let totalGrossSale = 0;
    let totalCommission = 0;
    let totalGatewayFee = 0;
    let totalShippingFee = 0;

    for (const order of weeklyOrders) {
        const grossSale = paiseToRupees(order.totalAmount);
        totalGrossSale += grossSale;

        // PG fee: 2% of total amount, or 20 INR minimum
        const gatewayFee =
            (order.totalAmount * 0.02 > 2000
                ? order.totalAmount * 0.02
                : 2000) / 100;
        totalGatewayFee += gatewayFee;

        // Shipping fee (from freight charges in shipment details)
        let shippingFee = 0;
        if (order.shipments && order.shipments.length > 0) {
            const shipment = order.shipments[0];
            const charges =
                (shipment.awbDetailsShipRocketJson as any)?.response?.data
                    ?.freight_charges || 0;
            shippingFee = Number(charges);
        }
        totalShippingFee += shippingFee;

        // Commission
        let commission = 0;
        if (order.items && order.items.length > 0) {
            const item = order.items[0];
            const commRate = item.product?.category?.commissionRate || 0;
            commission = (commRate / 100) * grossSale;
        }
        totalCommission += commission;
    }

    const totalGstOnCommission = totalCommission * 0.18;
    const totalTcs = totalGrossSale * 0.01;
    const totalDeductions =
        totalCommission +
        totalGstOnCommission +
        totalTcs +
        totalGatewayFee +
        totalShippingFee;
    const totalFinalPayable = totalGrossSale - totalDeductions;

    // Fetch actual weekly refunds disbursed
    const weeklyRefunds = await db.query.refunds.findMany({
        where: and(
            gte(refunds.createdAt, weekStart),
            lt(refunds.createdAt, weekEnd)
        ),
    });
    const refundsDisbursedVal = weeklyRefunds
        .filter(
            (r) =>
                r.status === "processed" ||
                r.status === "completed" ||
                r.status === "success"
        )
        .reduce((sum, r) => sum + paiseToRupees(r.amount), 0);

    // Net platform cash impact
    const cashPositionImpact =
        totalGrossSale -
        totalFinalPayable -
        refundsDisbursedVal -
        totalGatewayFee -
        totalShippingFee;

    // PAGE 1: Executive Snapshot
    const page1Aoa: any[][] = [
        ["Renivet Marketplace - Weekly Executive Snapshot"],
        ["============================================================="],
        ["Report Month:", reportMonth],
        ["Generated At:", now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
        ["Week Window:", `${weeklyBusiness.weekStart} to ${weeklyBusiness.weekEnd}`],
        [],
        ["1. KEY PERFORMANCE INDICATORS (WTD)"],
        ["Metric", "Current Week", "Prior Period (4-W Avg / Prev Wk)", "Difference %"],
        [
            "Gross Merchandise Value (GMV)",
            `INR ${totalGrossSale.toFixed(2)}`,
            `INR ${(weeklyBusiness.priorFourWeekGmvAvg).toFixed(2)}`,
            `${weeklyBusiness.gmvVsPriorFourWeekAvg >= 0 ? "+" : ""}${weeklyBusiness.gmvVsPriorFourWeekAvg.toFixed(2)}% vs prior 4-w avg`
        ],
        [
            "Order Volume",
            weeklyBusiness.orderCount,
            weeklyBusiness.previousOrderCount,
            `${weeklyBusiness.orderVolumeWoW >= 0 ? "+" : ""}${weeklyBusiness.orderVolumeWoW.toFixed(2)}% WoW`
        ],
        [
            "Average Order Value (AOV)",
            `INR ${weeklyBusiness.aov.toFixed(2)}`,
            `INR ${weeklyBusiness.previousAov.toFixed(2)}`,
            `${weeklyBusiness.aovWoW >= 0 ? "+" : ""}${weeklyBusiness.aovWoW.toFixed(2)}% WoW`
        ],
        [],
        ["2. CUSTOMER & BRAND ACQUISITION"],
        ["Acquisition Segment", "Count", "Details & Context"],
        [
            "New Customers Acquired",
            weeklyBusiness.customerCount - weeklyBusiness.repeatCustomers,
            `${(weeklyBusiness.customerCount ? ((weeklyBusiness.customerCount - weeklyBusiness.repeatCustomers) / weeklyBusiness.customerCount * 100) : 0).toFixed(2)}% of total customer pool`
        ],
        [
            "Repeat Customers Active",
            weeklyBusiness.repeatCustomers,
            `${(weeklyBusiness.customerCount ? (weeklyBusiness.repeatCustomers / weeklyBusiness.customerCount * 100) : 0).toFixed(2)}% repeat customer rate`
        ],
        [
            "New Brands Onboarded",
            newBrandsThisWeek,
            "Newly onboarded and registered in system this week"
        ],
        [
            "Active / Live Brands",
            weeklyBusiness.activeBrands,
            "Total brands currently active and selling on marketplace"
        ],
        [],
        ["3. SYSTEM EXECUTIVE SUMMARY & NOTES"],
        ["Note Source", "Summary Text"],
    ];

    let execSnapshotNote = "No manual system executive notes recorded for this week.";
    if (weeklyPacks && weeklyPacks.length > 0) {
        execSnapshotNote = weeklyPacks[0].executiveSnapshot || execSnapshotNote;
    }
    page1Aoa.push(["Weekly Pack Summary", execSnapshotNote]);

    // PAGE 2: Operational Metrics
    const page2Aoa: any[][] = [
        ["Renivet Marketplace - Operational & SLA Metrics"],
        ["============================================================="],
        ["Week Window:", `${weeklyBusiness.weekStart} to ${weeklyBusiness.weekEnd}`],
        [],
        ["1. SERVICE LEVEL AGREEMENT (SLA) HIT RATE BY FUNCTION"],
        ["Function Area", "SLA Status", "Context Metrics"],
        [
            "Customer Support Ticketing SLA",
            weeklyBusiness.supportMetrics.avgFirstResponseMinutes > 60 ? "AMBER" : "GREEN",
            `Avg response: ${weeklyBusiness.supportMetrics.avgFirstResponseMinutes} mins (Target: < 60 mins)`
        ],
        [
            "Order Fulfillment Ops SLA",
            weeklyBusiness.slaBreachCount > 0 ? "RED" : "GREEN",
            `${weeklyBusiness.slaBreachCount} critical SLA breaches or unacknowledged orders`
        ],
        [
            "Brand Onboarding Ops SLA",
            brandHealth.nonResponsiveBrandsCount > 0 ? "AMBER" : "GREEN",
            `${brandHealth.nonResponsiveBrandsCount} brand accounts non-responsive over 14 days`
        ],
        [],
        ["2. SUPPORT TICKETING PERFORMANCE"],
        ["Metric", "Weekly Count / Average", "SLA Threshold / Goal"],
        ["Tickets Opened", weeklyBusiness.supportMetrics.ticketsOpened, "Standard weekly inbound"],
        ["Tickets Resolved", weeklyBusiness.supportMetrics.ticketsResolved, "Close all resolvable tickets within week"],
        ["Aged Tickets Open (>24h)", weeklyBusiness.supportOpenTickets, "Goal: 0 aged tickets in queue"],
        ["Avg First Response Time", `${weeklyBusiness.supportMetrics.avgFirstResponseMinutes} mins`, "< 30 minutes response time"],
        ["Avg Ticket Resolution Time", `${weeklyBusiness.supportMetrics.avgResolutionMinutes} mins`, "< 180 minutes resolution time"],
        ["CSAT Average Rating", weeklyBusiness.supportMetrics.csatAverage ? `${weeklyBusiness.supportMetrics.csatAverage} / 5` : "N/A", "Target: >= 4.5 / 5.0"],
        [],
        ["3. REFUNDS & RETURN REQUESTS"],
        ["Refund/Return Indicator", "Count", "Total Value (INR)"],
        ["Refunds Pending/Processed WTD", weeklyBusiness.refundCount, `INR ${(weeklyBusiness.refundAmount / 100).toFixed(2)}`],
        [],
        ["Refund Breakdowns by Reason Code"],
        ["Refund Reason Code", "Count", "Total Amount (INR)"],
    ];

    for (const reason of weeklyBusiness.refundReasons) {
        page2Aoa.push([reason.reasonCode, reason.count, `INR ${(reason.amount / 100).toFixed(2)}`]);
    }
    if (weeklyBusiness.refundReasons.length === 0) {
        page2Aoa.push(["No refunds recorded", 0, "INR 0.00"]);
    }

    page2Aoa.push([]);
    page2Aoa.push(["4. LOGISTICS AND RTO PERFORMANCE"]);
    page2Aoa.push(["Metrics Type", "Shipments Count", "Percentage Rate"]);
    page2Aoa.push(["Delivered Shipments", weeklyBusiness.deliveredShipments, "-"]);
    page2Aoa.push(["RTO Shipments (Returned / In-Transit)", weeklyBusiness.rtoShipments, `${(weeklyBusiness.rtoRate * 100).toFixed(2)}% RTO rate`]);

    // PAGE 3: Financial Snapshot
    const page3Aoa: any[][] = [
        ["Renivet Marketplace - Weekly Financial Snapshot"],
        ["============================================================="],
        ["Week Window:", `${weeklyBusiness.weekStart} to ${weeklyBusiness.weekEnd}`],
        [],
        ["1. WEEKLY REVENUE AND DEDUCTIONS ANALYSIS"],
        ["Financial Component", "Amount (INR)", "Description & Calculation Basis"],
        ["Gross Revenue (GMV)", totalGrossSale.toFixed(2), "Total value of items ordered during week start to end"],
        ["Accrued Platform Commission", totalCommission.toFixed(2), "Calculated category-by-category using category commission rates"],
        ["GST on Platform Commission (18%)", totalGstOnCommission.toFixed(2), "18% GST charged on accrued commission amount"],
        ["TCS Accrued (1%)", totalTcs.toFixed(2), "1% Tax Collected at Source deducted on Net MRP"],
        ["Payment Gateway Fees (2% min)", totalGatewayFee.toFixed(2), "2% gateway commission fee (minimum 20 INR per transaction)"],
        ["Logistics & Shipping Fees", totalShippingFee.toFixed(2), "Total freight charges accrued via Shiprocket logistics integrations"],
        ["Total Accrued Platform Deductions", totalDeductions.toFixed(2), "Sum of Commission, GST, TCS, PG Fees, and Logistics fees"],
        ["Net Brand Payouts (Payable)", totalFinalPayable.toFixed(2), "Net amount to be settled and disbursed back to brand partners"],
        [],
        ["2. CASH FLOW AND LIQUIDITY RECONCILIATION"],
        ["Cash Metric", "Amount (INR)", "Details & Comments"],
        ["Refunds Disbursed WTD", refundsDisbursedVal.toFixed(2), "Actual refund amounts settled and returned to customer accounts"],
        ["Net Platform Cash Impact", cashPositionImpact.toFixed(2), "Rough Cash Change: Gross GMV - Brand Payouts - Refunds - Gateway/Shipping Fees"],
    ];

    // PAGE 4: Brand Health
    const page4Aoa: any[][] = [
        ["Renivet Marketplace - Brand Health Summary"],
        ["============================================================="],
        ["Week Window:", `${weeklyBusiness.weekStart} to ${weeklyBusiness.weekEnd}`],
        [],
        ["1. TOP 5 BRANDS BY GMV CONTRIBUTE"],
        ["Brand Name", "Accrued GMV (INR)", "Status"],
    ];

    for (const brand of weeklyBusiness.topBrands) {
        page4Aoa.push([brand.name, `INR ${brand.gmv.toFixed(2)}`, "Active"]);
    }
    if (weeklyBusiness.topBrands.length === 0) {
        page4Aoa.push(["No brand sales this week", "INR 0.00", "-"]);
    }

    page4Aoa.push([]);
    page4Aoa.push(["2. BOTTOM 5 BRANDS BY GMV CONTRIBUTE"]);
    page4Aoa.push(["Brand Name", "Accrued GMV (INR)", "Status"]);

    for (const brand of weeklyBusiness.bottomBrands) {
        page4Aoa.push([brand.name, `INR ${brand.gmv.toFixed(2)}`, "Active"]);
    }
    if (weeklyBusiness.bottomBrands.length === 0) {
        page4Aoa.push(["No brand sales this week", "INR 0.00", "-"]);
    }

    page4Aoa.push([]);
    page4Aoa.push(["3. MARKETPLACE BRAND STANDING COUNTS"]);
    page4Aoa.push(["Stand Category", "Count", "Description / Details"], [
        "Active Live Brands",
        brandHealth.activeBrands,
        "Brands with catalog live and selling on Renivet sustainable marketplace",
    ], [
        "Paused / Inactive Brands",
        brandHealth.pausedBrands,
        "Brands currently hidden or configuration paused",
    ], [
        "Non-Responsive Brands (14d)",
        brandHealth.nonResponsiveBrandsCount,
        "Active brands with 0 orders and 0 ticket activities over 14 days",
    ]);

    page4Aoa.push([]);
    page4Aoa.push(["4. BRAND ONBOARDING FUNNEL STAGES"]);
    page4Aoa.push(["Pipeline Stage", "Brand Count", "Operational Definition"]);

    for (const stage of brandHealth.pipelineStages) {
        page4Aoa.push([
            stage.stage.toUpperCase(),
            stage.count,
            stage.stage === "outreach"
                ? "Brand requests received and pending admin approval"
                : stage.stage === "discussion"
                  ? "Approved brand requests under negotiation / setup"
                  : stage.stage === "contract"
                    ? "Contracts generated but awaiting brand signature"
                    : stage.stage === "onboarding"
                      ? "Contracts signed; verifying bank/tax/sustainability credentials"
                      : "Live and active on Renivet sustainable marketplace",
        ]);
    }

    // PAGE 5: Action Items
    const page5Aoa: any[][] = [
        ["Renivet Marketplace - Weekly Action Items & SLA Breaches"],
        ["============================================================="],
        [],
        ["1. WEEKLY SYSTEM ACTIONS PLAN"],
        ["No.", "Suggested Decision / SLA Task"],
    ];

    let actionItemIndex = 1;
    let sysActionItems = [
        "Resolve outstanding critical monitoring alerts before strategic review.",
        "Ensure all brand certificate renewals are confirmed.",
    ];
    if (
        weeklyPacks &&
        weeklyPacks.length > 0 &&
        Array.isArray(weeklyPacks[0].actionItems)
    ) {
        sysActionItems = weeklyPacks[0].actionItems as string[];
    }
    for (const item of sysActionItems) {
        page5Aoa.push([actionItemIndex++, item]);
    }

    page5Aoa.push([]);
    page5Aoa.push(["2. OPEN CRITICAL ALERTS & SLA BREACHES"]);
    page5Aoa.push(["Alert ID", "Owner Role", "Alert Message", "Severity", "Triggered At"]);

    const criticalOpenAlerts = alerts.filter(
        (x) => x.severity === "critical" && x.status !== "resolved"
    );
    for (const alert of criticalOpenAlerts) {
        page5Aoa.push([
            alert.id,
            alert.ownerRole || "unassigned",
            alert.message,
            alert.severity,
            alert.createdAt
                ? new Date(alert.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                  })
                : "",
        ]);
    }
    if (criticalOpenAlerts.length === 0) {
        page5Aoa.push(["No open critical alerts or SLA breaches.", "", "", "", ""]);
    }

    page5Aoa.push([]);
    page5Aoa.push(["3. BRAND CERTIFICATE EXPIRATIONS COMING UP (90 DAYS)"]);
    page5Aoa.push(["Brand Name", "Expiry Date", "Days Window Remaining", "Action Severity"]);

    const certsList = brandHealth.certExpiries.all;
    for (const cert of certsList) {
        page5Aoa.push([
            cert.name,
            cert.expiresAt,
            cert.window === "30"
                ? "Expiring in < 30 days"
                : cert.window === "60"
                  ? "Expiring in < 60 days"
                  : "Expiring in < 90 days",
            cert.window === "30" ? "CRITICAL" : "WARNING",
        ]);
    }
    if (certsList.length === 0) {
        page5Aoa.push(["No upcoming certificate expirations.", "", "", ""]);
    }

    page5Aoa.push([]);
    page5Aoa.push(["4. BRAND CONTRACT EXPIRATIONS COMING UP (90 DAYS)"]);
    page5Aoa.push(["Brand Name", "Expiry Date", "Days Window Remaining", "Action Severity"]);

    const contractsList = brandHealth.contractExpiries.all;
    for (const contract of contractsList) {
        page5Aoa.push([
            contract.name,
            contract.expiresAt,
            contract.window === "30"
                ? "Expiring in < 30 days"
                : contract.window === "60"
                  ? "Expiring in < 60 days"
                  : "Expiring in < 90 days",
            contract.window === "30" ? "CRITICAL" : "WARNING",
        ]);
    }
    if (contractsList.length === 0) {
        page5Aoa.push(["No upcoming contract expirations.", "", "", ""]);
    }

    // CSV format fallback
    if (format === "csv") {
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
        return new NextResponse(toCsv(sections), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${reportMonth}-founder-monitoring-report.csv"`,
            },
        });
    }

    // Build the Multi-Page Excel workbook
    const workbook = XLSX.utils.book_new();

    // WS 1: Executive Snapshot
    const ws1 = XLSX.utils.aoa_to_sheet(page1Aoa);
    ws1["!cols"] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 35 },
        { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, "Page 1 - Executive Snapshot");

    // WS 2: Operational Metrics
    const ws2 = XLSX.utils.aoa_to_sheet(page2Aoa);
    ws2["!cols"] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws2, "Page 2 - Operational Metrics");

    // WS 3: Financial Snapshot
    const ws3 = XLSX.utils.aoa_to_sheet(page3Aoa);
    ws3["!cols"] = [
        { wch: 35 },
        { wch: 20 },
        { wch: 55 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws3, "Page 3 - Financial Snapshot");

    // WS 4: Brand Health
    const ws4 = XLSX.utils.aoa_to_sheet(page4Aoa);
    ws4["!cols"] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws4, "Page 4 - Brand Health");

    // WS 5: Action Items
    const ws5 = XLSX.utils.aoa_to_sheet(page5Aoa);
    ws5["!cols"] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 45 },
        { wch: 25 },
        { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(workbook, ws5, "Page 5 - Action Items");

    // Append standard audit sheets as supplementary tabs at the end
    const dbSections = [
        { name: "SLA Runs Log", rows: slaRuns },
        { name: "Daily Snapshots Log", rows: snapshots },
        { name: "Weekly Packs Log", rows: weeklyPacks },
        { name: "Access Reviews Log", rows: accessReviews },
        { name: "Access Review Items Log", rows: accessItems },
        { name: "System Alerts Log", rows: alerts },
        { name: "Orders Raw Log", rows: orderOpsOrders },
        { name: "Shipments Raw Log", rows: orderOpsShipments },
        { name: "Returns Raw Log", rows: orderOpsReturns },
        { name: "Refunds Raw Log", rows: orderOpsRefunds },
        { name: "Order Ops States Log", rows: orderOpsStateRows },
        { name: "Fraud Reviews Log", rows: fraudReviewRows },
        { name: "RTO Dispositions Log", rows: rtoDispositionRows },
        { name: "Carrier Claims Log", rows: carrierClaimRows },
        { name: "COD Recon Runs Log", rows: codRunRows },
        { name: "COD Recon Items Log", rows: codItemRows },
        { name: "Order Ops Comms Log", rows: orderOpsCommunicationRows },
    ];

    for (const section of dbSections) {
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
            "Content-Disposition": `attachment; filename="${reportMonth}-weekly-reporting-pack.xlsx"`,
        },
    });
}

