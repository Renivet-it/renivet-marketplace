"use server";

import { productQueries } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { womenPageFeaturedProducts, products, menPageFeaturedProducts, womenStyleWithSubstanceMiddlePageSection, menCuratedHerEssence } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleFeaturedProduct(productId: string, isFeaturedWomen: boolean) {
    try {
        // Check if product exists in products table
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        if (isFeaturedWomen) {
            // Remove from featured products (soft delete) in womenPageFeaturedProducts
            const result = await productQueries.removeWomenPageFeaturedProduct(productId);
            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isFeaturedWomen to false in products table
            await db
                .update(products)
                .set({ isFeaturedWomen: false })
                .where(eq(products.id, productId));
revalidatePath("/dashboard/general/products");

            return { success: true, message: "Product removed from featured list" };
        } else {
            // Check if product already exists and is not deleted in womenPageFeaturedProducts
            const existing = await db
                .select()
                .from(womenPageFeaturedProducts)
                .where(eq(womenPageFeaturedProducts.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already featured" };
            }

            // Add to featured products in womenPageFeaturedProducts
            await productQueries.createWomenPageFeaturedProduct({ productId });

            // Update isFeaturedWomen to true in products table
            await db
                .update(products)
                .set({ isFeaturedWomen: true })
                .where(eq(products.id, productId));
revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to featured list" };
        }
    } catch (error) {
        console.error("Error toggling featured status:", error);
        return { success: false, error: "Failed to update featured status" };
    }
}

export async function menToggleFeaturedProduct(productId: string, isFeaturedMen: boolean) {
    try {
        // Check if product exists in products table
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        if (isFeaturedMen) {
            // Remove from featured products (soft delete) in womenPageFeaturedProducts
            const result = await productQueries.removeMenPageFeaturedProduct(productId);
            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isFeaturedWomen to false in products table
            await db
                .update(products)
                .set({ isFeaturedMen: false })
                .where(eq(products.id, productId));
revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product removed from featured list" };
        } else {
            // Check if product already exists and is not deleted in womenPageFeaturedProducts
            const existing = await db
                .select()
                .from(menPageFeaturedProducts)
                .where(eq(menPageFeaturedProducts.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already featured" };
            }

            // Add to featured products in womenPageFeaturedProducts
            await productQueries.createMenPageFeaturedProduct({ productId });

            // Update isFeaturedWomen to true in products table
            await db
                .update(products)
                .set({ isFeaturedMen: true })
                .where(eq(products.id, productId));
revalidatePath("/dashboard/general/products");

            return { success: true, message: "Product added to featured list" };
        }
    } catch (error) {
        console.error("Error toggling featured status:", error);
        return { success: false, error: "Failed to update featured status" };
    }
}


export async function toggleWomenStyleWithSubstance(productId: string, isFeatured: boolean) {
    try {
        // Check if product exists in products table
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        if (isFeatured) {
            // Remove from featured products (soft delete)
            const result = await db
                .update(womenStyleWithSubstanceMiddlePageSection)
                .set({ 
                    isDeleted: true,
                    deletedAt: new Date()
                })
                .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceWoMen to false in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceWoMen: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(womenStyleWithSubstanceMiddlePageSection)
                .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(womenStyleWithSubstanceMiddlePageSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId));
            } else {
                // Add new entry
                await db.insert(womenStyleWithSubstanceMiddlePageSection)
                    .values({ productId });
            }

            // Update isStyleWithSubstanceWoMen to true in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceWoMen: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}

export async function toggleMenStyleWithSubstance(productId: string, isFeatured: boolean) {
    try {
        // Check if product exists in products table
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        if (isFeatured) {
            // Remove from featured products (soft delete)
            const result = await db
                .update(menCuratedHerEssence)
                .set({
                    isDeleted: true,
                    deletedAt: new Date()
                })
                .where(eq(menCuratedHerEssence.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceMen: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(menCuratedHerEssence)
                .where(eq(menCuratedHerEssence.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(menCuratedHerEssence)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(menCuratedHerEssence.productId, productId));
            } else {
                // Add new entry
                await db.insert(menCuratedHerEssence)
                    .values({ productId });
            }

            // Update isStyleWithSubstanceMen to true in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceMen: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}