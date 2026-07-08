import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type PlSourceLine = {
    key: string;
    label: string;
    amountPaise: number;
    type: "auto" | "manual" | "calculated";
    sourceLabel: string;
    lastSyncedAt: string;
    editable: boolean;
    description?: string;
};

type MonthlyPlSummary = {
    monthKey: string;
    lines: PlSourceLine[];
    metrics: {
        totalIncomePaise: number;
        totalOpexPaise: number;
        totalRefundImpactPaise: number;
        netProfitLossPaise: number;
        cashRunwayMonths: number | null;
        pendingExposurePaise: number;
        bankBalanceStartPaise: number;
        bankBalanceEndPaise: number;
        burnRatePaise: number;
    };
    sourceMeta: Record<string, unknown>;
};

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

function sumAmounts(
    entries: Array<{
        amountPaise: number;
    }>
) {
    return entries.reduce((sum, item) => sum + item.amountPaise, 0);
}

function groupManualEntries(entries: Awaited<ReturnType<typeof financeComplianceQueries.listPlEntries>>) {
    return entries.reduce<Record<string, typeof entries>>((acc, entry) => {
        const key = entry.lineItem ?? entry.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
    }, {});
}

export async function buildMonthlyPl(monthKey: string): Promise<MonthlyPlSummary> {
    const { start, end } = getMonthRange(monthKey);
    const [
        analyticsRows,
        corporatePayments,
        manualEntries,
        codRows,
        carrierClaims,
        orders,
    ] = await Promise.all([
        financeComplianceQueries.listAnalyticsCommerceForMonth({ monthKey }),
        financeComplianceQueries.listCorporatePaymentsForMonth({ start, end }),
        financeComplianceQueries.listPlEntries(monthKey),
        financeComplianceQueries.listCodReconciliation(),
        financeComplianceQueries.listCarrierClaimsForFinanceWindow({ start, end }),
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
    ]);

    const refundRows = await financeComplianceQueries.listRecentRefundsForOrderIds(
        orders.map((order) => order.id)
    );

    const groupedManual = groupManualEntries(manualEntries);
    const lastSyncedAt = new Date().toISOString();

    const commissionEarnedPaise = analyticsRows.reduce(
        (sum, row) => sum + Math.round(row.grossSalesPaise * 0.12),
        0
    );
    const shippingMarkupPaise = analyticsRows.reduce(
        (sum, row) => sum + row.shippingPaise,
        0
    );
    const corporateCommissionPaise = corporatePayments
        .filter(
            (payment) =>
                payment.paymentType === "balance" &&
                ["paid", "payment_paid"].includes(payment.paymentStatus)
        )
        .reduce((sum, payment) => sum + payment.amountPaise, 0);

    const razorpayGatewayFeesPaise = Math.round(
        analyticsRows.reduce((sum, row) => sum + row.totalSalesPaise, 0) * 0.02
    );
    const delhiveryShippingCostsPaise = orders
        .filter((order) =>
            order.shipments.some(
                (shipment) =>
                    shipment.awbNumber && !shipment.shiprocketShipmentId
            )
        )
        .reduce((sum, order) => sum + order.deliveryAmount, 0);
    const shiprocketShippingCostsPaise = orders
        .filter((order) =>
            order.shipments.some((shipment) => shipment.shiprocketShipmentId)
        )
        .reduce((sum, order) => sum + order.deliveryAmount, 0);
    const rtoCostsPaise = carrierClaims
        .filter((claim) => claim.claimType === "other")
        .reduce((sum, claim) => sum + claim.claimAmount, 0);
    const brandFaultRefundsPaise = refundRows
        .filter((refund) => refund.costAllocation === "brand_fault")
        .reduce((sum, refund) => sum + refund.amount, 0);
    const renivetFaultRefundsPaise = refundRows
        .filter((refund) => refund.costAllocation === "renivet_fault")
        .reduce((sum, refund) => sum + refund.amount, 0);
    const carrierFaultPendingPaise = codRows
        .filter((row) => row.status === "critical")
        .reduce((sum, row) => sum + Math.abs(row.discrepancyAmountPaise ?? 0), 0);
    const pendingCodRemittancesPaise = codRows
        .filter((row) => ["pending", "overdue"].includes(row.status))
        .reduce((sum, row) => sum + Math.abs(row.expectedRemittancePaise ?? 0), 0);
    const pendingCarrierClaimsPaise = carrierClaims
        .filter((claim) => !["settled", "rejected"].includes(claim.status))
        .reduce((sum, claim) => sum + (claim.approvedAmount ?? claim.claimAmount), 0);

    const manualLine = (key: string, fallbackLabel: string, description?: string) => {
        const entries = groupedManual[key] ?? [];
        return {
            key,
            label: fallbackLabel,
            amountPaise: sumAmounts(entries),
            type: "manual" as const,
            sourceLabel: "Manual entry",
            lastSyncedAt,
            editable: true,
            description,
        };
    };

    const toolEntries = groupedManual["tools_saas"] ?? [];
    const toolLines: PlSourceLine[] = toolEntries.map((entry) => ({
        key: `tools_saas:${entry.id}`,
        label: entry.subLabel || entry.description,
        amountPaise: entry.amountPaise,
        type: "manual",
        sourceLabel: "Manual entry",
        lastSyncedAt,
        editable: true,
        description: entry.notes ?? undefined,
    }));

    const lines: PlSourceLine[] = [
        {
            key: "commission_earned",
            label: "Commission earned",
            amountPaise: commissionEarnedPaise,
            type: "auto",
            sourceLabel: "Analytics commerce",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "corporate_order_commission",
            label: "Corporate order commission",
            amountPaise: corporateCommissionPaise,
            type: "auto",
            sourceLabel: "Corporate payments",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "shipping_markup",
            label: "Shipping markup",
            amountPaise: shippingMarkupPaise,
            type: "auto",
            sourceLabel: "Analytics commerce",
            lastSyncedAt,
            editable: false,
        },
        manualLine("other_income", "Other income"),
        {
            key: "razorpay_gateway_fees",
            label: "Razorpay gateway fees",
            amountPaise: razorpayGatewayFeesPaise,
            type: "auto",
            sourceLabel: "Razorpay derived",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "shipping_costs_delhivery",
            label: "Shipping costs (Delhivery)",
            amountPaise: delhiveryShippingCostsPaise,
            type: "auto",
            sourceLabel: "Orders / Delhivery shipments",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "shipping_costs_shiprocket",
            label: "Shipping costs (Shiprocket)",
            amountPaise: shiprocketShippingCostsPaise,
            type: "auto",
            sourceLabel: "Orders / Shiprocket shipments",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "rto_costs",
            label: "RTO costs",
            amountPaise: rtoCostsPaise,
            type: "auto",
            sourceLabel: "Carrier claims",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "brand_fault_refunds",
            label: "Brand-fault refunds",
            amountPaise: brandFaultRefundsPaise,
            type: "auto",
            sourceLabel: "Refunds",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "renivet_fault_refunds",
            label: "Renivet-fault refunds",
            amountPaise: renivetFaultRefundsPaise,
            type: "auto",
            sourceLabel: "Refunds",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "carrier_fault_refunds_pending",
            label: "Carrier-fault refunds (pending)",
            amountPaise: carrierFaultPendingPaise,
            type: "auto",
            sourceLabel: "COD reconciliation",
            lastSyncedAt,
            editable: false,
        },
        manualLine("salaries", "Salaries / stipends"),
        manualLine("paid_marketing", "Paid marketing spend"),
        manualLine("social_media", "Social media spend"),
        ...toolLines,
        manualLine("infrastructure_hosting", "Infrastructure / hosting"),
        manualLine("registerkaro", "RegisterKaro (compliance)"),
        manualLine("miscellaneous", "Miscellaneous"),
        manualLine("bank_balance_start", "Bank balance (start)"),
        manualLine("bank_balance_end", "Bank balance (end)"),
        {
            key: "pending_cod_remittances",
            label: "Pending COD remittances",
            amountPaise: pendingCodRemittancesPaise,
            type: "auto",
            sourceLabel: "COD reconciliation",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "pending_carrier_claims",
            label: "Pending carrier claims",
            amountPaise: pendingCarrierClaimsPaise,
            type: "auto",
            sourceLabel: "Carrier claims",
            lastSyncedAt,
            editable: false,
        },
    ];

    const incomeKeys = new Set([
        "commission_earned",
        "corporate_order_commission",
        "shipping_markup",
        "other_income",
    ]);
    const bankStart = groupedManual["bank_balance_start"]
        ? sumAmounts(groupedManual["bank_balance_start"])
        : 0;
    const bankEnd = groupedManual["bank_balance_end"]
        ? sumAmounts(groupedManual["bank_balance_end"])
        : 0;

    const totalIncomePaise = lines
        .filter((line) => incomeKeys.has(line.key))
        .reduce((sum, line) => sum + line.amountPaise, 0);
    const totalRefundImpactPaise =
        brandFaultRefundsPaise + renivetFaultRefundsPaise + carrierFaultPendingPaise;
    const totalOpexPaise = lines
        .filter(
            (line) =>
                !incomeKeys.has(line.key) &&
                !["bank_balance_start", "bank_balance_end", "pending_cod_remittances", "pending_carrier_claims"].includes(
                    line.key
                )
        )
        .reduce((sum, line) => sum + line.amountPaise, 0);
    const pendingExposurePaise = pendingCodRemittancesPaise + pendingCarrierClaimsPaise;
    const netProfitLossPaise = totalIncomePaise - totalOpexPaise - totalRefundImpactPaise;
    const burnRatePaise = Math.max(totalOpexPaise - totalIncomePaise, 0);
    const cashRunwayMonths =
        bankEnd > 0 && burnRatePaise > 0
            ? Number((bankEnd / burnRatePaise).toFixed(2))
            : null;

    lines.push(
        {
            key: "gross_margin",
            label: "Gross Margin",
            amountPaise: totalIncomePaise - totalRefundImpactPaise,
            type: "calculated",
            sourceLabel: "Calculated",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "total_opex",
            label: "Total OpEx",
            amountPaise: totalOpexPaise,
            type: "calculated",
            sourceLabel: "Calculated",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "net_pl",
            label: "Net P&L",
            amountPaise: netProfitLossPaise,
            type: "calculated",
            sourceLabel: "Calculated",
            lastSyncedAt,
            editable: false,
        },
        {
            key: "cash_runway",
            label: "Cash runway (months)",
            amountPaise: cashRunwayMonths ? Math.round(cashRunwayMonths * 100) : 0,
            type: "calculated",
            sourceLabel: "Calculated",
            lastSyncedAt,
            editable: false,
            description:
                cashRunwayMonths === null
                    ? "Needs ending bank balance and positive monthly burn."
                    : `${cashRunwayMonths} months`,
        }
    );

    return {
        monthKey,
        lines,
        metrics: {
            totalIncomePaise,
            totalOpexPaise,
            totalRefundImpactPaise,
            netProfitLossPaise,
            cashRunwayMonths,
            pendingExposurePaise,
            bankBalanceStartPaise: bankStart,
            bankBalanceEndPaise: bankEnd,
            burnRatePaise,
        },
        sourceMeta: {
            syncedAt: lastSyncedAt,
            analyticsRows: analyticsRows.length,
            corporatePayments: corporatePayments.length,
            manualEntries: manualEntries.length,
            codRows: codRows.length,
            carrierClaims: carrierClaims.length,
            refundCount: refundRows.length,
        },
    };
}

