"use server";

import { db } from "@/lib/db";
import { productQueries } from "@/lib/db/queries";
import {
    beautyNewArrivals,
    beautyTopPicks,
    homeandlivingNewArrival,
    homeandlivingTopPicks,
    homeNewArrivals,
    homeProductLoveTheseSection,
    homeProductMayAlsoLikeThese,
    homeProductPageList,
    homeProductSection,
    kidsFreshCollectionSection,
    menCuratedHerEssence,
    menPageFeaturedProducts,
    newProductEventPage,
    products,
    womenPageFeaturedProducts,
    womenStyleWithSubstanceMiddlePageSection,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function normalizePosition(position?: number) {
    return typeof position === "number" && Number.isFinite(position) && position > 0
        ? Math.floor(position)
        : undefined;
}

async function resolveSectionPosition(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sectionTable: any,
    requestedPosition?: number,
    existingPosition?: number
) {
    const normalized = normalizePosition(requestedPosition);
    if (normalized !== undefined) return normalized;

    if (
        typeof existingPosition === "number" &&
        Number.isFinite(existingPosition) &&
        existingPosition > 0
    ) {
        return Math.floor(existingPosition);
    }

    const activeCount = await db.$count(
        sectionTable,
        eq(sectionTable.isDeleted, false)
    );
    return activeCount + 1;
}

export async function toggleFeaturedProduct(
    productId: string,
    isFeaturedWomen: boolean,
    position?: number
) {
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
            const result =
                await productQueries.removeWomenPageFeaturedProduct(productId);
            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isFeaturedWomen to false in products table
            await db
                .update(products)
                .set({ isFeaturedWomen: false })
                .where(eq(products.id, productId));
            revalidatePath("/dashboard/general/products");

            return {
                success: true,
                message: "Product removed from featured list",
            };
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

            const targetPosition = await resolveSectionPosition(
                womenPageFeaturedProducts,
                position,
                existing?.position
            );

            if (existing) {
                // Restore with updated position
                await db
                    .update(womenPageFeaturedProducts)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(womenPageFeaturedProducts.productId, productId));
            } else {
                // Add to featured products in womenPageFeaturedProducts
                await db.insert(womenPageFeaturedProducts).values({
                    productId,
                    position: targetPosition,
                });
            }

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

export async function menToggleFeaturedProduct(
    productId: string,
    isFeaturedMen: boolean,
    position?: number
) {
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
            const result =
                await productQueries.removeMenPageFeaturedProduct(productId);
            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isFeaturedWomen to false in products table
            await db
                .update(products)
                .set({ isFeaturedMen: false })
                .where(eq(products.id, productId));
            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from featured list",
            };
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

            const targetPosition = await resolveSectionPosition(
                menPageFeaturedProducts,
                position,
                existing?.position
            );

            if (existing) {
                await db
                    .update(menPageFeaturedProducts)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(menPageFeaturedProducts.productId, productId));
            } else {
                // Add to featured products in womenPageFeaturedProducts
                await db.insert(menPageFeaturedProducts).values({
                    productId,
                    position: targetPosition,
                });
            }

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

// export async function toggleWomenStyleWithSubstance(productId: string, isStyleWithSubstanceWoMen: boolean) {
//     try {
//         // Check if product exists in products table
//         const existingProduct = await db
//             .select()
//             .from(products)
//             .where(eq(products.id, productId))
//             .then((res) => res[0]);

//         if (!existingProduct) {
//             return { success: false, error: "Product not found" };
//         }

//         if (isStyleWithSubstanceWoMen) {
//             // Remove from featured products (soft delete)

//                     const result = await db
//                         .update(womenStyleWithSubstanceMiddlePageSection)
//                         .set({ isDeleted: true, deletedAt: new Date() })
//                         .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId))
//                         .returning()
//                         .then((res) => res[0]);

//             //         return data;
//             // const result = await db
//             //     .update(womenStyleWithSubstanceMiddlePageSection)
//             //     .set({
//             //         isDeleted: true,
//             //         deletedAt: new Date()
//             //     })
//             //     .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId));

//             if (!result) {
//                 return { success: false, error: "Featured product not found" };
//             }

