"use server";

import { productQueries } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { womenPageFeaturedProducts, products, menPageFeaturedProducts, womenStyleWithSubstanceMiddlePageSection, menCuratedHerEssence, homeandlivingNewArrival, homeandlivingTopPicks, kidsFreshCollectionSection, beautyTopPicks, beautyNewArrivals, homeNewArrivals, newProductEventPage } from "@/lib/db/schema";
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


export async function toggleWomenStyleWithSubstance(productId: string, isStyleWithSubstanceWoMen: boolean) {
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
                .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId))
                .returning()
                .then((res) => res[0]);

            // Check if the update affected any rows
            if (!result) {
                return { success: false, error: "Product not found in Style With Substance section" };
            }

            // Update isStyleWithSubstanceWoMen to false in products table
            await db
                .update(products)
                .set({ isStyleWithSubstanceWoMen: false })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists in womenStyleWithSubstanceMiddlePageSection
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
                        deletedAt: null,
                    })
                    .where(eq(womenStyleWithSubstanceMiddlePageSection.productId, productId));
            } else {
                // Add new entry
                await db
                    .insert(womenStyleWithSubstanceMiddlePageSection)
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


export async function toggleKidsFetchSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(kidsFreshCollectionSection)
                .where(eq(kidsFreshCollectionSection.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(kidsFreshCollectionSection)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(kidsFreshCollectionSection.productId, productId));
            } else {
                // Add new entry
                await db.insert(kidsFreshCollectionSection)
                    .values({ productId });
            }

            // Update iskidsFetchSection to true in products table
            await db
                .update(products)
                .set({ iskidsFetchSection: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}


export async function toggleHomeAndLivingNewArrivalsSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeandlivingNewArrival)
                .where(eq(homeandlivingNewArrival.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeandlivingNewArrival)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(homeandlivingNewArrival.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeandlivingNewArrival)
                    .values({ productId });
            }

            // Update isHomeAndLivingSectionNewArrival to true in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionNewArrival: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}



export async function toggleHomeAndLivingTopPicksSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(homeandlivingTopPicks)
                .where(eq(homeandlivingTopPicks.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(homeandlivingTopPicks)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(homeandlivingTopPicks.productId, productId));
            } else {
                // Add new entry
                await db.insert(homeandlivingTopPicks)
                    .values({ productId });
            }

            // Update isHomeAndLivingSectionTopPicks to true in products table
            await db
                .update(products)
                .set({ isHomeAndLivingSectionTopPicks: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}






export async function toggleBeautyNewArrivalSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(beautyNewArrivals)
                .where(eq(beautyNewArrivals.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(beautyNewArrivals)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(beautyNewArrivals.productId, productId));
            } else {
                // Add new entry
                await db.insert(beautyNewArrivals)
                    .values({ productId });
            }

            // Update isBeautyNewArrival to true in products table
            await db
                .update(products)
                .set({ isBeautyNewArrival: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}




export async function toggleBeautyTopPickSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Style With Substance list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(beautyTopPicks)
                .where(eq(beautyTopPicks.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Style With Substance" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(beautyTopPicks)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(beautyTopPicks.productId, productId));
            } else {
                // Add new entry
                await db.insert(beautyTopPicks)
                    .values({ productId });
            }

            // Update isBeautyTopPicks to true in products table
            await db
                .update(products)
                .set({ isBeautyTopPicks: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Style With Substance list" };
        }
    } catch (error) {
        console.error("Error toggling Style With Substance status:", error);
        return { success: false, error: "Failed to update Style With Substance status" };
    }
}



export async function toggleHomeNewArrivalsProduct(
    productId: string,
    shouldBeActive: boolean,
    category: string // The new category parameter
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

        // This block handles REMOVING the product.
        if (!shouldBeActive) {
            // Remove from featured products (soft delete)
            await db
                .update(homeNewArrivals)
                .set({
                    isDeleted: true,
                    deletedAt: new Date()
                })
                .where(eq(homeNewArrivals.productId, productId));

            // This part is now removed as requested.
            // The 'products' table will not be updated on removal.

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product removed from New Arrivals." };
        } else {
            // This block handles ADDING or UPDATING the product.
            const existing = await db
                .select()
                .from(homeNewArrivals)
                .where(eq(homeNewArrivals.productId, productId))
                .then((res) => res[0]);

            if (existing) {
                // MODIFIED: Restore and update the category if it exists.
                await db
                    .update(homeNewArrivals)
                    .set({
                        isDeleted: false,
                        deletedAt: null,
                        category: category // Update the category
                    })
                    .where(eq(homeNewArrivals.productId, productId));
            } else {
                // MODIFIED: Add new entry with the category.
                await db.insert(homeNewArrivals)
                    .values({
                        productId: productId,
                        category: category // Insert the category
                    });
            }


            revalidatePath("/dashboard/general/products");
            return { success: true, message: `Product added to '${category}' category.` };
        }
    } catch (error) {
        console.error("Error toggling New Arrivals status:", error);
        return { success: false, error: "Failed to update New Arrivals status." };
    }
}

export async function newEventPageSection(productId: string, isFeatured: boolean) {
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
                    deletedAt: new Date()
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
            return { success: true, message: "Product removed from Event Exibition list" };
        } else {
            // Check if product already exists and is not deleted
            const existing = await db
                .select()
                .from(newProductEventPage)
                .where(eq(newProductEventPage.productId, productId))
                .then((res) => res[0]);

            if (existing && !existing.isDeleted) {
                return { success: false, error: "Product is already in Event Exibition" };
            }

            if (existing) {
                // Restore if previously soft deleted
                await db
                    .update(newProductEventPage)
                    .set({
                        isDeleted: false,
                        deletedAt: null
                    })
                    .where(eq(newProductEventPage.productId, productId));
            } else {
                // Add new entry
                await db.insert(newProductEventPage)
                    .values({ productId });
            }

            // Update isHomeAndLivingSectionTopPicks to true in products table
            await db
                .update(products)
                .set({ isAddedInEventProductPage: true })
                .where(eq(products.id, productId));

            revalidatePath("/dashboard/general/products");
            return { success: true, message: "Product added to Event Exibition list" };
        }
    } catch (error) {
        console.error("Error toggling Event Exibition status:", error);
        return { success: false, error: "Failed to update Event Exibition status" };
    }
}