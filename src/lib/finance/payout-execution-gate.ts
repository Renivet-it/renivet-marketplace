export type HumanClearance = {
    clearedBy: string | null;
    evidenceReference: string | null;
    clearedAt: Date | string | null;
    expiresAt: Date | string | null;
    revokedAt: Date | string | null;
};

export type PayoutExecutionChecks = {
    commissionValidation: boolean;
    eligibilityGating: boolean;
    paymentStateGating: boolean;
    holdbackSuspension: boolean;
    realTransactionValidation: boolean;
    humanClearance: HumanClearance | null;
};

export type PayoutExecutionGateResult = {
    allowed: boolean;
    reasons: Array<{ code: string; message: string }>;
};

const technicalChecks = [
    [
        "commissionValidation",
        "commission_validation_failed",
        "Commission validation is not satisfied.",
    ],
    [
        "eligibilityGating",
        "eligibility_gating_failed",
        "Eligibility gating is not satisfied.",
    ],
    [
        "paymentStateGating",
        "payment_state_gating_failed",
        "Payment-state gating is not satisfied.",
    ],
    [
        "holdbackSuspension",
        "holdback_suspension_failed",
        "BIZ-15 holdback suspension is not satisfied.",
    ],
    [
        "realTransactionValidation",
        "real_transaction_validation_missing",
        "Real-transaction validation is missing.",
    ],
] as const;

function toDate(value: Date | string | null) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function evaluatePayoutExecutionGate(
    checks: PayoutExecutionChecks,
    now = new Date()
): PayoutExecutionGateResult {
    const reasons: PayoutExecutionGateResult["reasons"] = [];

    for (const [key, code, message] of technicalChecks) {
        if (!checks[key]) reasons.push({ code, message });
    }

    const clearance = checks.humanClearance;
    if (!clearance) {
        reasons.push({
            code: "human_clearance_missing",
            message: "BIZ-3 human clearance is missing.",
        });
    } else if (
        !clearance.clearedBy?.trim() ||
        !clearance.evidenceReference?.trim() ||
        !toDate(clearance.clearedAt)
    ) {
        reasons.push({
            code: "human_clearance_invalid",
            message: "BIZ-3 human clearance is incomplete.",
        });
    } else if (clearance.revokedAt) {
        reasons.push({
            code: "human_clearance_revoked",
            message: "BIZ-3 human clearance is revoked.",
        });
    } else if ((toDate(clearance.expiresAt)?.getTime() ?? Infinity) <= now.getTime()) {
        reasons.push({
            code: "human_clearance_expired",
            message: "BIZ-3 human clearance is expired.",
        });
    }

    return { allowed: reasons.length === 0, reasons };
}

export function isPayoutOverrideApproved(input: {
    createdBy?: string | null;
    approvedBy?: string | null;
}) {
    return Boolean(
        input.approvedBy?.trim() &&
            input.createdBy?.trim() &&
            input.approvedBy !== input.createdBy
    );
}
