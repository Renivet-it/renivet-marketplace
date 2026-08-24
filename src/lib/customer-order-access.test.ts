import { expect, test } from "bun:test";
import { canPlaceCustomerOrder } from "./customer-order-access";

test("allows only accounts without site or brand responsibilities", () => {
    expect(canPlaceCustomerOrder({ brand: null, roles: [] })).toBe(true);
    expect(
        canPlaceCustomerOrder({
            brand: null,
            roles: [{ isSiteRole: true, brandPermissions: "0" }],
        })
    ).toBe(false);
    expect(
        canPlaceCustomerOrder({
            brand: { id: "brand-1" },
            roles: [{ isSiteRole: false, brandPermissions: "0" }],
        })
    ).toBe(false);
    expect(
        canPlaceCustomerOrder({
            brand: null,
            roles: [{ isSiteRole: false, brandPermissions: "1" }],
        })
    ).toBe(false);
});
