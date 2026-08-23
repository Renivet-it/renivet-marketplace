import { expect, test } from "bun:test";
import { canAccessBrandShipment, isLogisticsStaff } from "./logistics-policy";

test("allows staff with order-management access to manage any shipment", () => {
    expect(isLogisticsStaff(1 << 18)).toBe(true);
});

test("allows an order-enabled brand user to manage its own shipment", () => {
    expect(
        canAccessBrandShipment({
            brandId: "brand-a",
            hasOrderAccess: true,
            shipmentBrandId: "brand-a",
        })
    ).toBe(true);
});

test("rejects a brand user trying to manage another brand's shipment", () => {
    expect(
        canAccessBrandShipment({
            brandId: "brand-a",
            hasOrderAccess: true,
            shipmentBrandId: "brand-b",
        })
    ).toBe(false);
});
