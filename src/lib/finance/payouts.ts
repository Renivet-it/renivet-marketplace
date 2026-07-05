import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import {
    computeTdsDeduction,
    getFinancialYearForDate,
} from "@/lib/finance/calculations";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";

type ResolvedRule = {
    commissionPercentBps: number;
    holdbackPercentBps: number;
    ruleName: string;
    ruleId?: string;
};

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
    payoutMethod: string;
    lineItems: Array<{
        lineType: string;
        description: string;
        amountPaise: number;
        referenceId?: string;
        metadata?: Record<string, unknown>;
    }>;
    metadata: Record<string, unknown>;
  };

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

async function resolveCommissionRuleForItem(input: {
    brandId: string;
    categoryId?: string | null;
    productTypeId?: string | null;
    targetDate: Date;
}) {
    const rules = await financeComplianceQueries.listCommissionRules({
        brandId: input.brandId,
        isActive: true,
    });

    const matching = rules.filter((rule) => {
        if (!isRuleEffective(rule.effectiveFrom, rule.effectiveTo, input.targetDate)) {
            return false;
        }
        const brandOk = !rule.brandId || rule.brandId === input.brandId;
        const categoryOk = !rule.categoryId || rule.categoryId === input.categoryId;
        const productTypeOk =
            !rule.productTypeId || rule.productTypeId === input.productTypeId;
        return brandOk && categoryOk && productTypeOk;
    });

    const exact = matching.sort((a, b) => a.priority - b.priority)[0];
    if (exact) {
        return {
            commissionPercentBps: exact.commissionPercentBps,
            holdbackPercentBps: exact.holdbackPercentBps,
            ruleName: exact.ruleName,
            ruleId: exact.id,
        } satisfies ResolvedRule;
    }

    return null;
}

