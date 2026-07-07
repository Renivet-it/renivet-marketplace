import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import {
    computeTdsDeduction,
    getFinancialYearForDate,
} from "@/lib/finance/calculations";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type ResolvedRule = {
    commissionPercentBps: number;
    holdbackPercentBps: number;
    ruleName: string;
    ruleId?: string;
};

type PayoutExecutionStatus =
    | "pending_review"
    | "approved"
    | "processing"
    | "submitted"
    | "awaiting_manual_confirmation"
    | "completed"
    | "failed"
    | "skipped";

type BrandCycleSummary = {
    brandId: string;
    brandName: string;
    grossSalesPaise: number;
    commissionPaise: number;
    returnsPaise: number;
    carrierClaimsPaise: number;
    holdbackPaise: number;
    holdbackReleasePaise: number;
    overrideNetPaise: number;
    tdsPaise: number;
    netPayablePaise: number;
    payoutMethod: "razorpay_route" | "manual_neft";
    reviewStatus: "pending" | "approved";
    executionStatus: PayoutExecutionStatus;
    approvedBy?: string | null;
    approvedAt?: string | null;
    transactionId?: string | null;
    statementUrl?: string | null;
    lineItems: Array<{
        lineType: string;
        description: string;
        amountPaise: number;
        referenceId?: string;
        metadata?: Record<string, unknown>;
    }>;
    metadata: Record<string, unknown>;
};

type CycleCalculationSummary = {
    totalBrands: number;
    totalGrossPaise: number;
    totalNetPayablePaise: number;
    brands: BrandCycleSummary[];
    executions?: Array<Record<string, unknown>>;
    executedAt?: string;
};

function toDate(value?: string | Date | null) {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
}

function isRuleEffective(
    effectiveFrom: string | null,
    effectiveTo: string | null,
    targetDate: Date
) {
    const from = effectiveFrom ? new Date(effectiveFrom) : null;
    const to = effectiveTo ? new Date(effectiveTo) : null;
    if (from && targetDate < from) return false;
    if (to && targetDate > to) return false;
    return true;
}

function getRuleSpecificityScore(input: {
    brandId?: string | null;
    categoryId?: string | null;
    productTypeId?: string | null;
}) {
    return [input.brandId, input.categoryId, input.productTypeId].filter(Boolean).length;
}

function getCycleSummaryRecord(cycle: {
    calculationSummary?: Record<string, unknown> | null;
}) {
    const maybeSummary = cycle.calculationSummary as CycleCalculationSummary | undefined;
    return maybeSummary?.brands ?? [];
}

function buildCycleTotals(brands: BrandCycleSummary[]): CycleCalculationSummary {
    return {
        totalBrands: brands.length,
        totalGrossPaise: brands.reduce((sum, item) => sum + item.grossSalesPaise, 0),
        totalNetPayablePaise: brands.reduce((sum, item) => sum + item.netPayablePaise, 0),
        brands,
    };
}

function getOrderDeliveredAt(order: {
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
    shipments?: Array<{
        status?: string | null;
        updatedAt?: Date | string | null;
    }>;
}) {
    const shipmentDelivery = order.shipments?.find((shipment) => shipment.status === "delivered");
    return (
        toDate(shipmentDelivery?.updatedAt) ??
        toDate(order.updatedAt) ??
        toDate(order.createdAt) ??
        new Date()
    );
}

async function resolveCommissionRuleForItem(input: {
    brandId: string;
    categoryId?: string | null;
    productTypeId?: string | null;
    targetDate: Date;
}) {
    const rules = await financeComplianceQueries.listCommissionRules({
        isActive: true,
    });

    const matching = rules.filter((rule) => {
        if (!isRuleEffective(rule.effectiveFrom, rule.effectiveTo, input.targetDate)) {
            return false;
        }
        const brandOk = !rule.brandId || rule.brandId === input.brandId;
        const categoryOk = !rule.categoryId || rule.categoryId === input.categoryId;
        const productTypeOk = !rule.productTypeId || rule.productTypeId === input.productTypeId;
        return brandOk && categoryOk && productTypeOk;
    });

    const winner = matching.sort((left, right) => {
        if (right.priority !== left.priority) return right.priority - left.priority;
        return (
            getRuleSpecificityScore({
                brandId: right.brandId,
                categoryId: right.categoryId,
                productTypeId: right.productTypeId,
            }) -
            getRuleSpecificityScore({
                brandId: left.brandId,
                categoryId: left.categoryId,
                productTypeId: left.productTypeId,
            })
        );
    })[0];

    if (!winner) return null;

    return {
        commissionPercentBps: winner.commissionPercentBps,
        holdbackPercentBps: winner.holdbackPercentBps,
        ruleName: winner.ruleName,
        ruleId: winner.id,
    } satisfies ResolvedRule;
}

