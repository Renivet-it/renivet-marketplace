import { describe, expect, test } from "bun:test";
import {
    isPayoutAttributionLocked,
    requiresReturnAttributionNotes,
    payoutLineItemReferencesCase,
} from "./return-attribution";

describe("return attribution rules", () => {
    test("requires notes when changing an existing attribution", () => {
        expect(requiresReturnAttributionNotes({ previous: null, next: "brand_fault" })).toBe(false);
        expect(requiresReturnAttributionNotes({ previous: "customer_fault", next: "brand_fault" })).toBe(true);
        expect(requiresReturnAttributionNotes({ previous: "customer_fault", next: "customer_fault" })).toBe(false);
    });

    test("locks only approved-or-later payout cycles", () => {
        expect(isPayoutAttributionLocked("calculated")).toBe(false);
        expect(isPayoutAttributionLocked("approved")).toBe(true);
        expect(isPayoutAttributionLocked("processing")).toBe(true);
        expect(isPayoutAttributionLocked("completed")).toBe(true);
        expect(isPayoutAttributionLocked("failed")).toBe(false);
    });

    test("matches payout references for the case without relying on descriptions", () => {
        expect(payoutLineItemReferencesCase({ referenceId: "refund-1", orderId: "order-1" }, "refund-1")).toBe(true);
        expect(payoutLineItemReferencesCase({ referenceId: "order-1", orderId: "order-1" }, "refund-1")).toBe(false);
        expect(payoutLineItemReferencesCase({ referenceId: null, orderId: "order-1" }, "order-1")).toBe(true);
    });
});