//             // Update isStyleWithSubstanceWoMen to false in products table
//             await db
//                 .update(products)
//                 .set({ isStyleWithSubstanceWoMen: false })
//                 .where(eq(products.id, productId));

//             revalidatePath("/dashboard/general/products");
//             return { success: true, message: "Product removed from Style With Substance list" };
//         } else {
//             // Check if product already exists and is not deleted
//             const existing = await db
//                 .select()
//                 .from(womenStyleWithSubstanceMiddlePageSection)
//                 .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId))
//                 .then((res) => res[0]);

//             if (existing && !existing.isDeleted) {
//                 return { success: false, error: "Product is already in Style With Substance" };
//             }

//             if (existing) {
//                 // Restore if previously soft deleted
//                 await db
//                     .update(womenStyleWithSubstanceMiddlePageSection)
//                     .set({
//                         isDeleted: false,
//                         deletedAt: null
//                     })
//                     .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId));
//             } else {
//                 // Add new entry
//                 await db.insert(womenStyleWithSubstanceMiddlePageSection)
//                     .values({ productId });
//             }

//             // Update isStyleWithSubstanceWoMen to true in products table
//             await db
//                 .update(products)
//                 .set({ isStyleWithSubstanceWoMen: true })
//                 .where(eq(products.id, productId));

//             revalidatePath("/dashboard/general/products");
//             return { success: true, message: "Product added to Style With Substance list" };
//         }
//     } catch (error) {
//         console.error("Error toggling Style With Substance status:", error);
//         return { success: false, error: "Failed to update Style With Substance status" };
//     }
// }