async function computeHoldbackRelease(params: {
    brandId: string;
    payoutDate: Date;
    previousCycles: Array<{
        id: string;
        cycleEnd: string;
        status: string;
    }>;
    refundRows: Array<{
        createdAt: Date | string;
        policyBucket?: string | null;
        order?: {
            items?: Array<{
                product?: {
                    brandId?: string | null;
                } | null;
            }>;
        } | null;
    }>;
}) {
    const priorCycles = params.previousCycles
        .filter((cycle) => cycle.status === "completed")
        .sort(
            (left, right) =>
                new Date(right.cycleEnd).getTime() - new Date(left.cycleEnd).getTime()
        );

    for (const cycle of priorCycles) {
        const lineItems = await financeComplianceQueries.listPayoutLineItems(cycle.id);
        const holdbackAmount = lineItems
            .filter(
                (item) => item.brandId === params.brandId && item.lineType === "holdback"
            )
            .reduce((sum, item) => sum + Math.abs(item.amountPaise), 0);

        if (holdbackAmount <= 0) continue;

        const cycleEndDate = new Date(cycle.cycleEnd);
        cycleEndDate.setHours(23, 59, 59, 999);
        const hasReturnAfterCycle = params.refundRows.some((refund) => {
            const refundBrandId = refund.order?.items?.[0]?.product?.brandId;
            const createdAt = toDate(refund.createdAt);
            return (
                refundBrandId === params.brandId &&
                ["brand_fault", "customer_fault"].includes(refund.policyBucket ?? "") &&
                !!createdAt &&
                createdAt > cycleEndDate &&
                createdAt <= params.payoutDate
            );
        });

        if (!hasReturnAfterCycle) {
            return holdbackAmount;
        }
    }

    return 0;
}

