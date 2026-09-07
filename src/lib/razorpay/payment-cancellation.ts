const DEFAULT_PAYMENT_CANCELLATION_PATH = "/mycart";

export interface CustomerPaymentCancellationContext {
    isBuyNow: boolean;
    buyNowItemId?: string | null;
    buyNowVariantId?: string | null;
    buyNowQty?: string | null;
    isSwapReward: boolean;
    rewardRedemptionId?: string | null;
}

export function getPaymentCancellationDestination(
    cancelRedirectUrl?: string
): string {
    if (
        cancelRedirectUrl &&
        cancelRedirectUrl.startsWith("/") &&
        !cancelRedirectUrl.startsWith("//")
    ) {
        return cancelRedirectUrl;
    }

    return DEFAULT_PAYMENT_CANCELLATION_PATH;
}

export function getCustomerPaymentCancellationPath({
    isBuyNow,
    buyNowItemId,
    buyNowVariantId,
    buyNowQty,
    isSwapReward,
    rewardRedemptionId,
}: CustomerPaymentCancellationContext): string {
    if (isBuyNow && isSwapReward) return DEFAULT_PAYMENT_CANCELLATION_PATH;

    if (isSwapReward) {
        if (!rewardRedemptionId) return DEFAULT_PAYMENT_CANCELLATION_PATH;

        const params = new URLSearchParams({
            swap_reward: "true",
            redemption: rewardRedemptionId,
        });
        return `/checkout?${params.toString()}`;
    }

    if (isBuyNow) {
        if (!buyNowItemId) return DEFAULT_PAYMENT_CANCELLATION_PATH;

        const params = new URLSearchParams({
            buy_now: "true",
            item: buyNowItemId,
        });
        if (buyNowVariantId) params.set("variant", buyNowVariantId);
        if (buyNowQty) params.set("qty", buyNowQty);
        return `/checkout?${params.toString()}`;
    }

    return DEFAULT_PAYMENT_CANCELLATION_PATH;
}
