import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import {
    computeTdsDeduction,
    getFinancialYearForDate,
} from "@/lib/finance/calculations";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { getSection194OThresholdPaise } from "@/lib/finance/tds-policy";
import { auditAndAlert } from "@/lib/monitoring-sla/audit";
import { computePayoutBasisFingerprint, getPayoutAuthority } from "./payout-basis";
import {
    PayoutCycleConflictError,
    PayoutPersistenceAfterAcceptanceError,
    PayoutProviderRejectedError,
    PayoutProviderUnknownOutcomeError,
    findPriorPayoutBlocks,
    priorPayoutDiagnostic,
} from "./payout-recovery";
import {
    calculateCommissionPaise,
    resolveCommissionRuleFromCandidates,
    type CommissionRuleCandidate,
} from "./payout-commission";
import {
    evaluatePayoutEligibility,
    getDeliveredAt,
    isWithinPayoutWindow,
} from "./payout-eligibility";
import {
    calculateHoldbackPaise,
    getHoldbackPolicyMetadata,
} from "./payout-holdback";
import {
    buildPayoutIdempotencyKey,
    evaluatePayoutExecutionGate,
    isPayoutOverrideApproved,
} from "./payout-execution-gate";
import {
    calculateContractedPaymentFeePaise,
    CONTRACTED_PAYMENT_FEE_METADATA,
} from "./contracted-payment-fee";
import {
    describePaymentFeeOutcome,
    resolvePaymentFeeOutcome,
} from "./payment-fee-allocation";

const TERRA_LUNA_BRAND_ID = "a8e54f13-228d-452c-8292-f1dd7b07dcb3";

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
    paymentFeePaise: number;
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
    controlEvidence?: {
        commissionValidation: "REN-203";
        eligibilityGating: "REN-204";
        paymentStateGating: "REN-204";
        holdbackSuspension: "BIZ-15";
    };
    eligibilityDiagnostics?: Array<{
        orderId: string;
        disposition: "excluded" | "held";
        reason: string;
    }>;
    executions?: Array<Record<string, unknown>>;
    executedAt?: string;
};

type PayoutExecutionClearanceInput = {
    cycleId: string;
    actorId: string;
    evidenceReference: string;
    transactionValidationReference: string;
    transactionValidatedAt: Date;
    expiresAt?: Date | null;
    // The payout basis fingerprint the clearer was shown (REN-253 G-4).
    expectedBasis: string;
};

