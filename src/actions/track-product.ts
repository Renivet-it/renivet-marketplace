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


export async function trackAddToCart(productId: string, brandId: string) {
    try {
        const { userId } = await auth();
        await productQueries.trackAddToCart(
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
export async function trackPurchase(productId: string, brandId: string) {
    try {
        const { userId } = await auth();
        await productQueries.trackPurchase(
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