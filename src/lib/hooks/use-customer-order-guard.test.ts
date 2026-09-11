import { expect, test } from "bun:test";
import { getCustomerOrderGuardState } from "./use-customer-order-guard";

test("fails closed while account state is loading", () => {
    expect(getCustomerOrderGuardState(null, true).isBlocked).toBe(true);
});

test("blocks operator accounts with stable customer-facing copy", () => {
    expect(
        getCustomerOrderGuardState(
            { roles: [{ isSiteRole: true }], brand: null },
            false
        )
    ).toEqual({
        isBlocked: true,
        message: "Admin accounts cannot place customer orders",
    });
});

test("allows ordinary customer accounts", () => {
    expect(
        getCustomerOrderGuardState({ roles: [], brand: null }, false)
    ).toEqual({ isBlocked: false, message: null });
});