function toDate(value?: string | Date | null) {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
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
        controlEvidence: {
            commissionValidation: "REN-203",
            eligibilityGating: "REN-204",
            paymentStateGating: "REN-204",
            holdbackSuspension: "BIZ-15",
        },
    };
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

    const winner = resolveCommissionRuleFromCandidates({
        ...input,
        rules,
    });

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
    const rtoDispositions = await financeComplianceQueries.listRtoDispositionsForOrderIds(
        orders.map((order) => order.id)
    );
    const rtoByOrderId = new Map(rtoDispositions.map((disposition) => [disposition.orderId, disposition]));

    const completedPriorCycles = previousCycles.filter(
        (row) => row.status === "completed"
    );
    const priorLineItems = await Promise.all(
        completedPriorCycles.map((row) =>
            financeComplianceQueries.listPayoutLineItems(row.id)
        )
    );
    const settledOrderIds = new Set(
        priorLineItems
            .flat()
            .filter((item) => item.referenceType === "sale" && item.referenceId)
            .map((item) => item.referenceId as string)
    );
    // N-2: what other cycles already paid, hold in flight or leave unresolved, read from their
    // persisted brand summaries regardless of the other cycle's status or payout date.
    const priorPayoutBlocks = findPriorPayoutBlocks(
        await financeComplianceQueries.listAllPayoutCycles(),
        cycleId
    );
    const paymentIdCounts = new Map<string, number>();
    for (const order of orders) {
        const deliveredAt = getDeliveredAt(order);
        if (
            order.status === "delivered" &&
            isWithinPayoutWindow(deliveredAt, start, end) &&
            order.paymentId
        ) {
            paymentIdCounts.set(
                order.paymentId,
                (paymentIdCounts.get(order.paymentId) ?? 0) + 1
            );
        }
    }
    const ambiguousPaymentIds = new Set(
        [...paymentIdCounts.entries()]
            .filter(([, count]) => count > 1)
            .map(([paymentId]) => paymentId)
    );

    const brandDirectory = new Map(brands.map((brand) => [brand.brandId, brand]));
    const previousSummaryMap = new Map(
        getCycleSummaryRecord(cycle).map((summary) => [summary.brandId, summary])
    );
    const summaries = new Map<string, BrandCycleSummary>();
    const eligibilityDiagnostics: CycleCalculationSummary["eligibilityDiagnostics"] = [];
    const paymentFeeOrderIds = new Set<string>();

    for (const order of orders) {
        if (order.status !== "delivered") continue;
        const deliveredAt = getDeliveredAt(order);
        if (!deliveredAt) {
            eligibilityDiagnostics.push({
                orderId: order.id,
                disposition: "excluded",
                reason: "missing_delivery_timestamp",
            });
            continue;
        }
        if (!isWithinPayoutWindow(deliveredAt, start, end)) {
            eligibilityDiagnostics.push({
                orderId: order.id,
                disposition: "excluded",
                reason: "delivery_outside_cycle",
            });
            continue;
        }

        const eligibility = evaluatePayoutEligibility(
            order,
            settledOrderIds,
            ambiguousPaymentIds
        );
        if (eligibility.disposition !== "eligible") {
            eligibilityDiagnostics.push({
                orderId: order.id,
                disposition: eligibility.disposition,
                reason: eligibility.reason,
            });
            continue;
        }

        for (const item of order.items) {
            const brandId = item.product?.brandId;
            if (!brandId) continue;

            const brand = brandDirectory.get(brandId);
            if (!brand) continue;

            const priorBlock = priorPayoutBlocks.get(`${brandId}:${order.id}`);
            if (priorBlock) {
                eligibilityDiagnostics.push({
                    orderId: order.id,
                    ...priorPayoutDiagnostic(priorBlock),
                });
                continue;
            }

            const previous = previousSummaryMap.get(brandId);
            const rule = await resolveCommissionRuleForItem({
                    brandId,
                    categoryId: item.product?.categoryId,
                    productTypeId: item.product?.productTypeId,
                    targetDate: deliveredAt,
                });

            const grossItemPaise =
                Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity;
            const commissionPaise = rule
                ? calculateCommissionPaise(grossItemPaise, rule.commissionPercentBps)
                : 0;

            const existing =
                summaries.get(brandId) ??
                ({
                    brandId,
                    brandName: brand.brandName,
                    grossSalesPaise: 0,
                    commissionPaise: 0,
                    paymentFeePaise: 0,
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
                        confidentialVerificationStatus:
                            brand.confidentialVerificationStatus ?? null,
                        entityType: brand.entityType,
                        rzpAccountId: brand.rzpAccountId,
                        gstin: brand.gstin,
                        pan: brand.pan,
                        payoutEmail: brand.payoutEmail,
                        holdbackPercentBps: 0,
                        holdbackPolicy: getHoldbackPolicyMetadata(),
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
                        commissionStatus: rule ? "applied" : "blocked_unconfigured",
                        commissionPercentBps: rule?.commissionPercentBps,
                        holdbackPercentBps: 0,
                        ruleName: rule?.ruleName,
                        ruleId: rule?.ruleId,
                    },
                });
            existing.lineItems.push({
                lineType: rule ? "commission" : "commission_blocked",
                description: rule
                    ? `Platform commission for ${item.product?.title ?? "product"}`
                    : `Commission blocked: no approved rule for ${item.product?.title ?? "product"}`,
                amountPaise: -commissionPaise,
                referenceId: order.id,
                metadata: {
                    commissionStatus: rule ? "applied" : "blocked_unconfigured",
                    ruleName: rule?.ruleName,
                    ruleId: rule?.ruleId,
                },
            });

            if (
                brandId === TERRA_LUNA_BRAND_ID &&
                !paymentFeeOrderIds.has(order.id)
            ) {
                const paymentFeePaise = calculateContractedPaymentFeePaise(
                    Number(order.totalAmount)
                );
                paymentFeeOrderIds.add(order.id);
                if (paymentFeePaise > 0) {
                    const disposition = rtoByOrderId.get(order.id);
                    const outcome = resolvePaymentFeeOutcome({
                        isRto: Boolean(disposition),
                        faultOwner: disposition?.faultOwner,
                    });
                    if (outcome.brandChargeable) existing.paymentFeePaise += paymentFeePaise;
                    existing.lineItems.push({
                        lineType: "payment_fee",
                        description: describePaymentFeeOutcome(outcome),
                        amountPaise: outcome.brandChargeable ? -paymentFeePaise : 0,
                        referenceId: order.id,
                        metadata: {
                            ...CONTRACTED_PAYMENT_FEE_METADATA,
                            amountPaise: paymentFeePaise,
                            shipmentType: outcome.shipmentType,
                            chargedTo: outcome.chargedTo,
                            faultOwner: outcome.faultOwner,
                        },
                    });
                }
            }

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

        if (!isPayoutOverrideApproved(override)) {
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
        const holdbackPercentBps = Number(summary.metadata.holdbackPercentBps ?? 0);
        const preHoldbackBase =
            summary.grossSalesPaise -
            summary.commissionPaise -
            summary.paymentFeePaise -
            summary.returnsPaise -
            summary.carrierClaimsPaise;
        summary.holdbackPaise = calculateHoldbackPaise(
            preHoldbackBase,
            holdbackPercentBps
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

        summary.holdbackReleasePaise = summary.holdbackPaise > 0
            ? await computeHoldbackRelease({
                  brandId: summary.brandId,
                  payoutDate: new Date(cycle.payoutDate),
                  previousCycles,
                  refundRows,
              })
            : 0;
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
        const thresholdPaise = getSection194OThresholdPaise(
            String(summary.metadata.entityType ?? "")
        );
        const tdsPreview = computeTdsDeduction({
            cumulativeSalesPaise:
                tracking?.annualSalesYtdPaise ?? tracking?.cumulativeSalesPaise ?? 0,
            cycleSalesPaise: summary.grossSalesPaise,
            thresholdPaise,
            rateBps: tracking?.tdsRateBps ?? undefined,
        });

        summary.tdsPaise = tdsPreview.deductiblePaise;
        summary.metadata.tdsFinancialYear = financialYear;
        summary.metadata.tdsNote = tdsPreview.note;
        summary.metadata.tdsCumulativeSalesBeforePaise =
            tracking?.annualSalesYtdPaise ?? tracking?.cumulativeSalesPaise ?? 0;
        summary.metadata.tdsCumulativeSalesAfterPaise =
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
                thresholdPaise,
                rateBps: tracking?.tdsRateBps ?? 100,
                cumulativeSalesBeforePaise:
                    tracking?.annualSalesYtdPaise ?? tracking?.cumulativeSalesPaise ?? 0,
                cumulativeSalesAfterPaise: tdsPreview.postCycleCumulativePaise,
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

    return {
        brands: Array.from(summaries.values()),
        eligibilityDiagnostics,
    };
}

async function applyTdsLedger(
    brands: BrandCycleSummary[],
    updated: { id: string; payoutDate: string }
) {
    for (const summary of brands) {
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
        const previousAnnualSales =
            currentTracking?.annualSalesYtdPaise ??
            currentTracking?.cumulativeSalesPaise ??
            0;
        const previousAnnualTds =
            currentTracking?.tdsDeductedYtdPaise ??
            currentTracking?.cumulativeTdsPaise ??
            0;
        const thresholdPaise = getSection194OThresholdPaise(
            String(summary.metadata.entityType ?? "")
        );
        const crossingNow =
            previousAnnualSales < thresholdPaise &&
            previousAnnualSales + summary.grossSalesPaise >= thresholdPaise;
        await financeComplianceQueries.upsertBrandTdsTracking({
            brandId: summary.brandId,
            financialYear,
            annualCommissionYtdPaise: currentTracking?.annualCommissionYtdPaise ?? 0,
            annualSalesYtdPaise: previousAnnualSales + summary.grossSalesPaise,
            tdsDeductedYtdPaise: previousAnnualTds + summary.tdsPaise,
            thresholdCrossedAt:
                currentTracking?.thresholdCrossedAt ??
                (crossingNow ? new Date() : null),
            cumulativeCommissionPaise: currentTracking?.cumulativeCommissionPaise ?? 0,
            cumulativeSalesPaise: previousAnnualSales + summary.grossSalesPaise,
            cumulativeTdsPaise: previousAnnualTds + summary.tdsPaise,
            thresholdPaise,
            tdsRateBps: currentTracking?.tdsRateBps ?? 100,
            lastAppliedCycleId: updated.id,
        });
    }
}

async function persistCycleSummary(params: {
    cycleId: string;
    actorId: string;
    status: "calculated" | "approved" | "processing" | "completed" | "failed";
    brands: BrandCycleSummary[];
    eligibilityDiagnostics?: CycleCalculationSummary["eligibilityDiagnostics"];
    previousSummary?: CycleCalculationSummary;
    calculatedBy?: string;
    approvedBy?: string;
    executedBy?: string;
    executions?: Array<Record<string, unknown>>;
    // When set the write is conditional (REN-253 AR-21): it applies only if the cycle is
    // still in one of these states (and still carries this basis fingerprint, if given),
    // otherwise the caller lost a race and gets a conflict instead of overwriting.
    condition?: { statusIn: string[]; basisFingerprint?: string };
    // The TDS ledger is bookkeeping after a recorded payment; payout execution applies it
    // separately so a ledger failure cannot disturb the persisted outcome.
    applyTds?: boolean;
}) {
    const base = buildCycleTotals(params.brands);
    const values = {
        status: params.status,
        calculatedBy: params.calculatedBy,
        approvedBy: params.approvedBy,
        executedBy: params.executedBy,
        calculationSummary: {
            ...base,
            // The payout basis of this summary (G-1, G-2, G-4): approvals, clearances and
            // execution are checked against it.
            basisFingerprint: computePayoutBasisFingerprint(params.cycleId, params.brands),
            eligibilityDiagnostics:
                params.eligibilityDiagnostics ??
                params.previousSummary?.eligibilityDiagnostics,
            executions: params.executions,
            executedAt: params.executions?.length ? new Date().toISOString() : undefined,
        },
    };
    const updated = params.condition
        ? await financeComplianceQueries.updatePayoutCycleIf(
              params.cycleId,
              params.condition,
              values
          )
        : await financeComplianceQueries.updatePayoutCycle(params.cycleId, values);
    if (!updated) {
        throw new PayoutCycleConflictError(
            "The payout cycle changed state or basis while it was being written; reload it. A cycle calculated before basis binding must be recalculated."
        );
    }

    if (params.applyTds !== false) {
        await applyTdsLedger(params.brands, updated);
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

// Once a cycle is approved its amounts are what the approver signed off, and from
// processing onwards money may have moved, so only draft/calculated cycles can be
// recalculated (AQ-18).
const RECALCULABLE_PAYOUT_CYCLE_STATUSES = ["draft", "calculated"];

function assertPayoutCycleRecalculable(cycle: { status: string }) {
    if (!RECALCULABLE_PAYOUT_CYCLE_STATUSES.includes(cycle.status)) {
        throw new Error(
            `Payout cycle recalculation blocked: cycle status is ${cycle.status}.`
        );
    }
}

function getChangedPayoutAuthorityFields(
    previous: BrandCycleSummary,
    next: BrandCycleSummary
) {
    const before = getPayoutAuthority(previous);
    const after = getPayoutAuthority(next);
    return (Object.keys(after) as Array<keyof typeof after>).filter(
        (field) => before[field] !== after[field]
    );
}

// Invariant (REN-253 F-1, N-1): an approved brand payout never stays approved after its
// payout authority changes. The cycle stays "calculated" until every brand is
// approved, so a partially approved cycle can be recalculated; the approval carried
// over from the previous summary is therefore dropped for any brand whose amount or
// payee differs, and that brand must be approved again.
function invalidateChangedBrandApprovals(
    previousBrands: BrandCycleSummary[],
    nextBrands: BrandCycleSummary[]
) {
    const previousByBrand = new Map(previousBrands.map((brand) => [brand.brandId, brand]));
    const invalidated: Array<{
        brandId: string;
        previousNetPayablePaise: number;
        netPayablePaise: number;
        changedFields: string[];
    }> = [];

    for (const brand of nextBrands) {
        const previous = previousByBrand.get(brand.brandId);
        if (previous?.reviewStatus !== "approved") continue;
        const changedFields = getChangedPayoutAuthorityFields(previous, brand);
        if (!changedFields.length) continue;

        brand.reviewStatus = "pending";
        brand.executionStatus = "pending_review";
        brand.approvedBy = null;
        brand.approvedAt = null;
        invalidated.push({
            brandId: brand.brandId,
            previousNetPayablePaise: previous.netPayablePaise,
            netPayablePaise: brand.netPayablePaise,
            changedFields,
        });
    }

    return invalidated;
}

function payoutBasisChanged(
    previousBrands: BrandCycleSummary[],
    nextBrands: BrandCycleSummary[]
) {
    if (previousBrands.length !== nextBrands.length) return true;
    const previousByBrand = new Map(previousBrands.map((brand) => [brand.brandId, brand]));
    return nextBrands.some((brand) => {
        const previous = previousByBrand.get(brand.brandId);
        return !previous || getChangedPayoutAuthorityFields(previous, brand).length > 0;
    });
}

// Invariant (REN-253 F-3): a BIZ-3 clearance covers the payout basis that existed when
// it was recorded. A recalculation that changes any brand's payout authority, or the
// set of brands, revokes every unrevoked clearance of the cycle, so execution needs a
// fresh clearance of the new basis. The payout path has no transaction, so this runs
// before the new amounts are written: a failure in between leaves the old amounts
// without a clearance, never new amounts under an old clearance.
async function revokeClearancesForChangedPayoutBasis(cycleId: string, actorId: string) {
    const revoked = await financeComplianceQueries.revokeActivePayoutExecutionClearances(
        cycleId,
        actorId,
        "payout_basis_recalculated"
    );
    for (const row of revoked) {
        await writeFinanceAuditEvent({
            actorId,
            actionType: "payout_execution_clearance_revoked",
            entityType: "payout_execution_clearance",
            entityId: row.id,
            reason: "biz_3_clearance_revoked_by_recalculation",
            afterValue: {
                cycleId: row.cycleId,
                revokedBy: actorId,
                revokedAt: row.revokedAt,
                revocationReason: row.revocationReason,
            },
        });
    }
    return revoked.map((row) => row.id);
}

export async function calculatePayoutCycle(cycleId: string, actorId: string) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    assertPayoutCycleRecalculable(cycle);

    const { brands: summaries, eligibilityDiagnostics } =
        await buildBrandPayoutSummaries(cycleId);
    const previousBrands = getCycleBrands(cycle);
    const basisChanged = payoutBasisChanged(previousBrands, summaries);
    const invalidatedApprovals = invalidateChangedBrandApprovals(previousBrands, summaries);
    const revokedClearanceIds = basisChanged
        ? await revokeClearancesForChangedPayoutBasis(cycleId, actorId)
        : [];
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

    // The conditional summary write comes first: if the cycle moved on (approved, claimed)
    // while this recalculation ran, nothing is overwritten, line items included.
    const updated = await persistCycleSummary({
        cycleId,
        actorId,
        status: "calculated",
        brands: summaries,
        eligibilityDiagnostics,
        previousSummary: cycle.calculationSummary as CycleCalculationSummary | undefined,
        calculatedBy: actorId,
        condition: { statusIn: RECALCULABLE_PAYOUT_CYCLE_STATUSES },
    });
    await financeComplianceQueries.replacePayoutLineItems(cycleId, lineItems);

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
            invalidatedApprovals,
            revokedClearanceIds,
        },
    });

    return updated;
}

