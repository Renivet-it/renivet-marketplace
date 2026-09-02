import { convertPaiseToRupees } from "@/lib/utils";

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
        content_type: "product",
        content_ids: items.map((item) => item.productId),
        num_items: items.reduce((total, item) => total + item.quantity, 0),
    };
}
