import { describe, expect, test } from "bun:test";
import {
    BIZ_15_HOLDBACK_SUSPENDED,
    calculateHoldbackPaise,
    getHoldbackPolicyMetadata,
} from "./payout-holdback";

describe("REN-205 BIZ-15 holdback suspension", () => {
    test("suspends holdback for missing and configured values in the real path", () => {
        expect(BIZ_15_HOLDBACK_SUSPENDED).toBe(true);
        expect(calculateHoldbackPaise(100_000, null)).toBe(0);
        expect(calculateHoldbackPaise(100_000, 500)).toBe(0);
        expect(getHoldbackPolicyMetadata()).toEqual({
            suspended: true,
            authority: "BIZ-15",
            reason: "unauthorized_holdback_suspended",
        });
    });

    test("preserves the enabled arithmetic in an isolated test branch", () => {
        expect(calculateHoldbackPaise(100_000, 500, { suspended: false })).toBe(
            5_000
        );
        expect(calculateHoldbackPaise(100_000, null, { suspended: false })).toBe(
            0
        );
    });
});
