import { describe, expect, test } from "bun:test";
import {
    evaluatePayoutEligibility,
    getDeliveredAt,
    isWithinPayoutWindow,
} from "./payout-eligibility";

const start = new Date("2026-06-01T00:00:00.000Z");
const end = new Date("2026-06-30T23:59:59.999Z");

function order(overrides: Record<string, unknown> = {}) {
    return {
        id: "order-1",
        status: "delivered",
        paymentStatus: "paid",
        paymentId: "pay-1",
        paymentMethod: "razorpay",
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        updatedAt: new Date("2026-05-02T00:00:00.000Z"),
        shipments: [
            {
                status: "delivered",
                updatedAt: new Date("2026-06-15T12:00:00.000Z"),
            },
        ],
        ...overrides,
    };
}

describe("REN-204 payout eligibility", () => {
    test("uses the delivered shipment timestamp even when the order predates the cycle", () => {
        const deliveredAt = getDeliveredAt(order());

        expect(deliveredAt?.toISOString()).toBe("2026-06-15T12:00:00.000Z");
        expect(isWithinPayoutWindow(deliveredAt, start, end)).toBe(true);
    });

    test("does not invent delivery dates when a delivered shipment timestamp is missing", () => {
        expect(
            getDeliveredAt(
                order({
                    shipments: [{ status: "delivered", updatedAt: null }],
                })
            )
        ).toBeNull();
    });

    test("treats exact cycle boundaries as eligible", () => {
        expect(isWithinPayoutWindow(start, start, end)).toBe(true);
        expect(isWithinPayoutWindow(end, start, end)).toBe(true);
    });

    test("requires a confirmed paid payment with a payment id", () => {
        expect(evaluatePayoutEligibility(order())).toEqual({
            disposition: "eligible",
        });
        expect(
            evaluatePayoutEligibility(order({ paymentStatus: "pending" }))
        ).toEqual({
            disposition: "excluded",
            reason: "payment_not_confirmed",
        });
        expect(
            evaluatePayoutEligibility(order({ paymentStatus: "paid", paymentId: null }))
        ).toEqual({
            disposition: "excluded",
            reason: "payment_not_confirmed",
        });
    });

    test("holds COD and split-payment orders for reconciliation", () => {
        expect(
            evaluatePayoutEligibility(order({ paymentMethod: "COD" }))
        ).toEqual({
            disposition: "held",
            reason: "cod_reconciliation_pending",
        });
        expect(
            evaluatePayoutEligibility(order({ paymentMethod: "split_payment" }))
        ).toEqual({
            disposition: "held",
            reason: "cod_reconciliation_pending",
        });
    });

    test("holds orders sharing a payment id instead of double-counting split funding", () => {
        expect(
            evaluatePayoutEligibility(order(), new Set(), new Set(["pay-1"]))
        ).toEqual({
            disposition: "held",
            reason: "cod_reconciliation_pending",
        });
    });

    test("excludes an order already settled in a prior completed cycle", () => {
        expect(
            evaluatePayoutEligibility(order(), new Set(["order-1"]))
        ).toEqual({
            disposition: "excluded",
            reason: "prior_cycle_settled",
        });
    });
});