export async function toggleWomenStyleWithSubstance(
    productId: string,
    isStyleWithSubstanceWoMen: boolean,
    position?: number
) {
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

        if (isStyleWithSubstanceWoMen) {
            // Remove from featured products (soft delete)
            const result = await db
                .update(womenStyleWithSubstanceMiddlePageSection)
                .set({ isDeleted: true, deletedAt: new Date() })
                .where(
                    eq(
                        womenStyleWithSubstanceMiddlePageSection.productId,
                        productId
                    )
                )
                .returning()
                .then((res) => res[0]);

            // Check if the update affected any rows
            if (!result) {
                return {
                    success: false,
                    error: "Product not found in Style With Substance section",
                };
            }

            // Update isStyleWithSubstanceWoMen to false in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceWoMen: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists in womenStyleWithSubstanceMiddlePageSection
            const existing = await db
                .select()
                .from(womenStyleWithSubstanceMiddlePageSection)
                .where(
                    eq(
                        womenStyleWithSubstanceMiddlePageSection.productId,
                        productId
                    )
                )
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                womenStyleWithSubstanceMiddlePageSection,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(womenStyleWithSubstanceMiddlePageSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(
                        eq(
                            womenStyleWithSubstanceMiddlePageSection.productId,
                            productId
                        )
                    );
            } else {
                // Add new entry
                await db
                    .insert(womenStyleWithSubstanceMiddlePageSection)
                    .values({ productId, position: targetPosition });
            }

            // Update isStyleWithSubstanceWoMen to true in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceWoMen: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleMenStyleWithSubstance(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                    deletedAt: new Date(),
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
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(menCuratedHerEssence)
                .where(eq(menCuratedHerEssence.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                menCuratedHerEssence,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(menCuratedHerEssence)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(menCuratedHerEssence.productId, productId));
            } else {
                // Add new entry
                await db.insert(menCuratedHerEssence).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isStyleWithSubstanceMen to true in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceMen: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleKidsFetchSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(kidsFreshCollectionSection)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(kidsFreshCollectionSection.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ iskidsFetchSection: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(kidsFreshCollectionSection)
                .where(eq(kidsFreshCollectionSection.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                kidsFreshCollectionSection,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(kidsFreshCollectionSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(kidsFreshCollectionSection.productId, productId));
            } else {
                // Add new entry
                await db
                    .insert(kidsFreshCollectionSection)
                    .values({ productId, position: targetPosition });
            }

            // Update iskidsFetchSection to true in products table
            await db
                .update(products)
                .set({ iskidsFetchSection: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeAndLivingNewArrivalsSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeandlivingNewArrival)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeandlivingNewArrival.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionNewArrival: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeandlivingNewArrival)
                .where(eq(homeandlivingNewArrival.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeandlivingNewArrival,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeandlivingNewArrival)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(homeandlivingNewArrival.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeandlivingNewArrival).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isHomeAndLivingSectionNewArrival to true in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionNewArrival: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeAndLivingTopPicksSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeandlivingTopPicks)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeandlivingTopPicks.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionTopPicks: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeandlivingTopPicks)
                .where(eq(homeandlivingTopPicks.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeandlivingTopPicks,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeandlivingTopPicks)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(homeandlivingTopPicks.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeandlivingTopPicks).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isHomeAndLivingSectionTopPicks to true in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionTopPicks: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleBeautyNewArrivalSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(beautyNewArrivals)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(beautyNewArrivals.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isBeautyNewArrival: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(beautyNewArrivals)
                .where(eq(beautyNewArrivals.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                beautyNewArrivals,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(beautyNewArrivals)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(beautyNewArrivals.productId, productId));
            } else {
                // Add new entry
                await db.insert(beautyNewArrivals).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isBeautyNewArrival to true in products table
            await db
                .update(products)
                .set({ isBeautyNewArrival: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleBeautyTopPickSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(beautyTopPicks)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(beautyTopPicks.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isBeautyTopPicks: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(beautyTopPicks)
                .where(eq(beautyTopPicks.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                beautyTopPicks,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(beautyTopPicks)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(beautyTopPicks.productId, productId));
            } else {
                // Add new entry
                await db.insert(beautyTopPicks).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isBeautyTopPicks to true in products table
            await db
                .update(products)
                .set({ isBeautyTopPicks: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeHeroProduct(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeProductSection)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeProductSection.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomeHeroProducts: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            revalidatePath("/");
            return {
                success: true,
                message: "Product removed from Home Best Sellers section",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeProductSection)
                .where(eq(homeProductSection.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Home Best Sellers section",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeProductSection,
                position,
                existing?.position
            );


            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeProductSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(homeProductSection.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeProductSection).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update ishomeProductSection to true in products table
            await db
                .update(products)
                .set({ isHomeHeroProducts: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            revalidatePath("/");
            return {
                success: true,
                message: "Product added to Home Best Sellers section",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeYouMayLoveProduct(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeProductLoveTheseSection)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeProductLoveTheseSection.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomeLoveTheseProducts: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeProductLoveTheseSection)
                .where(eq(homeProductLoveTheseSection.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeProductLoveTheseSection,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeProductLoveTheseSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(
                        eq(homeProductLoveTheseSection.productId, productId)
                    );
            } else {
                // Add new entry
                await db
                    .insert(homeProductLoveTheseSection)
                    .values({ productId, position: targetPosition });
            }

            // Update ishomeProductSection to true in products table
            await db
                .update(products)
                .set({ isHomeLoveTheseProducts: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeYouMayAlsoLikeProduct(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeProductMayAlsoLikeThese)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeProductMayAlsoLikeThese.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomeYouMayAlsoLikeTheseProducts: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeProductMayAlsoLikeThese)
                .where(eq(homeProductMayAlsoLikeThese.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeProductMayAlsoLikeThese,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeProductMayAlsoLikeThese)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(
                        eq(homeProductMayAlsoLikeThese.productId, productId)
                    );
            } else {
                // Add new entry
                await db
                    .insert(homeProductMayAlsoLikeThese)
                    .values({ productId, position: targetPosition });
            }

            // Update ishomeProductSection to true in products table
            await db
                .update(products)
                .set({ isHomeYouMayAlsoLikeTheseProducts: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomePageProduct(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(homeProductPageList)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(homeProductPageList.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isHomePageProduct: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Style With Substance list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeProductPageList)
                .where(eq(homeProductPageList.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Style With Substance",
                };
            }

            const targetPosition = await resolveSectionPosition(
                homeProductPageList,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeProductPageList)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(homeProductPageList.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeProductPageList).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update ishomeProductSection to true in products table
            await db
                .update(products)
                .set({ isHomePageProduct: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Style With Substance list",
            };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return {
            success: false,
            error: "Failed to update Style With Substance status",
        };
    }
}

export async function toggleHomeNewArrivalsProduct(
    productId: string,
    isActive: boolean,
    category: string,
    position?: number
) {
    try {
        // âœ Check if product exists
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        // =============================
        // ðŸŸ ADD PRODUCT TO CATEGORY
        // =============================
        if (isActive) {
            const existing = await db
                .select()
                .from(homeNewArrivals)
                .where(eq(homeNewArrivals.productId, productId))
                .then((res) => res[0]);
            // Add or update the same row/category with the latest requested sequence.
            const targetPosition = await resolveSectionPosition(
                homeNewArrivals,
                position,
                existing?.position
            );

            if (existing) {
                // Reactivate + update category
                await db
                    .update(homeNewArrivals)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        category,
                        position: targetPosition,
                    })
                    .where(eq(homeNewArrivals.productId, productId));
            } else {
                // Insert new record
                await db.insert(homeNewArrivals).values({
                    productId,
                    category,
                    position: targetPosition,
                });
            }

            // âœ Update product table flag
            await db
                .update(products)
                .set({
                    isHomeNewArrival: true,
                })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: `Product added to New Arrivals category: ${category}`,
            };
        }

        // =============================
        // ðŸ” REMOVE PRODUCT
        // =============================
        const existing = await db
            .select()
            .from(homeNewArrivals)
            .where(eq(homeNewArrivals.productId, productId))
            .then((res) => res[0]);

        if (!existing) {
            return {
                success: false,
                error: "Product not found in New Arrivals list",
            };
        }

        await db
            .update(homeNewArrivals)
            .set({
                isDeleted: true,
                deletedAt: new Date(),
            })
            .where(eq(homeNewArrivals.productId, productId));

        // Update ishomeProductSection to false in products table
        await db
            .update(products)
            .set({ isHomeNewArrival: false })
            .where(eq(products.id, productId));

        revalidatePath("/dashboard/general/products");
        return {
            success: true,
            message: "Product removed from New Arrivals list",
        };
    } catch (error) {
        console.error("Error toggling New Arrivals status:", error);
        return {
            success: false,
            error: "Failed to update New Arrivals status",
        };
    }
}

export async function newEventPageSection(
    productId: string,
    isFeatured: boolean,
    position?: number
) {
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
                .update(newProductEventPage)
                .set({
                    isDeleted: true,
                    deletedAt: new Date(),
                })
                .where(eq(newProductEventPage.productId, productId));

            if (!result) {
                return { success: false, error: "Featured product not found" };
            }

            // Update isStyleWithSubstanceMen to false in products table
            await db
                .update(products)
                .set({ isAddedInEventProductPage: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product removed from Event Exibition list",
            };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(newProductEventPage)
                .where(eq(newProductEventPage.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return {
                    success: false,
                    error: "Product is already in Event Exibition",
                };
            }

            const targetPosition = await resolveSectionPosition(
                newProductEventPage,
                position,
                existing?.position
            );

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(newProductEventPage)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        position: targetPosition,
                    })
                    .where(eq(newProductEventPage.productId, productId));
            } else {
                // Add new entry
                await db.insert(newProductEventPage).values({
                    productId,
                    position: targetPosition,
                });
            }

            // Update isHomeAndLivingSectionTopPicks to true in products table
            await db
                .update(products)
                .set({ isAddedInEventProductPage: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return {
                success: true,
                message: "Product added to Event Exibition list",
            };
        }
    } catch (error) {
        console.error("Error toggling Event Exibition status:", error);
        return {
            success: false,
            error: "Failed to update Event Exibition status",
        };
    }
}

export async function toggleBestSeller(
    productId: string,
    position?: number
) {
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

        const nextBestSellerState = !existingProduct.isBestSeller;

        const normalizedPosition = normalizePosition(position);
        const fallbackBestSellerPosition =
            existingProduct.bestSellerPosition > 0
                ? existingProduct.bestSellerPosition
                : (await db.$count(products, eq(products.isBestSeller, true))) +
                  1;

        // Toggle based on DB value (prevents stale UI state issues)
        await db
            .update(products)
            .set(
                nextBestSellerState
                    ? {
                          isBestSeller: true,
                          bestSellerPosition:
                              normalizedPosition ?? fallbackBestSellerPosition,
                      }
                    : { isBestSeller: false }
            )
            .where(eq(products.id, productId));

        const updatedProduct = await db
            .select({ isBestSeller: products.isBestSeller })
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!updatedProduct) {
            return {
                success: false,
                error: "Failed to verify updated Best Seller status",
            };
        }

        revalidatePath("/dashboard/general/products");
        revalidatePath("/");
        revalidatePath("/shop");
        return {
            success: true,
            message: updatedProduct.isBestSeller
                ? "Product added to Best Sellers"
                : "Product removed from Best Sellers",
            isBestSeller: updatedProduct.isBestSeller,
        };
    } catch (error) {
        console.error("Error toggling Best Seller status:", error);
        return { success: false, error: "Failed to update Best Seller status" };
    }
}

export async function toggleUnder999(
    productId: string,
    isUnder999: boolean,
    position?: number
) {
    try {
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        const normalizedPosition = normalizePosition(position);
        const fallbackUnder999Position =
            existingProduct.under999Position > 0
                ? existingProduct.under999Position
                : (await db.$count(products, eq(products.isUnder999, true))) + 1;

        await db
            .update(products)
            .set(
                isUnder999
                    ? { isUnder999: false }
                    : {
                          isUnder999: true,
                          // Keep existing sequence when present; otherwise append at the end.
                          under999Position:
                              normalizedPosition ??
                              fallbackUnder999Position,
                      }
            )
            .where(eq(products.id, productId));

        revalidatePath("/dashboard/general/products");
        revalidatePath("/");
        revalidatePath("/shop");

        return {
            success: true,
            message: isUnder999
                ? "Product removed from Under 999 section"
                : "Product added to Under 999 section",
        };
    } catch (error) {
        console.error("Error toggling Under 999 status:", error);
        return { success: false, error: "Failed to update Under 999 status" };
    }
}

export async function toggleSummerCollection(
    productId: string,
    isFeatured: boolean
) {
    try {
        const existingProduct = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .then((res) => res[0]);

        if (!existingProduct) {
            return { success: false, error: "Product not found" };
        }

        await db
            .update(products)
            .set({ isSummerCollection: !isFeatured })
            .where(eq(products.id, productId));

        revalidatePath("/dashboard/general/products");
        return {
            success: true,
            message: !isFeatured
                ? "Product added to Summer Collection"
                : "Product removed from Summer Collection",
        };
    } catch (error) {
        console.error("Error toggling Summer Collection status:", error);
        return {
            success: false,
            error: "Failed to update Summer Collection status",
        };
    }
}

export type ProductSectionKey =
    | "homeHero"
    | "homeLoveThese"
    | "homeMayAlsoLike"
    | "homePageList"
    | "homeNewArrivals"
    | "featuredWomen"
    | "featuredMen"
    | "styleWithSubstanceWomen"
    | "styleWithSubstanceMen"
    | "kidsFetch"
    | "homeLivingNewArrival"
    | "homeLivingTopPicks"
    | "beautyNewArrivals"
    | "beautyTopPicks"
    | "eventPage"
    | "bestSeller"
    | "under999";

export async function getSectionPosition(
    productId: string,
    section: ProductSectionKey
) {
    try {
        if (section === "bestSeller") {
            const data = await db
                .select({
                    position: products.bestSellerPosition,
                    isActive: products.isBestSeller,
                })
                .from(products)
                .where(eq(products.id, productId))
                .then((res) => res[0]);

            if (!data || !data.isActive) {
                return { success: true, position: 0 };
            }

            return { success: true, position: data.position ?? 0 };
        }

        if (section === "under999") {
            const data = await db
                .select({
                    position: products.under999Position,
                    isActive: products.isUnder999,
                })
                .from(products)
                .where(eq(products.id, productId))
                .then((res) => res[0]);

            if (!data || !data.isActive) {
                return { success: true, position: 0 };
            }

            return { success: true, position: data.position ?? 0 };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sectionTableMap: Record<string, any> = {
            homeHero: homeProductSection,
            homeLoveThese: homeProductLoveTheseSection,
            homeMayAlsoLike: homeProductMayAlsoLikeThese,
            homePageList: homeProductPageList,
            homeNewArrivals: homeNewArrivals,
            featuredWomen: womenPageFeaturedProducts,
            featuredMen: menPageFeaturedProducts,
            styleWithSubstanceWomen: womenStyleWithSubstanceMiddlePageSection,
            styleWithSubstanceMen: menCuratedHerEssence,
            kidsFetch: kidsFreshCollectionSection,
            homeLivingNewArrival: homeandlivingNewArrival,
            homeLivingTopPicks: homeandlivingTopPicks,
            beautyNewArrivals: beautyNewArrivals,
            beautyTopPicks: beautyTopPicks,
            eventPage: newProductEventPage,
        };

        const table = sectionTableMap[section];
        if (!table) {
            return { success: false, error: "Unknown section", position: 0 };
        }

        const row = await db
            .select({
                position: table.position,
                isDeleted: table.isDeleted,
            })
            .from(table)
            .where(eq(table.productId, productId))
            .then((res) => res[0]);

        if (!row || row.isDeleted) {
            return { success: true, position: 0 };
        }

        return { success: true, position: row.position ?? 0 };
    } catch (error) {
        console.error("Error getting section position:", error);
        return { success: false, error: "Failed to get section position", position: 0 };
    }
}

export async function updateSectionPosition(
    productId: string,
    section: ProductSectionKey,
    position: number
) {
    try {
        const safePosition = normalizePosition(position) ?? 1;
        const sectionPaths: Partial<Record<ProductSectionKey, string[]>> = {
            homeHero: ["/", "/shop"],
            homeLoveThese: ["/", "/shop"],
            homeMayAlsoLike: ["/", "/shop"],
            homePageList: ["/", "/shop"],
            homeNewArrivals: ["/", "/shop"],
            featuredWomen: ["/women", "/shop"],
            featuredMen: ["/men", "/shop"],
            styleWithSubstanceWomen: ["/women", "/shop"],
            styleWithSubstanceMen: ["/men", "/shop"],
            kidsFetch: ["/kids", "/shop"],
            homeLivingNewArrival: ["/home-living", "/shop"],
            homeLivingTopPicks: ["/home-living", "/shop"],
            beautyNewArrivals: ["/beauty-personal", "/shop"],
            beautyTopPicks: ["/beauty-personal", "/shop"],
            eventPage: ["/", "/shop"],
            bestSeller: ["/", "/shop"],
            under999: ["/", "/shop"],
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sectionTableMap: Record<string, any> = {
            homeHero: homeProductSection,
            homeLoveThese: homeProductLoveTheseSection,
            homeMayAlsoLike: homeProductMayAlsoLikeThese,
            homePageList: homeProductPageList,
            homeNewArrivals: homeNewArrivals,
            featuredWomen: womenPageFeaturedProducts,
            featuredMen: menPageFeaturedProducts,
            styleWithSubstanceWomen: womenStyleWithSubstanceMiddlePageSection,
            styleWithSubstanceMen: menCuratedHerEssence,
            kidsFetch: kidsFreshCollectionSection,
            homeLivingNewArrival: homeandlivingNewArrival,
            homeLivingTopPicks: homeandlivingTopPicks,
            beautyNewArrivals: beautyNewArrivals,
            beautyTopPicks: beautyTopPicks,
            eventPage: newProductEventPage,
        };

        if (section === "bestSeller") {
            await db
                .update(products)
                .set({ bestSellerPosition: safePosition })
                .where(eq(products.id, productId));
            revalidatePath("/dashboard/general/products");
            revalidatePath("/");
            revalidatePath("/shop");
            return { success: true, message: "Best Seller position updated" };
        }

        if (section === "under999") {
            await db
                .update(products)
                .set({ under999Position: safePosition })
                .where(eq(products.id, productId));
            revalidatePath("/dashboard/general/products");
            revalidatePath("/");
            revalidatePath("/shop");
            return { success: true, message: "Under 999 position updated" };
        }

        const table = sectionTableMap[section];
        if (!table) {
            return { success: false, error: "Unknown section" };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db
            .update(table as any)
            .set({ position: safePosition })
            .where(eq((table as any).productId, productId));

        revalidatePath("/dashboard/general/products");
        for (const path of sectionPaths[section] ?? []) {
            revalidatePath(path);
        }
        return { success: true, message: "Position updated successfully" };
    } catch (error) {
        console.error("Error updating section position:", error);
        return { success: false, error: "Failed to update position" };
    }
}

