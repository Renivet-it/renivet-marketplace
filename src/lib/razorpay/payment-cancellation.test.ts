import { describe, expect, test } from "bun:test";
import {
    getCustomerPaymentCancellationPath,
    getPaymentCancellationDestination,
} from "./payment-cancellation";

describe("getCustomerPaymentCancellationPath", () => {
    test("uses the supplied destination and keeps the cart fallback", () => {
        expect(
            getPaymentCancellationDestination("/checkout?buy_now=true")
        ).toBe("/checkout?buy_now=true");
        expect(getPaymentCancellationDestination()).toBe("/mycart");
        expect(getPaymentCancellationDestination("https://example.com")).toBe(
            "/mycart"
        );
        expect(getPaymentCancellationDestination("//example.com")).toBe(
            "/mycart"
        );
    });

    test("preserves Buy Now checkout context", () => {
        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: true,
                buyNowItemId: "item-1",
                buyNowVariantId: "variant-1",
                buyNowQty: "2",
                isSwapReward: false,
                rewardRedemptionId: null,
            })
        ).toBe("/checkout?buy_now=true&item=item-1&variant=variant-1&qty=2");
    });

    test("preserves swap-reward checkout context", () => {
        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: false,
                buyNowItemId: null,
                buyNowVariantId: null,
                buyNowQty: null,
                isSwapReward: true,
                rewardRedemptionId: "redemption-1",
            })
        ).toBe("/checkout?swap_reward=true&redemption=redemption-1");
    });

    test("falls back to the cart for normal and incomplete contexts", () => {
        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: false,
                buyNowItemId: null,
                buyNowVariantId: null,
                buyNowQty: null,
                isSwapReward: false,
                rewardRedemptionId: null,
            })
        ).toBe("/mycart");

        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: true,
                buyNowItemId: null,
                buyNowVariantId: "variant-1",
                buyNowQty: "2",
                isSwapReward: false,
                rewardRedemptionId: null,
            })
        ).toBe("/mycart");

        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: false,
                buyNowItemId: null,
                buyNowVariantId: null,
                buyNowQty: null,
                isSwapReward: true,
                rewardRedemptionId: null,
            })
        ).toBe("/mycart");
    });

    test("URL-encodes context values and rejects ambiguous dual context", () => {
        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: true,
                buyNowItemId: "item/1?x=2",
                buyNowVariantId: "variant one",
                buyNowQty: "1",
                isSwapReward: false,
                rewardRedemptionId: null,
            })
        ).toBe(
            "/checkout?buy_now=true&item=item%2F1%3Fx%3D2&variant=variant+one&qty=1"
        );

        expect(
            getCustomerPaymentCancellationPath({
                isBuyNow: true,
                buyNowItemId: "item-1",
                buyNowVariantId: "variant-1",
                buyNowQty: "1",
                isSwapReward: true,
                rewardRedemptionId: "redemption-1",
            })
        ).toBe("/mycart");
    });
});
