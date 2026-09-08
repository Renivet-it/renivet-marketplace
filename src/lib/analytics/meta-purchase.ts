import type { CapiCustomData, CapiUserData } from "@/lib/fb-capi";
import { convertPaiseToRupees } from "@/lib/utils";
import { buildPurchaseEventId } from "./meta-event-quality";

export type MetaPurchaseItem = {
    productId: string;
    quantity: number;
};

export type TrackMetaPurchaseInput = {
    completedOrderIds: string[];
    totalAmountPaise: number;
    items: MetaPurchaseItem[];
    userData: CapiUserData;
    sourceUrl: string;
};

export type MetaPurchaseTrackingDependencies = {
    sendPixel: (
        name: string,
        params: Record<string, any>,
        options?: { eventId?: string }
    ) => void;
    sendCapi: (
        eventId: string,
        userData: CapiUserData,
        customData: CapiCustomData,
        url: string
    ) => Promise<unknown>;
    reportError: (message: string, error?: unknown) => void;
};

export function isCompleteMetaPurchaseOrder(
    createdOrderCount: number,
    expectedOrderCount: number
) {
    return expectedOrderCount > 0 && createdOrderCount === expectedOrderCount;
}

export function buildMetaPurchasePayload({
    totalAmountPaise,
    items,
}: {
    totalAmountPaise: number;
    items: MetaPurchaseItem[];
}) {
    return {
        value: Number(convertPaiseToRupees(totalAmountPaise)),
        currency: "INR" as const,
        content_type: "product" as const,
        content_ids: items.map((item) => item.productId),
        num_items: items.reduce((total, item) => total + item.quantity, 0),
    };
}

export function buildMetaPurchaseTrackingEvent({
    completedOrderIds,
    totalAmountPaise,
    items,
}: {
    completedOrderIds: string[];
    totalAmountPaise: number;
    items: MetaPurchaseItem[];
}) {
    const eventId = buildPurchaseEventId(completedOrderIds);
    return {
        eventId,
        purchasePayload: {
            ...buildMetaPurchasePayload({ totalAmountPaise, items }),
            order_id: eventId,
        },
    };
}

export function trackMetaPurchase(
    input: TrackMetaPurchaseInput,
    dependencies: MetaPurchaseTrackingDependencies
): void {
    if (input.completedOrderIds.length === 0) {
        dependencies.reportError(
            "Skipping Meta Purchase without completed order IDs"
        );
        return;
    }

    const { eventId, purchasePayload } = buildMetaPurchaseTrackingEvent(input);

    try {
        dependencies.sendPixel("Purchase", purchasePayload, { eventId });
    } catch (error) {
        dependencies.reportError("Meta Pixel Purchase Error", error);
    }

    try {
        void dependencies
            .sendCapi(eventId, input.userData, purchasePayload, input.sourceUrl)
            .catch((error) =>
                dependencies.reportError("CAPI Purchase Error", error)
            );
    } catch (error) {
        dependencies.reportError("CAPI Purchase Error", error);
    }
}