// A cycle that is failed, processing or completed has been through execution. Money
// may have moved, so the ordinary approval action must never make it payable again
// (REN-253 F-4). Any retry needs its own explicit, audited action.
const APPROVABLE_PAYOUT_CYCLE_STATUSES = ["draft", "calculated", "approved"];

function assertPayoutCycleApprovable(cycle: { status: string }) {
    if (!APPROVABLE_PAYOUT_CYCLE_STATUSES.includes(cycle.status)) {
        throw new Error(
            `Payout cycle approval blocked: cycle status is ${cycle.status}.`
        );
    }
}

export async function approvePayoutCycle(
    cycleId: string,
    actorId: string,
    brandId: string | undefined,
    expectedBasis: string
) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    assertPayoutCycleApprovable(cycle);

    const brands = getCycleBrands(cycle).map((brand) => ({ ...brand }));
    if (!brands.length) throw new Error("Run calculation before approval.");

    // G-4: the approver names the basis shown on the screen; an approval of a basis that
    // has since changed is refused.
    const currentBasis = computePayoutBasisFingerprint(cycle.id, brands);
    assertExpectedBasis(expectedBasis, currentBasis, "approval");

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
        previousSummary: cycle.calculationSummary as CycleCalculationSummary | undefined,
        approvedBy: actorId,
        // G-5: the write applies only if no recalculation replaced the summary meanwhile.
        condition: {
            statusIn: APPROVABLE_PAYOUT_CYCLE_STATUSES,
            basisFingerprint: currentBasis,
        },
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