async function buildBrandPayoutSummaries(cycleId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const start = new Date(cycle.cycleStart);
    const end = new Date(cycle.cycleEnd);
    end.setHours(23, 59, 59, 999);

    const previousCycles = (await financeComplianceQueries.listPayoutCycles()).filter(
        (row) => row.id !== cycleId && new Date(row.payoutDate).getTime() < new Date(cycle.payoutDate).getTime()
    );

    const earliestPriorDate =
        previousCycles.length > 0
            ? new Date(
                  Math.min(
                      ...previousCycles.map((row) => new Date(row.cycleEnd).getTime()),
                      start.getTime()
                  )
              )
            : start;

    const [orders, refundRows, overrides, brands, claimRows] = await Promise.all([
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
        financeComplianceQueries.listRefundsForPayoutWindow({
            start: earliestPriorDate,
            end: new Date(cycle.payoutDate),
        }),
        financeComplianceQueries.listPayoutOverrides(cycleId),
        financeComplianceQueries.listBrandsForPayout(),
        financeComplianceQueries.listCarrierClaimsForFinanceWindow({ start, end }),
    ]);

    const brandDirectory = new Map(brands.map((brand) => [brand.brandId, brand]));
    const previousSummaryMap = new Map(
        getCycleSummaryRecord(cycle).map((summary) => [summary.brandId, summary])
    );
    const summaries = new Map<string, BrandCycleSummary>();

    for (const order of orders) {
        if (order.status !== "delivered") continue;
        const deliveredAt = getOrderDeliveredAt(order);
        if (deliveredAt < start || deliveredAt > end) continue;

        for (const item of order.items) {
            const brandId = item.product?.brandId;
            if (!brandId) continue;

            const brand = brandDirectory.get(brandId);
            if (!brand) continue;

            const previous = previousSummaryMap.get(brandId);
            const rule =
                (await resolveCommissionRuleForItem({
                    brandId,
                    categoryId: item.product?.categoryId,
                    productTypeId: item.product?.productTypeId,
                    targetDate: deliveredAt,
                })) ?? {
                    commissionPercentBps: item.product?.category?.commissionRate ?? 2000,
                    holdbackPercentBps: brand.holdbackPercentBps ?? 500,
                    ruleName: "default_20_percent",
                };

            const grossItemPaise =
                Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity;
            const commissionPaise = Math.round(
                grossItemPaise * (rule.commissionPercentBps / 10_000)
            );

            const existing =
                summaries.get(brandId) ??
                ({
                    brandId,
                    brandName: brand.brandName,
                    grossSalesPaise: 0,
                    commissionPaise: 0,
                    returnsPaise: 0,
                    carrierClaimsPaise: 0,
                    holdbackPaise: 0,
                    holdbackReleasePaise: 0,
                    overrideNetPaise: 0,
                    tdsPaise: 0,
                    netPayablePaise: 0,
                    payoutMethod:
                        brand.payoutMethod === "razorpay_route"
                            ? "razorpay_route"
                            : "manual_neft",
                    reviewStatus: previous?.reviewStatus ?? "pending",
                    executionStatus: previous?.executionStatus ?? "pending_review",
                    approvedBy: previous?.approvedBy ?? null,
                    approvedAt: previous?.approvedAt ?? null,
                    transactionId: previous?.transactionId ?? null,
                    statementUrl: previous?.statementUrl ?? null,
                    lineItems: [],
                    metadata: {
                        bankName: brand.bankName,
                        bankAccountHolderName: brand.bankAccountHolderName,
                        bankAccountNumber: brand.bankAccountNumber,
                        bankAccountNumberLast4: brand.bankAccountNumber?.slice(-4),
                        bankIfscCode: brand.bankIfscCode,
                        rzpAccountId: brand.rzpAccountId,
                        gstin: brand.gstin,
                        pan: brand.pan,
                        payoutEmail: brand.payoutEmail,
                        holdbackPercentBps:
                            brand.holdbackPercentBps && brand.holdbackPercentBps > 0
                                ? brand.holdbackPercentBps
                                : 500,
                    },
                } satisfies BrandCycleSummary);

            existing.grossSalesPaise += grossItemPaise;
            existing.commissionPaise += commissionPaise;
            existing.lineItems.push({
                lineType: "sale",
                description: `${item.product?.title ?? "Product"} x${item.quantity}`,
                amountPaise: grossItemPaise,
                referenceId: order.id,
                metadata: {
                    deliveredAt: deliveredAt.toISOString(),
                    commissionPercentBps: rule.commissionPercentBps,
                    holdbackPercentBps: rule.holdbackPercentBps,
                    ruleName: rule.ruleName,
                    ruleId: "ruleId" in rule ? rule.ruleId : undefined,
                },
            });
            existing.lineItems.push({
                lineType: "commission",
                description: `Platform commission for ${item.product?.title ?? "product"}`,
                amountPaise: -commissionPaise,
                referenceId: order.id,
                metadata: {
                    ruleName: rule.ruleName,
                    ruleId: "ruleId" in rule ? rule.ruleId : undefined,
                },
            });

            summaries.set(brandId, existing);
        }
    }

    for (const refund of refundRows) {
        const refundOrder = (refund as { order?: { items?: Array<{ product?: { brandId?: string | null } | null }> | null } }).order;
        const brandId = refundOrder?.items?.[0]?.product?.brandId;
        if (!brandId) continue;
        const summary = summaries.get(brandId);
        if (!summary) continue;
        const returnReceivedAt = toDate(refund.returnReceivedAt);
        const eligibleReturn =
            ["brand_fault", "customer_fault"].includes(refund.policyBucket ?? "") &&
            refund.status === "processed" &&
            refund.returnQcStatus === "passed" &&
            returnReceivedAt &&
            returnReceivedAt >= start &&
            returnReceivedAt <= end;

        if (!eligibleReturn) continue;

        summary.returnsPaise += refund.amount;
        summary.lineItems.push({
            lineType: "refund_deduction",
            description: `Refund ${refund.id} (${refund.policyBucket ?? "unknown"})`,
            amountPaise: -refund.amount,
            referenceId: refund.id,
            metadata: {
                policyBucket: refund.policyBucket,
                returnReceivedAt: returnReceivedAt?.toISOString(),
            },
        });
    }

    for (const claim of claimRows) {
        const brandId = claim.brandId;
        if (!brandId) continue;
        const summary = summaries.get(brandId);
        if (!summary) continue;
        if (!["approved", "settled"].includes(claim.status)) continue;
        const claimAmount = claim.approvedAmount ?? claim.claimAmount ?? 0;
        if (claimAmount <= 0) continue;

        summary.carrierClaimsPaise += claimAmount;
        summary.lineItems.push({
            lineType: "carrier_claim",
            description: `Carrier claim ${claim.id}`,
            amountPaise: -claimAmount,
            referenceId: claim.id,
            metadata: {
                claimType: claim.claimType,
                status: claim.status,
            },
        });
    }

    for (const override of overrides) {
        const summary = summaries.get(override.brandId);
        if (!summary) continue;

        if (!override.approvedBy && Math.abs(override.amountPaise) > 50_000) {
            summary.metadata.pendingOverrideCount = Number(summary.metadata.pendingOverrideCount ?? 0) + 1;
            continue;
        }

        summary.overrideNetPaise += override.amountPaise;
        summary.lineItems.push({
            lineType: "override",
            description: `${override.adjustmentType}: ${override.reasonCode}`,
            amountPaise: override.amountPaise,
            referenceId: override.id,
            metadata: {
                proofFileUrl: override.proofFileUrl,
                notes: override.notes,
                approvedBy: override.approvedBy,
            },
        });
    }

    for (const summary of summaries.values()) {
        const holdbackPercentBps = Number(summary.metadata.holdbackPercentBps ?? 500);
        const preHoldbackBase =
            summary.grossSalesPaise -
            summary.commissionPaise -
            summary.returnsPaise -
            summary.carrierClaimsPaise;
        summary.holdbackPaise = Math.max(
            0,
            Math.round(Math.max(preHoldbackBase, 0) * (holdbackPercentBps / 10_000))
        );
        if (summary.holdbackPaise > 0) {
            summary.lineItems.push({
                lineType: "holdback",
                description: `Holdback reserve at ${(holdbackPercentBps / 100).toFixed(2)}%`,
                amountPaise: -summary.holdbackPaise,
                metadata: {
                    holdbackPercentBps,
                },
            });
        }

        summary.holdbackReleasePaise = await computeHoldbackRelease({
            brandId: summary.brandId,
            payoutDate: new Date(cycle.payoutDate),
            previousCycles,
            refundRows,
        });
        if (summary.holdbackReleasePaise > 0) {
            summary.lineItems.push({
                lineType: "holdback_release",
                description: "Previous cycle holdback release",
                amountPaise: summary.holdbackReleasePaise,
            });
        }

        const financialYear = getFinancialYearForDate(new Date(cycle.payoutDate));
        const tracking = await financeComplianceQueries.getBrandTdsTracking(
            summary.brandId,
            financialYear
        );
        const tdsPreview = computeTdsDeduction({
            cumulativeCommissionPaise:
                tracking?.annualCommissionYtdPaise ?? tracking?.cumulativeCommissionPaise ?? 0,
            cycleCommissionPaise: summary.commissionPaise,
            thresholdPaise: tracking?.thresholdPaise ?? undefined,
            rateBps: tracking?.tdsRateBps ?? undefined,
        });

        summary.tdsPaise = tdsPreview.deductiblePaise;
        summary.metadata.tdsFinancialYear = financialYear;
        summary.metadata.tdsNote = tdsPreview.note;
        summary.metadata.tdsCumulativeCommissionBeforePaise =
            tracking?.annualCommissionYtdPaise ?? tracking?.cumulativeCommissionPaise ?? 0;
        summary.metadata.tdsCumulativeCommissionAfterPaise =
            tdsPreview.postCycleCumulativePaise;
        summary.metadata.tdsDeductedYtdPaise =
            tracking?.tdsDeductedYtdPaise ?? tracking?.cumulativeTdsPaise ?? 0;
        summary.metadata.thresholdCrossedAt = tracking?.thresholdCrossedAt?.toISOString?.() ?? null;
        summary.lineItems.push({
            lineType: "tds",
            description: tdsPreview.note,
            amountPaise: -summary.tdsPaise,
            metadata: {
                financialYear,
                thresholdPaise: tracking?.thresholdPaise ?? 3_000_000,
                rateBps: tracking?.tdsRateBps ?? 100,
                cumulativeCommissionBeforePaise:
                    tracking?.annualCommissionYtdPaise ?? tracking?.cumulativeCommissionPaise ?? 0,
                cumulativeCommissionAfterPaise: tdsPreview.postCycleCumulativePaise,
                thresholdCrossed: tdsPreview.thresholdCrossed,
            },
        });
        summary.netPayablePaise =
            summary.grossSalesPaise -
            summary.commissionPaise -
            summary.returnsPaise -
            summary.carrierClaimsPaise -
            summary.holdbackPaise +
            summary.holdbackReleasePaise +
            summary.overrideNetPaise -
            summary.tdsPaise;
    }

    return Array.from(summaries.values());
}

