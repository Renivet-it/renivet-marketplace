import { POSTHOG_EVENTS } from "@/config/posthog";

export interface PurchaseCompletedInput {
    checkoutId: string;
    distinctId: string;
    orderIds: string[];
    productIds: string[];
    brandIds: string[];
    totalAmountPaise: number;
    totalItems: number;
    paymentMethod: string;
}

export interface PurchaseCompletedEvent {
    event: typeof POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED;
    distinctId: string;
    properties: {
        $insert_id: string;
        checkout_id: string;
        order_ids: string[];
        product_ids: string[];
        brand_ids: string[];
        total_amount: number;
        currency: "INR";
        total_items: number;
        payment_method: string;
    };
}

export function buildPurchaseCompletedEvent(
    input: PurchaseCompletedInput
): PurchaseCompletedEvent {
    return {
        event: POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED,
        distinctId: input.distinctId,
        properties: {
            $insert_id: input.checkoutId,
            checkout_id: input.checkoutId,
            order_ids: input.orderIds,
            product_ids: input.productIds,
            brand_ids: input.brandIds,
            total_amount: input.totalAmountPaise / 100,
            currency: "INR",
            total_items: input.totalItems,
            payment_method: input.paymentMethod,
        },
    };
}

export function capturePurchaseCompleted(
    capture: (event: PurchaseCompletedEvent) => void,
    input: PurchaseCompletedInput
): void {
    try {
        capture(buildPurchaseCompletedEvent(input));
    } catch (error) {
        console.error("Failed to capture purchase_completed:", {
            errorName: error instanceof Error ? error.name : "UnknownError",
        });
    }
}