export async function refreshMonthlyPl(monthKey: string) {
    const summary = await buildMonthlyPl(monthKey);
    const existing = await financeComplianceQueries.getPlSnapshot(monthKey);
    const snapshotType = existing?.snapshotType === "locked" ? "locked" : "draft";

    const row = await financeComplianceQueries.upsertPlSnapshot({
        monthKey,
        month: monthKey,
        snapshotType,
        summary,
        lockedBy: existing?.lockedBy ?? null,
        lockedAt: existing?.lockedAt ?? null,
        unlockedBy: existing?.unlockedBy ?? null,
        unlockedAt: existing?.unlockedAt ?? null,
        unlockReason: existing?.unlockReason ?? null,
        fileUrl: existing?.fileUrl ?? null,
    });

    return {
        snapshot: row,
        summary,
    };
}

export async function lockMonthlyPl(monthKey: string, actorId: string) {
    const summary = await buildMonthlyPl(monthKey);
    await financeComplianceQueries.lockPlEntries(monthKey);
    const row = await financeComplianceQueries.upsertPlSnapshot({
        monthKey,
        month: monthKey,
        snapshotType: "locked",
        summary,
        lockedBy: actorId,
        lockedAt: new Date(),
        unlockedBy: null,
        unlockedAt: null,
        unlockReason: null,
    });

    await auditAndAlert({
        actorId,
        actionType: "monthly_pl_locked",
        entityType: "pl_snapshot",
        entityId: row.id,
        afterValue: row as Record<string, unknown>,
        reason: "monthly_pl_locked",
        title: "Monthly P&L locked",
        message: `Month ${monthKey} has been locked for finance close.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "monthly_pl_locked",
        dedupeKey: `pl:lock:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            summary,
        },
    });

    return row;
}

export async function unlockMonthlyPl(monthKey: string, actorId: string, reason: string) {
    const existing = await financeComplianceQueries.getPlSnapshot(monthKey);
    await financeComplianceQueries.unlockPlEntries(monthKey);
    const row = await financeComplianceQueries.upsertPlSnapshot({
        monthKey,
        month: monthKey,
        snapshotType: "draft",
        summary: (existing?.summary as Record<string, unknown>) ?? {},
        lockedBy: existing?.lockedBy ?? null,
        lockedAt: existing?.lockedAt ?? null,
        unlockedBy: actorId,
        unlockedAt: new Date(),
        unlockReason: reason,
        fileUrl: existing?.fileUrl ?? null,
    });

    await auditAndAlert({
        actorId,
        actionType: "monthly_pl_unlocked",
        entityType: "pl_snapshot",
        entityId: row.id,
        beforeValue: existing as Record<string, unknown> | null,
        afterValue: row as Record<string, unknown>,
        reason,
        title: "Monthly P&L unlocked",
        message: `Month ${monthKey} has been unlocked.`,
        severity: "warning",
        ownerRole: "finance_admin",
        type: "monthly_pl_unlocked",
        dedupeKey: `pl:unlock:${monthKey}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return row;
}