async function persistCycleSummary(params: {
    cycleId: string;
    actorId: string;
    status: "calculated" | "approved" | "processing" | "completed" | "failed";
    brands: BrandCycleSummary[];
    calculatedBy?: string;
    approvedBy?: string;
    executedBy?: string;
    executions?: Array<Record<string, unknown>>;
}) {
    const base = buildCycleTotals(params.brands);
    const updated = await financeComplianceQueries.updatePayoutCycle(params.cycleId, {
        status: params.status,
        calculatedBy: params.calculatedBy,
        approvedBy: params.approvedBy,
        executedBy: params.executedBy,
        calculationSummary: {
            ...base,
            executions: params.executions,
            executedAt: params.executions?.length ? new Date().toISOString() : undefined,
        },
    });

    for (const summary of params.brands) {
        if (!["completed", "skipped"].includes(summary.executionStatus)) {
            continue;
        }
        const financialYear = getFinancialYearForDate(new Date(updated.payoutDate));
        const currentTracking = await financeComplianceQueries.getBrandTdsTracking(
            summary.brandId,
            financialYear
        );
        if (currentTracking?.lastAppliedCycleId === updated.id) {
            continue;
        }
        const previousAnnualCommission =
            currentTracking?.annualCommissionYtdPaise ??
            currentTracking?.cumulativeCommissionPaise ??
            0;
        const previousAnnualTds =
            currentTracking?.tdsDeductedYtdPaise ??
            currentTracking?.cumulativeTdsPaise ??
            0;
        const crossingNow =
            previousAnnualCommission < 3_000_000 &&
            previousAnnualCommission + summary.commissionPaise >= 3_000_000;
        await financeComplianceQueries.upsertBrandTdsTracking({
            brandId: summary.brandId,
            financialYear,
            annualCommissionYtdPaise: previousAnnualCommission + summary.commissionPaise,
            tdsDeductedYtdPaise: previousAnnualTds + summary.tdsPaise,
            thresholdCrossedAt:
                currentTracking?.thresholdCrossedAt ??
                (crossingNow ? new Date() : null),
            cumulativeCommissionPaise: previousAnnualCommission + summary.commissionPaise,
            cumulativeTdsPaise: previousAnnualTds + summary.tdsPaise,
            thresholdPaise: currentTracking?.thresholdPaise ?? 3_000_000,
            tdsRateBps: currentTracking?.tdsRateBps ?? 100,
            lastAppliedCycleId: updated.id,
        });
    }

    return updated;
}