async function buildBrandPayoutSummaries(cycleId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const start = new Date(cycle.cycleStart);
    const end = new Date(cycle.cycleEnd);
    end.setHours(23, 59, 59, 999);

    const [orders, refundRows, overrides, brands] = await Promise.all([
        financeComplianceQueries.listOrdersForFinanceWindow({ start, end }),
        financeComplianceQueries.listRecentRefundsForOrderIds(
            (await financeComplianceQueries.listOrdersForFinanceWindow({ start, end })).map(
                (order) => order.id
            )
        ),
        financeComplianceQueries.listPayoutOverrides(cycleId),
        financeComplianceQueries.listBrandsForPayout(),
    ]);

    const summaries = new Map<string, BrandCycleSummary>();

    for (const order of orders) {
        for (const item of order.items) {
            const brandId = item.product?.brandId;
            if (!brandId) continue;

            const brand = brands.find((candidate) => candidate.brandId === brandId);
            if (!brand) continue;

            const rule =
                (await resolveCommissionRuleForItem({
                    brandId,
                    categoryId: item.product?.categoryId,
                    productTypeId: item.product?.productTypeId,
                    targetDate: new Date(order.createdAt ?? new Date()),
                })) ?? {
                    commissionPercentBps:
                        (item.product?.category?.commissionRate ?? 0) * 100,
                    holdbackPercentBps: brand.holdbackPercentBps ?? 0,
                    ruleName: "category_default",
                };

            const grossItemPaise =
                Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity;
            const commissionPaise = Math.round(
                grossItemPaise * (rule.commissionPercentBps / 10_000)
            );
            const holdbackPaise = Math.round(
                grossItemPaise * (rule.holdbackPercentBps / 10_000)
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
                    payoutMethod: brand.payoutMethod ?? "manual_neft",
                    lineItems: [],
                    metadata: {
                        bankName: brand.bankName,
                        bankAccountHolderName: brand.bankAccountHolderName,
                        bankAccountNumberLast4: brand.bankAccountNumber?.slice(-4),
                        bankIfscCode: brand.bankIfscCode,
                        rzpAccountId: brand.rzpAccountId,
                        gstin: brand.gstin,
                    },
                } satisfies BrandCycleSummary);

            existing.grossSalesPaise += grossItemPaise;
            existing.commissionPaise += commissionPaise;
            existing.holdbackPaise += holdbackPaise;
            existing.lineItems.push({
                lineType: "sale",
                description: `${item.product?.title ?? "Product"} x${item.quantity}`,
                amountPaise: grossItemPaise,
                referenceId: order.id,
                metadata: {
                    commissionPercentBps: rule.commissionPercentBps,
                    holdbackPercentBps: rule.holdbackPercentBps,
                    ruleName: rule.ruleName,
                },
            });
            existing.lineItems.push({
                lineType: "commission",
                description: `Platform commission for ${item.product?.title ?? "product"}`,
                amountPaise: -commissionPaise,
                referenceId: order.id,
                metadata: {
                    ruleName: rule.ruleName,
                },
            });
            if (holdbackPaise > 0) {
                existing.lineItems.push({
                    lineType: "holdback",
                    description: `Holdback reserve for ${item.product?.title ?? "product"}`,
                    amountPaise: -holdbackPaise,
                    referenceId: order.id,
                });
            }

            summaries.set(brandId, existing);
        }
    }

    for (const refund of refundRows) {
        if (refund.policyBucket !== "brand_fault") continue;
        const order = orders.find((candidate) => candidate.id === refund.orderId);
        const brandId = order?.items[0]?.product?.brandId;
        if (!brandId) continue;
        const summary = summaries.get(brandId);
        if (!summary) continue;
        summary.returnsPaise += refund.amount;
        summary.lineItems.push({
            lineType: "refund_deduction",
            description: `Brand-fault refund ${refund.id}`,
            amountPaise: -refund.amount,
            referenceId: refund.id,
            metadata: {
                policyBucket: refund.policyBucket,
            },
        });
    }

    for (const override of overrides) {
        const summary = summaries.get(override.brandId);
        if (!summary) continue;
        summary.overrideNetPaise += override.amountPaise;
        summary.lineItems.push({
            lineType: "override",
            description: `${override.adjustmentType}: ${override.reasonCode}`,
            amountPaise: override.amountPaise,
            referenceId: override.id,
            metadata: {
                proofFileUrl: override.proofFileUrl,
                notes: override.notes,
            },
        });
    }

    for (const summary of summaries.values()) {
        const financialYear = getFinancialYearForDate(new Date(cycle.payoutDate));
        const trackingRows = await financeComplianceQueries.listModuleAccess();
        void trackingRows;
        const tdsPreview = computeTdsDeduction({
            cumulativeCommissionPaise: 0,
            cycleCommissionPaise: summary.commissionPaise,
        });

        summary.tdsPaise = tdsPreview.deductiblePaise;
        summary.lineItems.push({
            lineType: "tds",
            description: tdsPreview.note,
            amountPaise: -summary.tdsPaise,
            metadata: {
                financialYear,
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
    const updated = await financeComplianceQueries.updatePayoutCycle(cycleId, {
        status: "calculated",
        calculatedBy: actorId,
        calculationSummary: {
            totalBrands: summaries.length,
            totalGrossPaise: summaries.reduce((sum, item) => sum + item.grossSalesPaise, 0),
            totalNetPayablePaise: summaries.reduce(
                (sum, item) => sum + item.netPayablePaise,
                0
            ),
            brands: summaries,
        },
    });

    for (const summary of summaries) {
        await financeComplianceQueries.upsertBrandTdsTracking({
            brandId: summary.brandId,
            financialYear: getFinancialYearForDate(new Date(updated.payoutDate)),
            cumulativeCommissionPaise: summary.commissionPaise,
            cumulativeTdsPaise: summary.tdsPaise,
            lastAppliedCycleId: updated.id,
        });
    }

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

export async function approvePayoutCycle(cycleId: string, actorId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const updated = await financeComplianceQueries.updatePayoutCycle(cycleId, {
        status: "approved",
        approvedBy: actorId,
    });

    await auditAndAlert({
        actorId,
        actionType: "payout_cycle_approved",
        entityType: "payout_cycle",
        entityId: cycleId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "payout_cycle_approved",
        title: "Payout cycle approved",
        message: `Payout cycle ${updated.cycleKey} is approved for execution.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "payout_cycle_approved",
        dedupeKey: `payout:approved:${cycleId}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return updated;
}

async function createRazorpayPayout(input: {
    amountPaise: number;
    brandName: string;
    bankName?: string | null;
    bankAccountHolderName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    reference: string;
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
        }),
    });

    if (!response.ok) {
        throw new Error(`Razorpay payout failed with ${response.status}.`);
    }

    return (await response.json()) as Record<string, unknown>;
}

export async function executePayoutCycle(cycleId: string, actorId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    if (!["approved", "failed"].includes(cycle.status)) {
        throw new Error("Only approved or failed cycles can be executed.");
    }

    const summary = cycle.calculationSummary as {
        brands?: BrandCycleSummary[];
    };
    const brands = summary.brands ?? [];
    const executions: Array<Record<string, unknown>> = [];

    await financeComplianceQueries.updatePayoutCycle(cycleId, {
        status: "processing",
        executedBy: actorId,
    });

    for (const brand of brands) {
        const metadata = brand.metadata ?? {};
        if (brand.netPayablePaise <= 0) {
            executions.push({
                brandId: brand.brandId,
                status: "skipped",
                reason: "non_positive_net_payable",
            });
            continue;
        }

        if (brand.payoutMethod === "razorpay_route") {
            const payout = await createRazorpayPayout({
                amountPaise: brand.netPayablePaise,
                brandName: brand.brandName,
                bankName: String(metadata.bankName ?? ""),
                bankAccountHolderName: String(metadata.bankAccountHolderName ?? ""),
                bankAccountNumber: String(metadata.bankAccountNumber ?? ""),
                bankIfscCode: String(metadata.bankIfscCode ?? ""),
                reference: `${cycle.cycleKey}-${brand.brandId}`,
            });
            executions.push({
                brandId: brand.brandId,
                status: "submitted",
                mode: "razorpay_route",
                payout,
            });
        } else {
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

    const updated = await financeComplianceQueries.updatePayoutCycle(cycleId, {
        status: "completed",
        executedBy: actorId,
        calculationSummary: {
            ...summary,
            executions,
            executedAt: new Date().toISOString(),
        },
    });

    await auditAndAlert({
        actorId,
        actionType: "payout_cycle_executed",
        entityType: "payout_cycle",
        entityId: cycleId,
        beforeValue: cycle as Record<string, unknown>,
        afterValue: updated as Record<string, unknown>,
        reason: "payout_cycle_executed",
        title: "Payout cycle executed",
        message: `Payout cycle ${updated.cycleKey} execution completed.`,
        severity: "info",
        ownerRole: "finance_admin",
        type: "payout_cycle_executed",
        dedupeKey: `payout:executed:${cycleId}`,
        channels: ["admin"],
        metadata: {
            module: "finance_compliance",
        },
    });

    return updated;
}