const PAYOUT_SOURCE_ACCOUNT_ENV = "RAZORPAY_PAYOUT_SOURCE_ACCOUNT_NUMBER";

// Invariant (REN-253 F-5, EDR-0001): a payout is never recorded as sent when no provider
// money movement happened. A missing source account is a configuration refusal raised
// before any state change; it is not a failed payout and never a "completed" one.
export class PayoutConfigurationError extends Error {
    constructor(readonly missing: string[]) {
        super(`Payout execution blocked: ${missing.join(", ")} is not configured.`);
        this.name = "PayoutConfigurationError";
    }
}

function getPayoutSourceAccount() {
    const value = process.env[PAYOUT_SOURCE_ACCOUNT_ENV]?.trim();
    return value ? value : null;
}

// A brand payout that was already sent (or is in flight) is never re-sent (AQ-60).
function isBrandPayoutAlreadySent(brand: BrandCycleSummary) {
    return (
        ["completed", "awaiting_manual_confirmation", "processing", "submitted"].includes(
            brand.executionStatus
        ) || Boolean(brand.transactionId)
    );
}

async function createRazorpayPayout(input: {
    amountPaise: number;
    brandName: string;
    bankAccountHolderName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    reference: string;
    rzpAccountId?: string | null;
    idempotencyKey: string;
}) {
    const sourceAccount = getPayoutSourceAccount();
    if (!sourceAccount) {
        throw new PayoutConfigurationError([PAYOUT_SOURCE_ACCOUNT_ENV]);
    }

    const auth = Buffer.from(
        `${process.env.RAZOR_PAY_KEY_ID}:${process.env.RAZOR_PAY_SECRET_KEY}`
    ).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/payouts", {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            "X-Payout-Idempotency": input.idempotencyKey,
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
    }).catch((error: unknown) => {
        // A network error or timeout does not tell whether the payout was created.
        throw new PayoutProviderUnknownOutcomeError(
            `request error (${error instanceof Error ? error.message : "unknown"})`
        );
    });

    if (!response.ok) {
        // 4xx: the provider refused the request, nothing was paid. 408/409 and 5xx can
        // mean the payout exists or is in progress, so they are unknown.
        if (response.status >= 400 && response.status < 500 && ![408, 409].includes(response.status)) {
            throw new PayoutProviderRejectedError(response.status);
        }
        throw new PayoutProviderUnknownOutcomeError(`HTTP ${response.status}`);
    }

    let body: Record<string, unknown>;
    try {
        body = (await response.json()) as Record<string, unknown>;
    } catch {
        throw new PayoutProviderUnknownOutcomeError("unreadable response body");
    }
    // Accepted means a provider payout id exists; without one the payout has no identity.
    if (typeof body?.id !== "string" || !body.id.trim()) {
        throw new PayoutProviderUnknownOutcomeError("response without a payout id");
    }
    return body;
}

