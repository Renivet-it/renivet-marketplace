import { UnicommerceClient } from "./client";
import { productQueries } from "@/lib/db/queries";

export async function syncUnicommerceInventory(params?: {
    updatedSinceMinutes?: number;
    skus?: string[];
}) {
    const client = new UnicommerceClient();
    const snapshots = await client.getInventorySnapshot({
        updatedSinceMinutes: params?.updatedSinceMinutes ?? 60,
        skus: params?.skus ?? [],
    });

    if (snapshots.length === 0) {
        return {
            updatedProducts: 0,
            updatedVariants: 0,
            missingSkus: [],
            totalSnapshots: 0,
        };
    }

    const result = await productQueries.syncInventoryBySku(
        snapshots.map((s) => ({ sku: s.itemSku, quantity: s.inventory }))
    );

    return {
        ...result,
        totalSnapshots: snapshots.length,
    };
}