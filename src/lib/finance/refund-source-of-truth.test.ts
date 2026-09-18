import { describe, expect, test } from "bun:test";
import {
    classifyRefundReconciliation,
    deriveOrderPaymentStatus,
    getRefundEventIdentity,
    deriveOrderPaymentStatusFromRefunds,
    resolveRefundEventStatus,
} from "./refund-source-of-truth";

describe("refund source-of-truth rules", () => {
    test("derives pending, refunded, and failed payment states from refund state", () => {
        expect(deriveOrderPaymentStatus("pending")).toBe("refund_pending");
        expect(deriveOrderPaymentStatus("processed")).toBe("refunded");
        expect(deriveOrderPaymentStatus("failed")).toBe("refund_failed");
    });

    test("prefers the gateway refund identity and does not use order-only identity", () => {
        expect(
            getRefundEventIdentity({
                gatewayRefundId: "rfnd_123",
                refundId: "fin_order_1",
                paymentId: "pay_123",
                orderId: "order_1",
            })
        ).toEqual({ kind: "gateway_refund", value: "rfnd_123" });

        expect(
            getRefundEventIdentity({
                refundId: "fin_order_1",
                paymentId: "pay_123",
                orderId: "order_1",
            })
        ).toEqual({ kind: "refund", value: "fin_order_1" });
    });

    test("keeps separate payment identities separate for split-payment orders", () => {
        expect(
            getRefundEventIdentity({
                paymentId: "pay_a",
                orderId: "order_1",
            })
        ).toEqual({ kind: "payment", value: "pay_a" });
        expect(
            getRefundEventIdentity({
                paymentId: "pay_b",
                orderId: "order_1",
            })
        ).toEqual({ kind: "payment", value: "pay_b" });
    });

    test("classifies a refunded order without a refund row as a report-only mismatch", () => {
        expect(
            classifyRefundReconciliation({
                paymentStatus: "refunded",
                refundCount: 0,
            })
        ).toBe("missing_refund_row");
        expect(
            classifyRefundReconciliation({
                paymentStatus: "refunded",
                refundCount: 1,
            })
        ).toBe("consistent");
        expect(
            classifyRefundReconciliation({
                paymentStatus: "paid",
                refundCount: 1,
                hasProcessedRefund: true,
            })
        ).toBe("refund_status_conflict");
    });

    test("does not downgrade a durable terminal refund state on replay", () => {
        expect(resolveRefundEventStatus("processed", "pending")).toBe("processed");
        expect(resolveRefundEventStatus("failed", "pending")).toBe("failed");
        expect(resolveRefundEventStatus("failed", "processed")).toBe("processed");
    });

    test("derives split-payment order status from all refund events", () => {
        expect(deriveOrderPaymentStatusFromRefunds(["failed", "processed"])).toBe(
            "refunded"
        );
        expect(deriveOrderPaymentStatusFromRefunds(["failed", "pending"])).toBe(
            "refund_pending"
        );
        expect(deriveOrderPaymentStatusFromRefunds(["failed"])).toBe(
            "refund_failed"
        );
    });
});