function buildExecutionGateChecks(
    cycle: { id: string; calculationSummary?: Record<string, unknown> | null },
    clearance: {
        metadata?: Record<string, unknown> | null;
        clearedBy: string;
        evidenceReference: string;
        transactionValidationReference: string;
        transactionValidatedAt: Date;
        clearedAt: Date;
        expiresAt: Date | null;
        revokedAt: Date | null;
    } | null,
    executedBy: string
) {
    const summary = cycle.calculationSummary as CycleCalculationSummary | undefined;
    const brands = summary?.brands ?? [];
    const lineItems = brands.flatMap((brand) => brand.lineItems);
    const controlEvidence = summary?.controlEvidence;

    return {
        commissionValidation:
            brands.length > 0 &&
            lineItems.every((line) => line.lineType !== "commission_blocked") &&
            controlEvidence?.commissionValidation === "REN-203",
        eligibilityGating:
            Array.isArray(summary?.eligibilityDiagnostics) &&
            controlEvidence?.eligibilityGating === "REN-204",
        paymentStateGating:
            Array.isArray(summary?.eligibilityDiagnostics) &&
            controlEvidence?.paymentStateGating === "REN-204",
        holdbackSuspension:
            brands.length > 0 &&
            brands.every(
                (brand) =>
                    (brand.metadata.holdbackPolicy as Record<string, unknown> | undefined)
                        ?.suspended === true &&
                    (brand.metadata.holdbackPolicy as Record<string, unknown> | undefined)
                        ?.authority === "BIZ-15" &&
                    controlEvidence?.holdbackSuspension === "BIZ-15"
            ),
        realTransactionValidation:
            Boolean(
                clearance?.transactionValidationReference &&
                    clearance.transactionValidatedAt
            ),
        humanClearance: clearance
            ? {
                  clearedBy: clearance.clearedBy,
                  evidenceReference: clearance.evidenceReference,
                  clearedAt: clearance.clearedAt,
                  expiresAt: clearance.expiresAt,
                  revokedAt: clearance.revokedAt,
              }
            : null,
        clearanceBasis: clearance
            ? {
                  clearance:
                      (clearance.metadata?.basisFingerprint as string | undefined) ?? null,
                  current: computePayoutBasisFingerprint(cycle.id, brands),
              }
            : null,
        executedBy,
    };
}

async function evaluateAndAuditPayoutExecutionGate(
    cycle: { id: string; calculationSummary?: Record<string, unknown> | null },
    actorId: string,
    clearance: Awaited<
        ReturnType<typeof financeComplianceQueries.getActivePayoutExecutionClearance>
    >
) {
    const result = evaluatePayoutExecutionGate(
        buildExecutionGateChecks(cycle, clearance, actorId),
        new Date()
    );
    await writeFinanceAuditEvent({
        actorId,
        actionType: "payout_execution_gate_evaluated",
        entityType: "payout_cycle",
        entityId: cycle.id,
        reason: result.allowed ? "gate_passed" : "gate_blocked",
        afterValue: {
            allowed: result.allowed,
            reasons: result.reasons,
        },
        metadata: {
            cycleId: cycle.id,
            checks: buildExecutionGateChecks(cycle, clearance, actorId),
        },
    });
    return result;
}

