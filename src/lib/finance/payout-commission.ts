export type CommissionRuleCandidate = {
    id: string;
    brandId: string | null;
    categoryId: string | null;
    productTypeId: string | null;
    commissionPercentBps: number;
    holdbackPercentBps: number;
    ruleName: string;
    priority: number;
    effectiveFrom: string | null;
    effectiveTo: string | null;
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

function getRuleSpecificityScore(input: {
    brandId?: string | null;
    categoryId?: string | null;
    productTypeId?: string | null;
}) {
    return [input.brandId, input.categoryId, input.productTypeId].filter(Boolean).length;
}

export function calculateCommissionPaise(
    grossItemPaise: number,
    commissionPercentBps: number
) {
    if (!Number.isInteger(commissionPercentBps) || commissionPercentBps < 0 || commissionPercentBps > 10_000) {
        throw new Error("Invalid commission rate: expected 0..10000 basis points.");
    }

    return Math.round(grossItemPaise * (commissionPercentBps / 10_000));
}

export function resolveCommissionRuleFromCandidates(input: {
    brandId: string;
    categoryId?: string | null;
    productTypeId?: string | null;
    targetDate: Date;
    rules: CommissionRuleCandidate[];
}) {
    const matching = input.rules.filter((rule) => {
        if (!Number.isInteger(rule.commissionPercentBps) || rule.commissionPercentBps < 0 || rule.commissionPercentBps > 10_000) {
            return false;
        }
        if (!isRuleEffective(rule.effectiveFrom, rule.effectiveTo, input.targetDate)) {
            return false;
        }
        const brandOk = !rule.brandId || rule.brandId === input.brandId;
        const categoryOk = !rule.categoryId || rule.categoryId === input.categoryId;
        const productTypeOk = !rule.productTypeId || rule.productTypeId === input.productTypeId;
        return brandOk && categoryOk && productTypeOk;
    });

    return (
        matching.sort((left, right) => {
            if (right.priority !== left.priority) return right.priority - left.priority;
            return (
                getRuleSpecificityScore(right) - getRuleSpecificityScore(left) ||
                right.id.localeCompare(left.id)
            );
        })[0] ?? null
    );
}
