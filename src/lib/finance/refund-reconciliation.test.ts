import { describe, expect, test } from "bun:test";
import { summarizeRefundReconciliation } from "./refund-reconciliation";

describe("refund reconciliation reporting", () => {
    test("reports a refunded order with no backing event without proposing a repair", () => {
        expect(
            summarizeRefundReconciliation({
                orderId: "order-4",
                paymentStatus: "refunded",
                refunds: [],
            })
        ).toEqual({
            orderId: "order-4",
            classification: "missing_refund_row",
            refundIds: [],
            repair: "manual_review_required",
        });
    });

    test("reports a processed refund as consistent", () => {
        expect(
            summarizeRefundReconciliation({
                orderId: "order-1",
                paymentStatus: "refunded",
                refunds: [{ id: "rfnd_1", status: "processed" }],
            }).classification
        ).toBe("consistent");
    });
});
