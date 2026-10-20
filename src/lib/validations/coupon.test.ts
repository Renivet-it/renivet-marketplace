import { describe, expect, test } from "bun:test";
import { shouldExposeCouponPublicly } from "./coupon-visibility";

describe("coupon visibility", () => {
    test("exposes regular coupons publicly", () => {
        expect(shouldExposeCouponPublicly(false)).toBe(true);
    });

    test("hides creator coupons from public listings", () => {
        expect(shouldExposeCouponPublicly(true)).toBe(false);
    });
});
