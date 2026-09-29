import type { GrievanceIdentityResolution } from "./identity";

export type GuestGrievanceResolution =
    | { kind: "link_existing"; userId: string }
    | { kind: "consent_required" }
    | { kind: "create_claim" }
    | { kind: "support_review" };

export function decideGuestGrievanceResolution(
    resolution: GrievanceIdentityResolution,
    accountCreationConsent: boolean
): GuestGrievanceResolution {
    if (resolution.kind === "exact_match") {
        return { kind: "link_existing", userId: resolution.userId };
    }
    if (resolution.kind === "conflict") return { kind: "support_review" };
    return accountCreationConsent
        ? { kind: "create_claim" }
        : { kind: "consent_required" };
}
