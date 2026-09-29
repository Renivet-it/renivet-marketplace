import { describe, expect, test } from "bun:test";
import { decideGuestGrievanceResolution } from "./guest-flow";

describe("guest grievance flow", () => {
    test("links an exact match without requiring account creation", () => {
        expect(
            decideGuestGrievanceResolution(
                { kind: "exact_match", userId: "user-1" },
                false
            )
        ).toEqual({ kind: "link_existing", userId: "user-1" });
    });

    test("requires consent before creating a no-match claim", () => {
        expect(
            decideGuestGrievanceResolution({ kind: "none" }, false)
        ).toEqual({ kind: "consent_required" });
        expect(
            decideGuestGrievanceResolution({ kind: "none" }, true)
        ).toEqual({ kind: "create_claim" });
    });

    test("routes conflicting identities for support review", () => {
        expect(
            decideGuestGrievanceResolution({ kind: "conflict" }, true)
        ).toEqual({ kind: "support_review" });
    });
});