function getCycleBrands(cycle: {
    calculationSummary?: Record<string, unknown> | null;
}) {
    return (cycle.calculationSummary as CycleCalculationSummary | undefined)?.brands ?? [];
}

function deriveCycleStatus(brands: BrandCycleSummary[]) {
    if (brands.some((brand) => brand.executionStatus === "failed")) return "failed";
    if (
        brands.every((brand) =>
            ["completed", "skipped"].includes(brand.executionStatus)
        )
    ) {
        return "completed";
    }
    if (
        brands.some((brand) =>
            ["processing", "submitted", "awaiting_manual_confirmation"].includes(
                brand.executionStatus
            )
        )
    ) {
        return "processing";
    }
    if (brands.every((brand) => brand.reviewStatus === "approved")) return "approved";
    return "calculated";
}

export async function calculatePayoutCycle(cycleId: string, actorId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const summaries = await buildBrandPayoutSummaries(cycleId);
    const lineItems = summaries.flatMap((summary) =>
        summary.lineItems.map((line) => ({
            cycleId,
            brandId: summary.brandId,
            lineType: line.lineType,
            referenceType: line.lineType,
            referenceId: line.referenceId,
            description: line.description,
            amountPaise: line.amountPaise,
            metadata: line.metadata ?? {},
        }))
    );

    await financeComplianceQueries.replacePayoutLineItems(cycleId, lineItems);
    const updated = await persistCycleSummary({
        cycleId,
        actorId,
        status: "calculated",
        brands: summaries,
        calculatedBy: actorId,
    });

    await auditAndAlert({
        actorId,
        actionType: "payout_cycle_calculated",
        entityType: "payout_cycle",
        entityId: cycleId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "payout_cycle_calculated",
        title: "Payout cycle calculated",
        message: `Payout cycle ${updated.cycleKey} has been calculated for ${summaries.length} brands.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "payout_cycle_calculated",
        dedupeKey: `payout:calculated:${cycleId}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return updated;
}

export async function approvePayoutCycle(
    cycleId: string,
    actorId: string,
    brandId?: string
) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const brands = getCycleBrands(cycle).map((brand) => ({ ...brand }));
    if (!brands.length) throw new Error("Run calculation before approval.");

    const now = new Date().toISOString();
    for (const brand of brands) {
        if (brandId && brand.brandId !== brandId) continue;
        brand.reviewStatus = "approved";
        brand.executionStatus =
            brand.executionStatus === "completed" ? "completed" : "approved";
        brand.approvedBy = actorId;
        brand.approvedAt = now;
    }

    const updated = await persistCycleSummary({
        cycleId,
        actorId,
        status: deriveCycleStatus(brands) as "approved" | "calculated" | "processing" | "completed" | "failed",
        brands,
        approvedBy: actorId,
    });

    await auditAndAlert({
        actorId,
        actionType: brandId ? "brand_payout_approved" : "payout_cycle_approved",
        entityType: brandId ? "brand_payout" : "payout_cycle",
        entityId: brandId ?? cycleId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "payout_approved",
        title: brandId ? "Brand payout approved" : "Payout cycle approved",
        message: brandId
            ? `Brand payout ${brandId} was approved for execution.`
            : `Payout cycle ${updated.cycleKey} is approved for execution.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: brandId ? "brand_payout_approved" : "payout_cycle_approved",
        dedupeKey: brandId ? `payout:approved:${cycleId}:${brandId}` : `payout:approved:${cycleId}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            cycleId,
            brandId,
        },
    });

    return updated;
}

