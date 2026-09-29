import { describe, expect, test } from "bun:test";
import {
    buildDelayedDigestVariable,
    buildDelayedOrdersActionUrl,
    isUndeliveredEligible,
    isUnshippedEligible,
} from "./delayed-order-alerts";

const now = new Date("2026-09-29T17:00:00.000Z");

describe("delayed order eligibility", () => {
    test("qualifies an unshipped paid order at exactly 48 hours", () => {
        expect(
            isUnshippedEligible(
                {
                    paymentStatus: "paid",
                    status: "processing",
                    createdAt: new Date("2026-09-27T17:00:00.000Z"),
                    shipments: [],
                },
                now
            )
        ).toBe(true);
    });

    test("excludes unshipped orders before 48 hours and cancelled/delivered orders", () => {
        const base = {
            paymentStatus: "paid" as const,
            status: "processing" as const,
            createdAt: new Date("2026-09-27T17:00:00.001Z"),
            shipments: [],
        };

        expect(isUnshippedEligible(base, now)).toBe(false);
        expect(isUnshippedEligible({ ...base, status: "cancelled" }, now)).toBe(false);
        expect(isUnshippedEligible({ ...base, status: "delivered" }, now)).toBe(false);
    });

    test("qualifies a shipped order at exactly seven days and excludes terminal shipments", () => {
        const base = {
            paymentStatus: "paid" as const,
            status: "shipped" as const,
            shipment: {
                status: "in_transit" as const,
                shipmentDate: new Date("2026-09-22T17:00:00.000Z"),
            },
        };

        expect(isUndeliveredEligible(base, now)).toBe(true);
        expect(isUndeliveredEligible({ ...base, shipment: { ...base.shipment, status: "delivered" } }, now)).toBe(false);
        expect(isUndeliveredEligible({ ...base, shipment: { ...base.shipment, status: "rto_delivered" } }, now)).toBe(false);
    });

    test("formats multiple orders as a compact single-line variable with safe fallbacks", () => {
        expect(
            buildDelayedDigestVariable([
                {
                    orderId: "ORD-1001",
                    productDetails: "Necklace",
                    quantity: 2,
                    status: "processing",
                    shipmentDate: null,
                    tracking: null,
                },
                {
                    orderId: "ORD-1002",
                    productDetails: "Bracelet",
                    quantity: 1,
                    status: "shipped",
                    shipmentDate: new Date("2026-09-20T00:00:00.000Z"),
                    tracking: "AWB 123456",
                },
            ])
        ).toBe(
            "ORD-1001 | Necklace | Qty 2 | Status processing; ORD-1002 | Bracelet | Qty 1 | Status shipped | Shipped 20 Sep 2026 | AWB 123456"
        );
    });

    test("builds the authenticated admin orders URL from runtime host", () => {
        expect(buildDelayedOrdersActionUrl("https://admin.example.com/")).toBe(
            "https://admin.example.com/dashboard/general/orders"
        );
    });
});
