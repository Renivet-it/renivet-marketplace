import {
    commissionRuleDatesOverlap,
    commissionRuleScopesOverlap,
    resolveCommissionRuleFromCandidates,
    type CommissionRuleCandidate,
} from "./payout-commission";

export type CommissionRuleAdminCandidate = Omit<CommissionRuleCandidate, "id"> & {
    id?: string;
    isActive?: boolean;
};

type PreviewConflict = CommissionRuleAdminCandidate & {
    reason: "exact_scope_overlap" | "different_scope_overlap";
};

export type CommissionRulePreview = {
    kind: "none" | "conflict" | "ambiguous";
    conflicts: PreviewConflict[];
    winner: CommissionRuleAdminCandidate | null;
    fallback: CommissionRuleAdminCandidate | null;
};

function sameScope(
    left: Pick<CommissionRuleCandidate, "brandId" | "categoryId" | "productTypeId">,
    right: Pick<CommissionRuleCandidate, "brandId" | "categoryId" | "productTypeId">
) {
    return (
        left.brandId === right.brandId &&
        left.categoryId === right.categoryId &&
        left.productTypeId === right.productTypeId
    );
}

export function analyzeCommissionRulePreview(input: {
    candidate: CommissionRuleAdminCandidate;
    rules: CommissionRuleAdminCandidate[];
    targetDate?: Date;
}): CommissionRulePreview {
    const candidate = {
        ...input.candidate,
        id: input.candidate.id ?? "__candidate__",
    } satisfies CommissionRuleAdminCandidate;
    const activeRules = input.rules.filter(
        (rule) => rule.isActive !== false && rule.id !== input.candidate.id
    );
    const conflicts = activeRules
        .filter(
            (rule) =>
                commissionRuleScopesOverlap(candidate, rule) &&
                commissionRuleDatesOverlap(candidate, rule)
        )
        .map((rule) => ({
            ...rule,
            reason: sameScope(candidate, rule)
                ? ("exact_scope_overlap" as const)
                : ("different_scope_overlap" as const),
        }));

    if (conflicts.some((rule) => rule.reason === "exact_scope_overlap")) {
        return { kind: "conflict", conflicts, winner: null, fallback: null };
    }

    const targetDate =
        input.targetDate ??
        new Date(candidate.effectiveFrom ?? new Date().toISOString());
    const representative = conflicts.find((rule) => rule.brandId)?.brandId;
    const winner = resolveCommissionRuleFromCandidates({
        brandId: candidate.brandId ?? representative ?? "__preview_brand__",
        categoryId: candidate.categoryId ?? conflicts[0]?.categoryId,
        productTypeId: candidate.productTypeId ?? conflicts[0]?.productTypeId,
        targetDate,
        rules: [candidate, ...activeRules].map((rule, index) => ({
            ...rule,
            id: rule.id ?? `__candidate_${index}__`,
        })),
    }) as CommissionRuleAdminCandidate | null;

    const existingWinner = conflicts.length
        ? winner
        : (resolveCommissionRuleFromCandidates({
              brandId: candidate.brandId ?? "__preview_brand__",
              categoryId: candidate.categoryId,
              productTypeId: candidate.productTypeId,
              targetDate,
              rules: activeRules.map((rule, index) => ({
                  ...rule,
                  id: rule.id ?? `__existing_${index}__`,
              })),
          }) as CommissionRuleAdminCandidate | null);

    return {
        kind: conflicts.length ? "ambiguous" : "none",
        conflicts,
        winner: existingWinner,
        fallback: existingWinner ? null : null,
    };
}