async function createRazorpayPayout(input: {
    amountPaise: number;
    brandName: string;
    bankAccountHolderName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    reference: string;
    rzpAccountId?: string | null;
}) {
    const sourceAccount = process.env.RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER;
    if (!sourceAccount) {
        return {
            mode: "razorpay_route",
            status: "queued_manual_fallback",
            reference: input.reference,
        };
    }

    const auth = Buffer.from(
        `${process.env.RAZOR_PAY_KEY_ID}:${process.env.RAZOR_PAY_SECRET_KEY}`
    ).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/payouts", {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            account_number: sourceAccount,
            amount: input.amountPaise,
            currency: "INR",
            mode: "NEFT",
            purpose: "vendor_payment",
            fund_account: {
                account_type: "bank_account",
                bank_account: {
                    name: input.bankAccountHolderName ?? input.brandName,
                    ifsc: input.bankIfscCode,
                    account_number: input.bankAccountNumber,
                },
                contact: {
                    name: input.brandName,
                    type: "vendor",
                    reference_id: input.reference,
                },
            },
            narration: `Renivet payout ${input.reference}`,
            reference_id: input.reference,
            notes: {
                linkedAccountId: input.rzpAccountId ?? "",
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Razorpay payout failed with ${response.status}.`);
    }

    return (await response.json()) as Record<string, unknown>;
}

export async function executePayoutCycle(
    cycleId: string,
    actorId: string,
    brandId?: string
) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const brands = getCycleBrands(cycle).map((brand) => ({ ...brand }));
    if (!brands.length) throw new Error("Run calculation before execution.");

    const executions: Array<Record<string, unknown>> = [];

    for (const brand of brands) {
        if (brandId && brand.brandId !== brandId) continue;
        if (brand.reviewStatus !== "approved") {
            throw new Error(`Approve payout for ${brand.brandName} before execution.`);
        }
        if (["completed", "awaiting_manual_confirmation"].includes(brand.executionStatus)) {
            continue;
        }

        const metadata = brand.metadata ?? {};
        brand.executionStatus = "processing";

        if (brand.netPayablePaise <= 0) {
            brand.executionStatus = "skipped";
            executions.push({
                brandId: brand.brandId,
                status: "skipped",
                reason: "non_positive_net_payable",
            });
            continue;
        }

        if (brand.payoutMethod === "razorpay_route") {
            try {
                const payout = await createRazorpayPayout({
                    amountPaise: brand.netPayablePaise,
                    brandName: brand.brandName,
                    bankAccountHolderName: String(metadata.bankAccountHolderName ?? ""),
                    bankAccountNumber: String(metadata.bankAccountNumber ?? ""),
                    bankIfscCode: String(metadata.bankIfscCode ?? ""),
                    reference: `${cycle.cycleKey}-${brand.brandId}`,
                    rzpAccountId: String(metadata.rzpAccountId ?? ""),
                });

                brand.executionStatus = "completed";
                brand.transactionId = String(
                    payout.id ?? payout.reference_id ?? `${cycle.cycleKey}-${brand.brandId}`
                );
                brand.statementUrl = `/api/finance/payouts/${cycleId}/statement/${brand.brandId}`;
                executions.push({
                    brandId: brand.brandId,
                    status: "submitted",
                    mode: "razorpay_route",
                    payout,
                });

                await auditAndAlert({
                    actorId,
                    actionType: "brand_payout_executed",
                    entityType: "brand_payout",
                    entityId: brand.brandId,
                    afterValue: brand as unknown as Record<string, unknown>,
                    reason: "razorpay_route_execution",
                    title: "Brand payout executed",
                    message: `Payout of ${(brand.netPayablePaise / 100).toFixed(2)} processed for ${brand.brandName}.`,
                    severity: "info",
                    ownerRole: "finance_admin",
                    type: "brand_payout_executed",
                    dedupeKey: `brand-payout:${cycleId}:${brand.brandId}:executed`,
                    channels: ["admin", "email", "whatsapp"],
                    metadata: {
                        module: "finance_compliance",
                        cycleId,
                        brandId: brand.brandId,
                    },
                });
                if (brand.tdsPaise > 0) {
                    await writeFinanceAuditEvent({
                        actorId,
                        actionType: "tds_deduction.applied",
                        entityType: "brand_tds_tracking",
                        entityId: brand.brandId,
                        reason: "tds_applied_during_payout_execution",
                        afterValue: {
                            brandId: brand.brandId,
                            cycleId,
                            tdsPaise: brand.tdsPaise,
                            commissionPaise: brand.commissionPaise,
                            financialYear: getFinancialYearForDate(new Date(cycle.payoutDate)),
                        },
                        metadata: {
                            cycleId,
                            brandId: brand.brandId,
                        },
                    });
                }
            } catch (error) {
                brand.executionStatus = "failed";
                executions.push({
                    brandId: brand.brandId,
                    status: "failed",
                    mode: "razorpay_route",
                    reason: error instanceof Error ? error.message : "Unknown Razorpay failure",
                });

                await auditAndAlert({
                    actorId,
                    actionType: "brand_payout_failed",
                    entityType: "brand_payout",
                    entityId: brand.brandId,
                    afterValue: brand as unknown as Record<string, unknown>,
                    reason: "razorpay_route_execution_failed",
                    title: "Payout execution failed",
                    message: `Payout failed for ${brand.brandName}: ${error instanceof Error ? error.message : "Unknown error"}`,
                    severity: "critical",
                    ownerRole: "finance_admin",
                    type: "brand_payout_failed",
                    dedupeKey: `brand-payout:${cycleId}:${brand.brandId}:failed`,
                    channels: ["admin", "email"],
                    metadata: {
                        module: "finance_compliance",
                        cycleId,
                        brandId: brand.brandId,
                    },
                });
            }
        } else {
            brand.executionStatus = "awaiting_manual_confirmation";
            brand.statementUrl = `/api/finance/payouts/${cycleId}/statement/${brand.brandId}`;
            executions.push({
                brandId: brand.brandId,
                status: "instruction_generated",
                mode: "manual_neft",
                instruction: {
                    beneficiary: metadata.bankAccountHolderName,
                    accountNumberLast4: metadata.bankAccountNumberLast4,
                    ifsc: metadata.bankIfscCode,
                    amountPaise: brand.netPayablePaise,
                    reference: `${cycle.cycleKey}-${brand.brandId}`,
                },
            });
        }
    }

    const updated = await persistCycleSummary({
        cycleId,
        actorId,
        status: deriveCycleStatus(brands) as "approved" | "calculated" | "processing" | "completed" | "failed",
        brands,
        executedBy: actorId,
        executions,
    });

    await auditAndAlert({
        actorId,
        actionType: brandId ? "brand_payout_execution_started" : "payout_cycle_executed",
        entityType: brandId ? "brand_payout" : "payout_cycle",
        entityId: brandId ?? cycleId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "payout_execution",
        title: brandId ? "Brand payout in progress" : "Payout cycle executed",
        message: brandId
            ? `Execution has started for brand payout ${brandId}.`
            : `Payout cycle ${updated.cycleKey} execution completed.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: brandId ? "brand_payout_execution_started" : "payout_cycle_executed",
        dedupeKey: brandId ? `payout:execution:${cycleId}:${brandId}` : `payout:executed:${cycleId}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            cycleId,
            brandId,
        },
    });

    return updated;
}

export async function completeManualBrandPayout(input: {
    cycleId: string;
    brandId: string;
    actorId: string;
    transactionId: string;
}) {
    const cycle = await financeComplianceQueries.getPayoutCycle(input.cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const brands = getCycleBrands(cycle).map((brand) => ({ ...brand }));
    const brand = brands.find((item) => item.brandId === input.brandId);
    if (!brand) throw new Error("Brand payout not found.");
    if (brand.executionStatus !== "awaiting_manual_confirmation") {
        throw new Error("Manual NEFT confirmation is not pending for this brand.");
    }

    brand.executionStatus = "completed";
    brand.transactionId = input.transactionId;
    brand.statementUrl = `/api/finance/payouts/${input.cycleId}/statement/${input.brandId}`;

    const updated = await persistCycleSummary({
        cycleId: input.cycleId,
        actorId: input.actorId,
        status: deriveCycleStatus(brands) as "approved" | "calculated" | "processing" | "completed" | "failed",
        brands,
        executedBy: input.actorId,
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "brand_payout_manual_completed",
        entityType: "brand_payout",
        entityId: input.brandId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "manual_neft_completed",
        title: "Manual payout completed",
        message: `Manual NEFT payout completed for ${brand.brandName}.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "brand_payout_manual_completed",
        dedupeKey: `brand-payout:${input.cycleId}:${input.brandId}:manual-complete`,
        channels: ["admin", "email", "whatsapp"],
        metadata: {
            module: "finance_compliance",
            cycleId: input.cycleId,
            brandId: input.brandId,
        },
    });
    if (brand.tdsPaise > 0) {
        await writeFinanceAuditEvent({
            actorId: input.actorId,
            actionType: "tds_deduction.applied",
            entityType: "brand_tds_tracking",
            entityId: input.brandId,
            reason: "tds_applied_during_manual_payout_completion",
            afterValue: {
                brandId: input.brandId,
                cycleId: input.cycleId,
                tdsPaise: brand.tdsPaise,
                commissionPaise: brand.commissionPaise,
                financialYear: getFinancialYearForDate(new Date(cycle.payoutDate)),
                transactionId: input.transactionId,
            },
            metadata: {
                cycleId: input.cycleId,
                brandId: input.brandId,
            },
        });
    }

    return updated;
}