export async function recordPayoutExecutionClearance(
    input: PayoutExecutionClearanceInput
) {
    const cycle = await financeComplianceQueries.getPayoutCycle(input.cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    if (!["calculated", "approved"].includes(cycle.status)) {
        throw new Error("Clearance can only be recorded before payout execution.");
    }
    const clearedBrands = getCycleBrands(cycle);
    if (!clearedBrands.length) throw new Error("Run calculation before clearance.");
    // G-1/G-2/G-4: a clearance is recorded for the basis the clearer was shown, and it
    // stores that basis, so a later change of the basis can never execute under it.
    const basisFingerprint = computePayoutBasisFingerprint(cycle.id, clearedBrands);
    assertExpectedBasis(input.expectedBasis, basisFingerprint, "clearance");
    if (!input.evidenceReference.trim() || !input.transactionValidationReference.trim()) {
        throw new Error("Clearance evidence and transaction validation references are required.");
    }
    const now = new Date();
    if (input.transactionValidatedAt > now) {
        throw new Error("Transaction validation cannot be dated in the future.");
    }
    if (input.expiresAt && input.expiresAt <= now) {
        throw new Error("Clearance expiry must be in the future.");
    }
    const row = await financeComplianceQueries.createPayoutExecutionClearance({
        cycleId: input.cycleId,
        clearedBy: input.actorId,
        evidenceReference: input.evidenceReference.trim(),
        transactionValidationReference: input.transactionValidationReference.trim(),
        transactionValidatedAt: input.transactionValidatedAt,
        expiresAt: input.expiresAt ?? null,
        metadata: { basisFingerprint, basisVersion: "renivet-payout-basis-v1" },
    });
    await writeFinanceAuditEvent({
        actorId: input.actorId,
        actionType: "payout_execution_clearance_recorded",
        entityType: "payout_execution_clearance",
        entityId: row.id,
        reason: "biz_3_clearance_recorded",
        afterValue: {
            cycleId: row.cycleId,
            clearedBy: row.clearedBy,
            evidenceReference: row.evidenceReference,
            transactionValidationReference: row.transactionValidationReference,
            transactionValidatedAt: row.transactionValidatedAt,
            expiresAt: row.expiresAt,
            basisFingerprint,
        },
    });
    return row;
}

export async function revokePayoutExecutionClearance(
    clearanceId: string,
    actorId: string,
    reason: string
) {
    if (!reason.trim()) throw new Error("Clearance revocation reason is required.");
    const row = await financeComplianceQueries.revokePayoutExecutionClearance(
        clearanceId,
        actorId,
        reason.trim()
    );
    if (!row) throw new Error("Payout execution clearance not found.");
    await writeFinanceAuditEvent({
        actorId,
        actionType: "payout_execution_clearance_revoked",
        entityType: "payout_execution_clearance",
        entityId: row.id,
        reason: "biz_3_clearance_revoked",
        afterValue: {
            cycleId: row.cycleId,
            revokedBy: actorId,
            revokedAt: row.revokedAt,
            revocationReason: row.revocationReason,
        },
    });
    return row;
}

function assertExpectedBasis(expectedBasis: string, currentBasis: string, action: string) {
    if (!expectedBasis || expectedBasis !== currentBasis) {
        throw new PayoutCycleConflictError(
            `Payout ${action} blocked: the payout basis changed since this screen was loaded. Reload the cycle and review it again.`
        );
    }
}

type LivePayeeRow = Awaited<
    ReturnType<typeof financeComplianceQueries.listBrandsForPayout>
>[number];

// Invariant (REN-253 G-8): money moves only to a payee that is verified NOW and is the
// payee that was approved. This reads the current brand/payee record, not the
// calculation-time snapshot. Reasons name fields, never values.
function getPayeeIneligibilityReasons(
    brand: BrandCycleSummary,
    live: LivePayeeRow | undefined
) {
    if (!live) return ["brand_not_active_or_missing"];
    const reasons: string[] = [];
    if (live.confidentialVerificationStatus !== "approved") {
        reasons.push(`payee_not_verified:${live.confidentialVerificationStatus ?? "unknown"}`);
    }
    const livePayoutMethod =
        live.payoutMethod === "razorpay_route" ? "razorpay_route" : "manual_neft";
    if (livePayoutMethod !== brand.payoutMethod) reasons.push("payout_method_changed");
    const approved = brand.metadata ?? {};
    const changedBankFields = [
        ["bankAccountNumber", live.bankAccountNumber],
        ["bankIfscCode", live.bankIfscCode],
        ["bankAccountHolderName", live.bankAccountHolderName],
    ].filter(([field, value]) => (value ?? null) !== (approved[field as string] ?? null));
    if (changedBankFields.length) {
        reasons.push(`bank_details_changed:${changedBankFields.map(([field]) => field).join(",")}`);
    }
    return reasons;
}

async function getPayeeIneligibility(brands: BrandCycleSummary[]) {
    const liveRows = await financeComplianceQueries.listBrandsForPayout();
    return brands
        .map((brand) => ({
            brand,
            reasons: getPayeeIneligibilityReasons(
                brand,
                liveRows.find((row) => row.brandId === brand.brandId)
            ),
        }))
        .filter((item) => item.reasons.length > 0);
}

// Post-acceptance work is bookkeeping: it can never change the money-movement outcome.
// A failure is logged and recorded on the brand as pending bookkeeping, then execution
// carries on (REN-253 N-2, ARC-ENT-017 AR-16).
async function runPostPaymentBookkeeping(
    brand: BrandCycleSummary,
    step: string,
    work: () => Promise<unknown>
) {
    try {
        await work();
    } catch (error) {
        console.error(`Payout bookkeeping failed after provider acceptance (${step}).`, {
            brandId: brand.brandId,
            transactionId: brand.transactionId,
            error: error instanceof Error ? error.message : "unknown",
        });
        const pending = Array.isArray(brand.metadata?.bookkeepingPending)
            ? (brand.metadata.bookkeepingPending as Array<Record<string, unknown>>)
            : [];
        brand.metadata = {
            ...brand.metadata,
            bookkeepingPending: [
                ...pending,
                {
                    step,
                    at: new Date().toISOString(),
                    message: error instanceof Error ? error.message : "unknown",
                },
            ],
        };
        return false;
    }
    return true;
}

export async function executePayoutCycle(
    cycleId: string,
    actorId: string,
    brandId: string | undefined,
    expectedBasis: string
) {
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");

    const readBrands = getCycleBrands(cycle).map((brand) => ({ ...brand }));
    if (!readBrands.length) throw new Error("Run calculation before execution.");

    if (cycle.status !== "approved") {
        throw new Error(`Payout execution blocked: cycle status is ${cycle.status}.`);
    }

    // Stale-screen rejection (REN-253 G-4): the caller must name the basis it was shown.
    const currentBasis = computePayoutBasisFingerprint(cycle.id, readBrands);
    assertExpectedBasis(expectedBasis, currentBasis, "execution");

    const clearance = await financeComplianceQueries.getActivePayoutExecutionClearance(
        cycleId
    );
    const gate = await evaluateAndAuditPayoutExecutionGate(
        cycle,
        actorId,
        clearance
    );
    if (!gate.allowed) {
        throw new Error(
            `Payout execution blocked: ${gate.reasons
                .map((reason) => `${reason.code} — ${reason.message}`)
                .join("; ")}`
        );
    }

    const scopedBrands = readBrands.filter((brand) => !brandId || brand.brandId === brandId);
    for (const brand of scopedBrands) {
        if (brand.reviewStatus !== "approved") {
            throw new Error(`Approve payout for ${brand.brandName} before execution.`);
        }
    }
    const brandsToSend = scopedBrands.filter((brand) => !isBrandPayoutAlreadySent(brand));
    const brandsNeedingProvider = brandsToSend.filter(
        (brand) => brand.netPayablePaise > 0 && brand.payoutMethod === "razorpay_route"
    );

    // Configuration pre-flight (F-5): refuse before any state change when a brand that
    // would be sent through the provider has no payout source account configured.
    if (brandsNeedingProvider.length > 0 && !getPayoutSourceAccount()) {
        await writeFinanceAuditEvent({
            actorId,
            actionType: "payout_execution_blocked_unconfigured",
            entityType: "payout_cycle",
            entityId: cycleId,
            reason: "payout_source_account_not_configured",
            afterValue: {
                cycleId,
                missing: [PAYOUT_SOURCE_ACCOUNT_ENV],
                brandIds: brandsNeedingProvider.map((brand) => brand.brandId),
            },
            metadata: { cycleId },
        });
        throw new PayoutConfigurationError([PAYOUT_SOURCE_ACCOUNT_ENV]);
    }

    // Payee pre-flight (G-8): current verification state and payee details.
    const ineligibleBeforeClaim = await getPayeeIneligibility(
        brandsToSend.filter((brand) => brand.netPayablePaise > 0)
    );
    if (ineligibleBeforeClaim.length > 0) {
        await writeFinanceAuditEvent({
            actorId,
            actionType: "payout_execution_blocked_payee_ineligible",
            entityType: "payout_cycle",
            entityId: cycleId,
            reason: "payee_not_eligible_at_execution",
            afterValue: {
                cycleId,
                brands: ineligibleBeforeClaim.map((item) => ({
                    brandId: item.brand.brandId,
                    reasons: item.reasons,
                })),
            },
            metadata: { cycleId },
        });
        throw new Error(
            `Payout execution blocked: payee is not eligible at execution for ${ineligibleBeforeClaim
                .map((item) => `${item.brand.brandName} (${item.reasons.join("; ")})`)
                .join(", ")}.`
        );
    }

    // Cross-cycle guard (N-2): the same orders must not be paid, in flight or unresolved
    // in another cycle (also covers two cycles calculated before either was executed).
    const priorBlocks = findPriorPayoutBlocks(
        await financeComplianceQueries.listAllPayoutCycles(),
        cycleId
    );
    const overlapping = brandsToSend.filter((brand) =>
        brand.lineItems.some(
            (line) =>
                line.lineType === "sale" &&
                line.referenceId &&
                priorBlocks.has(`${brand.brandId}:${line.referenceId}`)
        )
    );
    if (overlapping.length > 0) {
        await writeFinanceAuditEvent({
            actorId,
            actionType: "payout_execution_blocked_prior_payout",
            entityType: "payout_cycle",
            entityId: cycleId,
            reason: "orders_already_paid_in_flight_or_unresolved_in_another_cycle",
            afterValue: { cycleId, brandIds: overlapping.map((brand) => brand.brandId) },
            metadata: { cycleId },
        });
        throw new Error(
            `Payout execution blocked: orders of ${overlapping
                .map((brand) => brand.brandName)
                .join(", ")} are already paid, in flight or unresolved in another cycle.`
        );
    }

    // Atomic execution claim (REN-253 C-1/C-2): one conditional UPDATE moves the cycle
    // approved -> processing only if it is still approved and still carries the basis that
    // was cleared. Only the claim holder may reach the provider. This is application
    // concurrency control; provider idempotency is a separate, unverified control.
    const claimed = await financeComplianceQueries.updatePayoutCycleIf(
        cycleId,
        { statusIn: ["approved"], basisFingerprint: currentBasis },
        { status: "processing", executedBy: actorId }
    );
    if (!claimed) {
        throw new PayoutCycleConflictError(
            "Payout execution blocked: the cycle was already claimed by another execution, or its basis or status changed since it was read."
        );
    }

    const brands = getCycleBrands(claimed).map((brand) => ({ ...brand }));
    const executions: Array<Record<string, unknown>> = [];
    const persistWhileClaimed = () =>
        persistCycleSummary({
            cycleId,
            actorId,
            status: "processing",
            brands,
            previousSummary: claimed.calculationSummary as CycleCalculationSummary | undefined,
            executedBy: actorId,
            executions,
            condition: { statusIn: ["processing"] },
            applyTds: false,
        });

    for (const brand of brands) {
        if (brandId && brand.brandId !== brandId) continue;
        if (isBrandPayoutAlreadySent(brand)) continue;

        const metadata = brand.metadata ?? {};

        if (brand.netPayablePaise <= 0) {
            brand.executionStatus = "skipped";
            executions.push({
                brandId: brand.brandId,
                status: "skipped",
                reason: "non_positive_net_payable",
            });
            continue;
        }

        if (brand.payoutMethod !== "razorpay_route") {
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
            continue;
        }

        // G-8 at the final boundary: re-read the current payee immediately before the call.
        const [stillIneligible] = await getPayeeIneligibility([brand]);
        if (stillIneligible) {
            executions.push({
                brandId: brand.brandId,
                status: "blocked",
                reason: "payee_not_eligible_at_execution",
                details: stillIneligible.reasons,
            });
            continue;
        }

        const reference = `${cycle.cycleKey}-${brand.brandId}`;
        const idempotencyKey = buildPayoutIdempotencyKey(cycleId, brand.brandId);

        // Durable intent BEFORE the provider call: a crash after the provider accepts
        // leaves this brand `processing` in the database, i.e. unresolved, never unpaid.
        brand.executionStatus = "processing";
        brand.metadata = {
            ...metadata,
            providerCall: {
                state: "started",
                idempotencyKey,
                reference,
                startedAt: new Date().toISOString(),
            },
        };
        await persistWhileClaimed();

        let payout: Record<string, unknown>;
        try {
            payout = await createRazorpayPayout({
                amountPaise: brand.netPayablePaise,
                brandName: brand.brandName,
                bankAccountHolderName: String(metadata.bankAccountHolderName ?? ""),
                bankAccountNumber: String(metadata.bankAccountNumber ?? ""),
                bankIfscCode: String(metadata.bankIfscCode ?? ""),
                reference,
                rzpAccountId: String(metadata.rzpAccountId ?? ""),
                idempotencyKey,
            });
        } catch (error) {
            if (error instanceof PayoutProviderRejectedError) {
                // The provider refused the request: definitely not paid.
                brand.executionStatus = "failed";
                brand.metadata = {
                    ...brand.metadata,
                    providerOutcome: "rejected",
                    providerStatus: error.status,
                };
                executions.push({
                    brandId: brand.brandId,
                    status: "failed",
                    mode: "razorpay_route",
                    outcome: "rejected",
                    reason: error.message,
                });
                await persistWhileClaimed();
                await runPostPaymentBookkeeping(brand, "failure_alert", () =>
                    auditAndAlert({
                        actorId,
                        actionType: "brand_payout_failed",
                        entityType: "brand_payout",
                        entityId: brand.brandId,
                        afterValue: { brandId: brand.brandId, outcome: "rejected" },
                        reason: "razorpay_route_execution_rejected",
                        title: "Payout rejected by the provider",
                        message: `Payout rejected for ${brand.brandName}: ${error.message}`,
                        severity: "critical",
                        ownerRole: "finance_admin",
                        type: "brand_payout_failed",
                        dedupeKey: `brand-payout:${cycleId}:${brand.brandId}:failed`,
                        channels: ["admin", "email"],
                        metadata: { module: "finance_compliance", cycleId, brandId: brand.brandId },
                    })
                );
                continue;
            }
            if (error instanceof PayoutProviderUnknownOutcomeError) {
                // The payout may exist at the provider: unresolved, never re-sent, not "failed".
                brand.executionStatus = "processing";
                brand.metadata = {
                    ...brand.metadata,
                    providerOutcome: "unknown",
                    unresolvedReason: error.reason,
                };
                executions.push({
                    brandId: brand.brandId,
                    status: "unknown_outcome",
                    mode: "razorpay_route",
                    reason: error.message,
                });
                try {
                    await persistWhileClaimed();
                } catch (persistError) {
                    console.error("Could not record an unknown payout outcome.", {
                        cycleId,
                        brandId: brand.brandId,
                        error: persistError instanceof Error ? persistError.message : "unknown",
                    });
                }
                await runPostPaymentBookkeeping(brand, "unresolved_alert", () =>
                    auditAndAlert({
                        actorId,
                        actionType: "brand_payout_unresolved",
                        entityType: "brand_payout",
                        entityId: brand.brandId,
                        afterValue: { brandId: brand.brandId, outcome: "unknown" },
                        reason: "razorpay_route_outcome_unknown",
                        title: "Payout outcome unknown",
                        message: `The payout for ${brand.brandName} may or may not have reached the provider; it is unresolved and must be reconciled before any further execution.`,
                        severity: "critical",
                        ownerRole: "finance_admin",
                        type: "brand_payout_unresolved",
                        dedupeKey: `brand-payout:${cycleId}:${brand.brandId}:unresolved`,
                        channels: ["admin", "email"],
                        metadata: { module: "finance_compliance", cycleId, brandId: brand.brandId },
                    })
                );
                // Do not compound an uncertain provider state with further calls.
                executions.push({ status: "halted_after_unknown_outcome" });
                break;
            }
            // Anything else was raised before the provider was contacted (including a
            // configuration refusal): nothing was sent, so the brand returns to approved.
            brand.executionStatus = "approved";
            const { providerCall: _notSent, ...withoutCall } = (brand.metadata ?? {}) as Record<
                string,
                unknown
            >;
            brand.metadata = withoutCall;
            try {
                await persistWhileClaimed();
            } catch {
                // the durable intent stays `processing`: unresolved, which is the safe state
            }
            throw error;
        }

        // Provider accepted: the money-movement fact is recorded first and on its own.
        const transactionId = String(payout.id);
        brand.executionStatus = "completed";
        brand.transactionId = transactionId;
        brand.statementUrl = `/api/finance/payouts/${cycleId}/statement/${brand.brandId}`;
        brand.metadata = {
            ...brand.metadata,
            providerOutcome: "accepted",
            providerCall: {
                ...((brand.metadata?.providerCall as Record<string, unknown>) ?? {}),
                state: "accepted",
            },
        };
        executions.push({
            brandId: brand.brandId,
            status: "submitted",
            mode: "razorpay_route",
            payout,
        });
        try {
            await persistWhileClaimed();
        } catch (persistError) {
            console.error("Provider accepted a payout but the local record failed.", {
                cycleId,
                brandId: brand.brandId,
                transactionId,
                error: persistError instanceof Error ? persistError.message : "unknown",
            });
            // Do not invent success or failure and do not retry: the durable pre-call
            // state (`processing`) already marks this brand unresolved.
            throw new PayoutPersistenceAfterAcceptanceError(cycleId, brand.brandId, transactionId);
        }

        // Bookkeeping: failures are recorded, never reclassify the payout.
        await runPostPaymentBookkeeping(brand, "executed_alert", () =>
            auditAndAlert({
                actorId,
                actionType: "brand_payout_executed",
                entityType: "brand_payout",
                entityId: brand.brandId,
                afterValue: {
                    brandId: brand.brandId,
                    transactionId,
                    netPayablePaise: brand.netPayablePaise,
                },
                reason: "razorpay_route_execution",
                title: "Brand payout executed",
                message: `Payout of ${(brand.netPayablePaise / 100).toFixed(2)} processed for ${brand.brandName}.`,
                severity: "info",
                ownerRole: "finance_admin",
                type: "brand_payout_executed",
                dedupeKey: `brand-payout:${cycleId}:${brand.brandId}:executed`,
                channels: ["admin", "email", "whatsapp"],
                metadata: { module: "finance_compliance", cycleId, brandId: brand.brandId },
            })
        );
        if (brand.tdsPaise > 0) {
            await runPostPaymentBookkeeping(brand, "tds_audit", () =>
                writeFinanceAuditEvent({
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
                    metadata: { cycleId, brandId: brand.brandId },
                })
            );
        }
        await runPostPaymentBookkeeping(brand, "tds_ledger", () =>
            applyTdsLedger([brand], claimed)
        );
        if (Array.isArray(brand.metadata?.bookkeepingPending)) {
            try {
                await persistWhileClaimed();
            } catch {
                // the marker is also carried by the final write
            }
        }
    }

    const updated = await persistCycleSummary({
        cycleId,
        actorId,
        status: deriveCycleStatus(brands) as "approved" | "calculated" | "processing" | "completed" | "failed",
        brands,
        previousSummary: cycle.calculationSummary as CycleCalculationSummary | undefined,
        executedBy: actorId,
        executions,
        condition: { statusIn: ["processing"] },
        applyTds: false,
    });
    for (const brand of brands) {
        if (brand.transactionId || brand.executionStatus === "skipped") {
            await runPostPaymentBookkeeping(brand, "tds_ledger_final", () =>
                applyTdsLedger([brand], updated)
            );
        }
    }

    try {
        await auditAndAlert({
            actorId,
            actionType: brandId ? "brand_payout_execution_started" : "payout_cycle_executed",
            entityType: brandId ? "brand_payout" : "payout_cycle",
            entityId: brandId ?? cycleId,
            beforeValue: { cycleId, status: cycle.status },
            afterValue: { cycleId, status: updated.status },
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
            metadata: { module: "finance_compliance", cycleId, brandId },
        });
    } catch (error) {
        // Post-effect audit: the execution outcome is already persisted and must not be
        // reported as a failure because this write failed.
        console.error("Payout execution summary alert failed.", {
            cycleId,
            error: error instanceof Error ? error.message : "unknown",
        });
    }

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
        previousSummary: cycle.calculationSummary as CycleCalculationSummary | undefined,
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
}) {
    if (!input.notes.trim()) {
        throw new Error("Override notes are required.");
    }
    if (!input.proofFileUrl) {
        throw new Error("Override proof is required.");
    }
    // Invariant (REN-253 F-2, EDR-0001): the maker never supplies the checker. An
    // override is stored unapproved and only approvePayoutOverride, run by a different
    // authenticated admin, applies it. A locked cycle rejects the override up front.
    const cycle = await financeComplianceQueries.getPayoutCycle(input.cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    assertPayoutCycleRecalculable(cycle);

    const row = await financeComplianceQueries.addPayoutOverride({
        cycleId: input.cycleId,
        brandId: input.brandId,
        adjustmentType: input.adjustmentType,
        amountPaise: input.amountPaise,
        reasonCode: input.reasonCode,
        notes: input.notes,
        proofFileUrl: input.proofFileUrl,
        createdBy: input.actorId,
        approvedBy: null,
    });

    await auditAndAlert({
        actorId: input.actorId,
        actionType: "payout_override_created",
        entityType: "brand_payout_override",
        entityId: row.id,
        afterValue: row as unknown as Record<string, unknown>,
        reason: input.reasonCode,
        title: "Payout override recorded",
        message: `Override recorded for brand ${input.brandId}; a second admin must approve it before it applies.`,
        severity: "warning",
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

    return row;
}

export async function approvePayoutOverride(overrideId: string, actorId: string) {
    const row = await financeComplianceQueries.getPayoutOverride(overrideId);
    if (!row) throw new Error("Payout override not found.");
    if (row.createdBy === actorId) {
        throw new Error("The same admin cannot approve this override.");
    }
    if (row.approvedBy) {
        throw new Error("This override is already approved.");
    }
    const cycle = await financeComplianceQueries.getPayoutCycle(row.cycleId);
    if (!cycle) throw new Error("Payout cycle not found.");
    assertPayoutCycleRecalculable(cycle);

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
