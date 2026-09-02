import { convertPaiseToRupees } from "@/lib/utils";
import { buildPurchaseEventId } from "./meta-event-quality";

export type MetaPurchaseItem = {
    productId: string;
    quantity: number;
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