export async function createPayoutOverride(input: {
    cycleId: string;
    brandId: string;
    adjustmentType: string;
    amountPaise: number;
    reasonCode: string;
    notes: string;
    proofFileUrl: string;
    actorId: string;
    approverId?: string;
}) {
    if (!input.notes.trim()) {
        throw new Error("Override notes are required.");
    }
    if (!input.proofFileUrl) {
        throw new Error("Override proof is required.");
    }
    if (Math.abs(input.amountPaise) > 50_000 && !input.approverId) {
        throw new Error("Overrides above Rs. 500 require a second admin approver.");
    }
    if (input.approverId && input.approverId === input.actorId) {
        throw new Error("Checker and maker must be different admins.");
    }

    const row = await financeComplianceQueries.addPayoutOverride({
        cycleId: input.cycleId,
        brandId: input.brandId,
        adjustmentType: input.adjustmentType,
        amountPaise: input.amountPaise,
        reasonCode: input.reasonCode,
        notes: input.notes,
        proofFileUrl: input.proofFileUrl,
        createdBy: input.actorId,
        approvedBy:
            Math.abs(input.amountPaise) > 50_000
                ? input.approverId ?? null
                : input.actorId,
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "payout_override_created",
        entityType: "brand_payout_override",
        entityId: row.id,
        afterValue: row as unknown as Record<string, unknown>,
        reason: input.reasonCode,
        title: "Payout override recorded",
        message: `Override recorded for brand ${input.brandId}.`,
        severity: Math.abs(input.amountPaise) > 50_000 ? "warning" : "info",
        ownerRole: "finance_admin",
        type: "payout_override_created",
        dedupeKey: `payout-override:${row.id}`,
        channels: ["admin", "email"],
        metadata: {
            module: "finance_compliance",
            cycleId: input.cycleId,
            brandId: input.brandId,
            proofFileUrl: input.proofFileUrl,
        },
    });

    if (row.approvedBy) {
        await calculatePayoutCycle(input.cycleId, input.actorId);
    }

    return row;
}

