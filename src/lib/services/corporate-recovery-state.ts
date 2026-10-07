export type CorporateRecoveryState =
    | "completed"
    | "retrying"
    | "recovery_required"
    | "failed_closed";

export function resolveCorporateRecoveryState(params: {
    succeeded: boolean;
    retryable?: boolean;
}): CorporateRecoveryState {
    if (params.succeeded) return "completed";
    return params.retryable ? "recovery_required" : "failed_closed";
}
