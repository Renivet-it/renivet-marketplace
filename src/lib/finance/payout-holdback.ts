export const BIZ_15_HOLDBACK_SUSPENDED = true;

type HoldbackOptions = {
    suspended?: boolean;
};

export function calculateHoldbackPaise(
    basePaise: number,
    holdbackPercentBps?: number | null,
    options: HoldbackOptions = {}
) {
    if (options.suspended ?? BIZ_15_HOLDBACK_SUSPENDED) return 0;
    if (!holdbackPercentBps || holdbackPercentBps <= 0) return 0;
    return Math.max(0, Math.round(Math.max(basePaise, 0) * (holdbackPercentBps / 10_000)));
}

export function getHoldbackPolicyMetadata(options: HoldbackOptions = {}) {
    const suspended = options.suspended ?? BIZ_15_HOLDBACK_SUSPENDED;
    return {
        suspended,
        authority: suspended ? "BIZ-15" : "explicit_holdback_authorization",
        reason: suspended
            ? "unauthorized_holdback_suspended"
            : "holdback_explicitly_authorized",
    } as const;
}