export async function approvePayoutOverride(overrideId: string, actorId: string) {
    const row = await financeComplianceQueries.getPayoutOverride(overrideId);
    if (!row) throw new Error("Payout override not found.");
    if (row.createdBy === actorId) {
        throw new Error("The same admin cannot approve this override.");
    }

    const updated = await financeComplianceQueries.updatePayoutOverride(overrideId, {
        approvedBy: actorId,
    });

    await calculatePayoutCycle(row.cycleId, actorId);

    await auditAndAlert({
        actorId,
        actionType: "payout_override_approved",
        entityType: "brand_payout_override",
        entityId: overrideId,
        beforeValue: row as unknown as Record<string, unknown>,
        afterValue: updated as unknown as Record<string, unknown>,
        reason: updated.reasonCode,
        title: "Payout override approved",
        message: `Override ${overrideId} is now approved and applied.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "payout_override_approved",
        dedupeKey: `payout-override:${overrideId}:approved`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
            cycleId: updated.cycleId,
            brandId: updated.brandId,
            proofFileUrl: updated.proofFileUrl,
        },
    });

    return updated;
}

export async function runPayoutCycleAlerts(actorId?: string | null) {
    const cycles = await financeComplianceQueries.listPayoutCycles();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
    });
    const parts = Object.fromEntries(
        formatter
            .formatToParts(now)
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const currentDay = Number(parts.day);
    const currentHour = Number(parts.hour);
    const isCycleDay = currentDay === 1 || currentDay === 16;
    if (!isCycleDay) {
        return {
            ok: true,
            alerts: [],
            message: "Today is not a scheduled payout cycle day.",
        };
    }

    const dueCycle = cycles.find((cycle) => cycle.payoutDate === today);
    const alerts: string[] = [];

    if (!dueCycle) {
        await auditAndAlert({
            actorId,
            actionType: "payout_cycle_due",
            entityType: "payout_cycle",
            entityId: today,
            reason: "scheduled_payout_day",
            title: "Payout cycle due today",
            message: "Payout cycle due today. Open the finance dashboard to run calculation.",
            severity: "info",
            ownerRole: "finance_admin",
            type: "payout_cycle_due",
            dedupeKey: `payout-due:${today}`,
            channels: ["admin", "email"],
            metadata: {
                module: "finance_compliance",
                payoutDate: today,
            },
        });
        alerts.push("due");
    }

    if (dueCycle && currentHour >= 18 && dueCycle.status !== "completed") {
        await auditAndAlert({
            actorId,
            actionType: "payout_cycle_overdue",
            entityType: "payout_cycle",
            entityId: dueCycle.id,
            beforeValue: dueCycle as Record<string, unknown>,
            reason: "cycle_not_executed",
            title: "Payout cycle overdue",
            message: `Payout cycle ${dueCycle.cycleKey} has not been completed by the escalation cutoff.`,
            severity: "critical",
            ownerRole: "finance_admin",
            type: "payout_cycle_overdue",
            dedupeKey: `payout-overdue:${dueCycle.id}:${today}`,
            channels: ["admin", "email", "whatsapp"],
            metadata: {
                module: "finance_compliance",
                payoutDate: today,
            },
        });
        alerts.push("overdue");
    }

    return {
        ok: true,
        alerts,
        cycleId: dueCycle?.id ?? null,
    };
}
