// app/actions/track-product.ts
"use server";

import { productQueries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";

export async function trackProductClick(productId: string, brandId: string) {
    try {
        const { userId } = await auth();
        await productQueries.trackProductClick(
            productId,
            brandId,
            userId ?? undefined
        );
        return { success: true };
    } catch (error) {
        console.error("Error tracking product click:", error);
        return { success: false, error: "Failed to track click" };
    }
}