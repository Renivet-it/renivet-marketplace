import { env } from "@/../env";
import { BRAND_EVENTS } from "@/config/brand";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { brandMediaItems } from "@/lib/db/schema";
import {
    products,
    productSpecifications,
    productVariants,
    returnExchangePolicy,
} from "@/lib/db/schema/product";
import { posthog } from "@/lib/posthog/client";
import { getAdvancedRecommendations } from "@/lib/python/product-recommendation";
import { getEmbedding } from "@/lib/python/sematic-search";
import {
    analytics,
    categoryCache,
    productTypeCache,
    subCategoryCache,
    userCartCache,
    userWishlistCache,
} from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { ProductReviewSubmitted } from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { generateProductSlug, generateSKU } from "@/lib/utils";
import {
    createProductJourneySchema,
    createProductSchema,
    createProductValueSchema,
    productJourneySchema,
    productSchema,
    productValueSchema,
    updateProductJourneySchema,
    updateProductMediaInputSchema,
    updateProductSchema,
    updateProductValueSchema,
} from "@/lib/validations";
import { InferenceClient } from "@huggingface/inference";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";
import { hasPermission } from "../../../utils";

const token = process.env.HF_TOKEN;
if (!token) {
    console.error("HF_TOKEN environment variable is not set");
}
const client = new InferenceClient(token);

export const productsRouter = createTRPCRouter({
    getProducts: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).default(28),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
                brandIds: z.array(productSchema.shape.brandId).optional(),
                minPrice: productSchema.shape.price.optional(),
                maxPrice: productSchema.shape.price.optional(),
                categoryId: productSchema.shape.categoryId.optional(),
                subcategoryId: productSchema.shape.subcategoryId.optional(),
                productTypeId: productSchema.shape.productTypeId.optional(),
                isActive: productSchema.shape.isActive.optional(),
                isAvailable: productSchema.shape.isAvailable.optional(),
                isPublished: productSchema.shape.isPublished.optional(),
                isDeleted: productSchema.shape.isDeleted.optional(),
                verificationStatus:
                    productSchema.shape.verificationStatus.optional(),
                sortBy: z.enum(["price", "createdAt"]).optional(),
                sortOrder: z.enum(["asc", "desc"]).optional(),
                productImage: productSchema.shape.productImageFilter,
                productVisiblity: productSchema.shape.productVisiblityFilter,
                isFeaturedWomen: productSchema.shape.isFeaturedWomen,
                isFeaturedMen: productSchema.shape.isFeaturedMen,
                isStyleWithSubstanceWoMen:
                    productSchema.shape.isStyleWithSubstanceWoMen,
                isStyleWithSubstanceMen:
                    productSchema.shape.isStyleWithSubstanceMen,
                iskidsFetchSection: productSchema.shape.iskidsFetchSection,
                isHomeAndLivingSectionNewArrival:
                    productSchema.shape.isHomeAndLivingSectionNewArrival,
                isHomeAndLivingSectionTopPicks:
                    productSchema.shape.isHomeAndLivingSectionTopPicks,
                isBeautyNewArrival: productSchema.shape.isBeautyNewArrival,
                isBeautyTopPicks: productSchema.shape.isBeautyTopPicks,
                isHomeNewArrival: productSchema.shape.isHomeNewArrival,
                isAddedInEventProductPage:
                    productSchema.shape.isAddedInEventProductPage,
                isHomeHeroProducts: productSchema.shape.isHomeHeroProducts,
                isHomeYouMayAlsoLikeTheseProducts:
                    productSchema.shape.isHomeYouMayAlsoLikeTheseProducts,
                isHomePageProduct: productSchema.shape.isHomePageProduct,
                isHomeLoveTheseProducts:
                    productSchema.shape.isHomeLoveTheseProducts,
                colors: z.array(z.string()).optional(),
                sizes: z.array(z.string()).optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.products.getProducts(input);
            return data;
        }),
    getAllCatalogueProducts: publicProcedure
        .input(
            z.object({
                search: z.string().optional(),
                brandIds: z.array(productSchema.shape.brandId).optional(),
                minPrice: productSchema.shape.price.optional(),
                maxPrice: productSchema.shape.price.optional(),
                categoryId: productSchema.shape.categoryId.optional(),
                subcategoryId: productSchema.shape.subcategoryId.optional(),
                productTypeId: productSchema.shape.productTypeId.optional(),
                isActive: productSchema.shape.isActive.optional(),
                isAvailable: productSchema.shape.isAvailable.optional(),
                isPublished: productSchema.shape.isPublished.optional(),
                verificationStatus:
                    productSchema.shape.verificationStatus.optional(),
                sortBy: z.enum(["price", "createdAt"]).optional(),
                sortOrder: z.enum(["asc", "desc"]).optional(),
                productImage: productSchema.shape.productImageFilter,
                productVisiblity: productSchema.shape.productVisiblityFilter,
                isFeaturedWomen: productSchema.shape.isFeaturedWomen,
                isFeaturedMen: productSchema.shape.isFeaturedMen,
                isStyleWithSubstanceWoMen:
                    productSchema.shape.isStyleWithSubstanceWoMen,
                isStyleWithSubstanceMen:
                    productSchema.shape.isStyleWithSubstanceMen,
                iskidsFetchSection: productSchema.shape.iskidsFetchSection,
                isHomeAndLivingSectionNewArrival:
                    productSchema.shape.isHomeAndLivingSectionNewArrival,
                isHomeAndLivingSectionTopPicks:
                    productSchema.shape.isHomeAndLivingSectionTopPicks,
                isBeautyNewArrival: productSchema.shape.isBeautyNewArrival,
                isBeautyTopPicks: productSchema.shape.isBeautyTopPicks,
                isHomeNewArrival: productSchema.shape.isHomeNewArrival,
                isAddedInEventProductPage:
                    productSchema.shape.isAddedInEventProductPage,
                isHomeHeroProducts: productSchema.shape.isHomeHeroProducts,
                isHomeYouMayAlsoLikeTheseProducts:
                    productSchema.shape.isHomeYouMayAlsoLikeTheseProducts,
                isHomePageProduct: productSchema.shape.isHomePageProduct,
                isHomeLoveTheseProducts:
                    productSchema.shape.isHomeLoveTheseProducts,
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.products.getAllCatalogueProducts(input);
            return data;
        }),
    getProduct: publicProcedure
        .input(
            z.object({
                productId: productSchema.shape.id,
                isDeleted: productSchema.shape.isDeleted.optional(),
                isAvailable: productSchema.shape.isAvailable.optional(),
                isPublished: productSchema.shape.isPublished.optional(),
                isActive: productSchema.shape.isActive.optional(),
                verificationStatus:
                    productSchema.shape.verificationStatus.optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { productId, ...rest } = input;
            const { queries } = ctx;

            const data = await queries.products.getProduct({
                productId,
                ...rest,
            });
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            return data;
        }),
    getVariants: publicProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            return await ctx.db.query.productVariants.findMany({
                where: (variants, { eq }) =>
                    eq(variants.productId, input.productId),
            });
        }),

    createProduct: protectedProcedure
        .input(createProductSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { brandId, ...product } = input;

            const [existingCategory, existingSubCategory, existingProductType] =
                await Promise.all([
                    categoryCache.get(product.categoryId),
                    subCategoryCache.get(product.subcategoryId),
                    productTypeCache.get(product.productTypeId),
                ]);

            if (
                !existingCategory ||
                !existingSubCategory ||
                !existingProductType
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid category, subcategory or product type",
                });

            const isSubcategoryInCategory =
                existingSubCategory.categoryId === product.categoryId;
            const isProductTypeInSubcategoryAndCategory =
                existingProductType.subCategoryId === product.subcategoryId &&
                existingProductType.categoryId === product.categoryId;

            if (
                !isSubcategoryInCategory ||
                !isProductTypeInSubcategoryAndCategory
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid category, subcategory or product type",
                });

            if (brandId !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            if (!product.productHasVariants) {
                product.nativeSku = generateSKU({
                    brand: user.brand,
                    category: existingCategory.name,
                    subcategory: existingSubCategory.name,
                    productType: existingProductType.name,
                });
            } else {
                if (!product.variants || product.variants.length === 0)
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Product variants are required",
                    });

                product.nativeSku = generateSKU({
                    brand: user.brand,
                    category: existingCategory.name,
                    subcategory: existingSubCategory.name,
                    productType: existingProductType.name,
                });

                for (const variant of product.variants) {
                    const optionCombinations = Object.entries(
                        variant.combinations
                    ).map(([optionId, valueId]) => {
                        const option = product.options.find(
                            (opt) => opt.id === optionId
                        );
                        const value = option?.values.find(
                            (val) => val.id === valueId
                        );
                        return {
                            name: option?.name ?? "",
                            value: value?.name ?? "",
                        };
                    });

                    variant.nativeSku = generateSKU({
                        brand: user.brand,
                        category: existingCategory.name,
                        subcategory: existingSubCategory.name,
                        productType: existingProductType.name,
                        options: optionCombinations,
                    });
                }
            }

            const slug = generateProductSlug(product.title, user.brand.name);

            const data = await queries.products.createProduct({
                ...product,
                slug,
                brandId,
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.CREATED,
                distinctId: user.brand.id,
                properties: {
                    brandName: user.brand.name,
                    brandOwnerId: user.id,
                    productId: data.id,
                    productTitle: data.title,
                },
            });

            await analytics.track({
                namespace: BRAND_EVENTS.PRODUCT.CREATED,
                brandId: user.brand.id,
                event: {
                    productId: data.id,
                    productTitle: data.title,
                },
            });

            return data;
        }),
    updateProductMedia: protectedProcedure
        .input(updateProductMediaInputSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, media } = input;
            const { queries, user } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const isAdmin = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.ADMINISTRATOR,
            ]);

            if (!isAdmin && existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const data = await queries.products.updateProductMedia(
                productId.toString(), // Convert to string if productId is a number
                media
            );

            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            return { success: true, product: data };
        }),
    bulkCreateProducts: protectedProcedure
        .input(z.array(createProductSchema))
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;

            const brandIds = input.map((product) => product.brandId);
            if (new Set(brandIds).size !== 1)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "All products must belong to the same brand",
                });

            if (brandIds[0] !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            // const inputWithSlug = input.map((product) => {
            //     const slug = generateProductSlug(
            //         product.title,
            //         user.brand!.name
            //     );
            //     return { ...product, slug };
            // });

            // const data =
            //     await queries.products.bulkCreateProducts(inputWithSlug);

            // posthog.capture({
            //     event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
            //     distinctId: user.brand.id,
            //     properties: {
            //         brandName: user.brand.name,
            //         brandOwnerId: user.id,
            //         productIds: data.map((product) => product.id),
            //         productTitles: data.map((product) => product.title),
            //     },
            // });

            // return data;
            // Extract SKUs from input products
            const inputSKUs = input.map((product) => product.sku);

            // Fetch existing products with matching SKUs
            const existingProducts = await ctx.db.query.products.findMany({
                where: (products, { and, inArray, eq }) =>
                    and(
                        inArray(products.sku, inputSKUs as string[]),
                        eq(products.brandId, brandIds[0])
                    ),
            });
            // Create a map of existing SKUs for quick lookup
            const existingSKUMap = new Map(
                existingProducts.map((p) => [p.sku, p.id])
            );
            const existingReturnPolicies =
                await ctx.db.query.returnExchangePolicy.findMany({
                    where: (returnExchangePolicy, { inArray }) =>
                        inArray(
                            returnExchangePolicy.productId,
                            Array.from(existingSKUMap.values())
                        ),
                });

            // Create a map of existing return policies by productId
            const existingReturnPolicyMap = new Map(
                existingReturnPolicies.map((rp) => [rp.productId, rp])
            );
            // Fetch existing specifications for existing products
            const existingSpecifications =
                await ctx.db.query.productSpecifications.findMany({
                    where: (productSpecifications, { inArray }) =>
                        inArray(
                            productSpecifications.productId,
                            Array.from(existingSKUMap.values())
                        ),
                });

            // Create a map of existing specifications by productId
            const existingSpecificationsMap = new Map<
                string | null,
                typeof existingSpecifications
            >();
            existingSpecifications.forEach((spec) => {
                if (!existingSpecificationsMap.has(spec.productId)) {
                    existingSpecificationsMap.set(spec.productId, []);
                }
                existingSpecificationsMap.get(spec.productId)!.push(spec);
            });
            // Process updates & inserts separately
            const updatePromises = [];
            const newProducts: any[] = [];

            for (const product of input) {
                const category = await queries.categories.getCategory(
                    product.categoryId
                );
                const productTypeName =
                    await queries.productTypes.getProductType(
                        product.productTypeId
                    );
                const subCategoryName =
                    await queries.subCategories.getSubCategory(
                        product.subcategoryId
                    );
                // Generate embeddings for the product
                const specsText = (product.specifications ?? [])
                    .map((spec) => `${spec.key}:${spec.value}`)
                    .join(" ");

                const text = [
                    product.title,
                    product.description || "",
                    product.sizeAndFit || "",
                    product.metaTitle || "",
                    product.metaDescription || "",
                    product.materialAndCare || "",
                    user.brand?.name || "",
                    (product as any).category?.name ||
                        (category as any).name ||
                        "",
                    (product as any).subcategory?.name ||
                        (subCategoryName as any).name ||
                        "",
                    (product as any).productType?.name ||
                        (productTypeName as any).name ||
                        "",
                    specsText,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                console.log("Text for embedding:", text);

                let embeddings: number[] | null = null;
                if (text) {
                    try {
                        //   console.log("Calling Hugging Face API for feature extraction...");
                        //   const response = await client.featureExtraction({
                        //     model: "sentence-transformers/all-MiniLM-L6-v2",
                        //     inputs: text,
                        //   });

                        //   console.log("Hugging Face API response:", response);

                        //   const embeddingArray = Array.isArray(response) ? response : (response as any).data;
                        const embeddingArray = await getEmbedding(text);

                        if (
                            !Array.isArray(embeddingArray) ||
                            embeddingArray.length !== 384
                        ) {
                            console.error(
                                `Invalid embedding for product with SKU ${product.sku}. Response length: ${embeddingArray?.length}`
                            );
                        } else {
                            embeddings = embeddingArray;
                            console.log(
                                `Generated embedding for product ${product.sku}: ${embeddings.length} dimensions`
                            );
                        }
                    } catch (error) {
                        console.error(
                            `Error generating embedding for product with SKU ${product.sku}:`,
                            error
                        );
                    }
                } else {
                    console.warn(
                        `No text available for embedding generation for product with SKU ${product.sku}`
                    );
                }
                const existingProductId = existingSKUMap.get(product.sku);

                if (existingProductId) {
                    // If product exists, update it
                    updatePromises.push(
                        ctx.db
                            .update(products)
                            .set({
                                title: product.title,
                                description: product.description,
                                price: product.price,
                                quantity: product.quantity,
                                metaTitle: product.metaTitle,
                                metaDescription: product.metaDescription,
                                metaKeywords: product.metaKeywords,
                                hsCode: product.hsCode,
                                categoryId: product.categoryId,
                                subcategoryId: product.subcategoryId,
                                productTypeId: product.productTypeId,
                                productHasVariants: product.productHasVariants,
                                width: product.width,
                                height: product.height,
                                length: product.length,
                                weight: product.weight,
                                brandId: product.brandId,
                                embeddings,
                                updatedAt: new Date(),
                            })
                            .where(eq(products.id, existingProductId))
                    );

                    // Update or insert return exchange policy
                    const existingPolicy =
                        existingReturnPolicyMap.get(existingProductId);
                    if (existingPolicy) {
                        // Update existing return exchange policy
                        updatePromises.push(
                            ctx.db
                                .update(returnExchangePolicy)
                                .set({
                                    returnable: product.returnable,
                                    exchangeable: product.exchangeable,
                                    returnDescription:
                                        product.returnDescription,
                                    exchangeDescription:
                                        product.exchangeDescription,
                                    updatedAt: new Date(),
                                })
                                .where(
                                    eq(
                                        returnExchangePolicy.productId,
                                        existingProductId
                                    )
                                )
                        );
                    } else {
                        // Insert new return exchange policy
                        updatePromises.push(
                            ctx.db.insert(returnExchangePolicy).values({
                                id: crypto.randomUUID(),
                                productId: existingProductId,
                                returnable: product.returnable,
                                exchangeable: product.exchangeable,
                                returnDescription: product.returnDescription,
                                exchangeDescription:
                                    product.exchangeDescription,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            })
                        );
                    }
                    // Update specifications: delete existing and insert new
                    updatePromises.push(
                        ctx.db
                            .delete(productSpecifications)
                            .where(
                                eq(
                                    productSpecifications.productId,
                                    existingProductId
                                )
                            )
                    );
                    if (
                        product.specifications &&
                        product.specifications.length > 0
                    ) {
                        updatePromises.push(
                            ctx.db.insert(productSpecifications).values(
                                product.specifications.map((spec) => ({
                                    id: crypto.randomUUID(),
                                    productId: existingProductId,
                                    key: spec.key,
                                    value: spec.value,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }))
                            )
                        );
                    }

                    // Handle product variants if provided
                    //   if (product.variants && product.variants.length > 0) {
                    //     const inputVariantSKUs = product.variants.map((variant) => variant.sku);

                    //     // Fetch existing variants with matching SKUs
                    //     const existingVariants = await ctx.db.query.productVariants.findMany({
                    //         where: (productVariants, { inArray }) => inArray(productVariants.sku, inputVariantSKUs as string[]),
                    //     });
                    // console.log(existingVariants, "existingVariants");
                    //     // Map existing variants by SKU
                    //     const existingVariantMap = new Map(existingVariants.map((v) => [v.sku, v.id]));

                    // console.log(existingVariantMap, "existingVariantMap");

                    //     for (const variant of product.variants) {
                    //         const existingVariantId = existingVariantMap.get(variant.sku);

                    //         if (existingVariantId) {
                    //             // Update existing variant
                    //             updatePromises.push(
                    //                 ctx.db.update(productVariants)
                    //                     .set({
                    //                         price: variant.price,
                    //                         quantity: variant.quantity,
                    //                         weight: variant.weight,
                    //                         width: variant.width,
                    //                         height: variant.height,
                    //                         length: variant.length,
                    //                         updatedAt: new Date(),
                    //                     })
                    //                     .where(eq(productVariants.id, existingVariantId))
                    //             );
                    //         } else {
                    //             // Insert new variant
                    //             newProducts.push({
                    //                 ...variant,
                    //                 productId: existingProductId, // Link to the existing product
                    //             });
                    //         }
                    //     }
                    // }

                    if (product.variants && product.variants.length > 0) {
                        const inputVariantSKUs = product.variants.map(
                            (variant) => variant.sku
                        );
                        const existingVariants =
                            await ctx.db.query.productVariants.findMany({
                                where: (productVariants, { inArray }) =>
                                    inArray(
                                        productVariants.sku,
                                        inputVariantSKUs as string[]
                                    ),
                            });
                        const existingVariantMap = new Map(
                            existingVariants.map((v) => [v.sku, v.id])
                        );

                        for (const variant of product.variants) {
                            const existingVariantId = existingVariantMap.get(
                                variant.sku
                            );
                            if (existingVariantId) {
                                updatePromises.push(
                                    ctx.db
                                        .update(productVariants)
                                        .set({
                                            price: variant.price,
                                            quantity: variant.quantity,
                                            weight: variant.weight,
                                            width: variant.width,
                                            height: variant.height,
                                            length: variant.length,
                                            updatedAt: new Date(),
                                        })
                                        .where(
                                            eq(
                                                productVariants.id,
                                                existingVariantId
                                            )
                                        )
                                );
                            } else {
                                updatePromises.push(
                                    ctx.db.insert(productVariants).values({
                                        id: variant.id || crypto.randomUUID(),
                                        productId: existingProductId,
                                        sku: variant.sku,
                                        price: variant.price,
                                        quantity: variant.quantity,
                                        weight: variant.weight,
                                        width: variant.width,
                                        height: variant.height,
                                        length: variant.length,
                                        combinations: variant.combinations,
                                        nativeSku: variant.nativeSku,
                                        barcode: variant.barcode,
                                        hsCode: variant.hsCode,
                                        originCountry: variant.originCountry,
                                        image: variant.image,
                                        isDeleted: false,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    })
                                );
                            }
                        }
                    }
                } else {
                    const slug = generateProductSlug(
                        product.title,
                        user.brand!.name
                    );
                    newProducts.push({
                        ...product,
                        slug,
                        embeddings, // Include embeddings for new product
                        returnExchangePolicy: {
                            returnable: product.returnable,
                            exchangeable: product.exchangeable,
                            returnDescription: product.returnDescription,
                            exchangeDescription: product.exchangeDescription,
                        },
                        specifications: product.specifications || [],
                    });
                }
            }

            // Execute all updates in parallel
            await Promise.all(updatePromises);

            //    // Insert new products (if any)
            //    let newData: any[] = [];
            //    if (newProducts.length > 0) {
            //        newData = await queries.products.bulkCreateProducts(newProducts as any);
            //    }
            // Insert new products (if any)
            let newData: any[] = [];

            if (newProducts.length > 0) {
                // Insert new products
                newData = await queries.products.bulkCreateProducts(
                    newProducts.map((p) => ({
                        ...p,
                        // Exclude returnExchangePolicy and specifications from product insertion
                        returnable: undefined,
                        exchangeable: undefined,
                        returnDescription: undefined,
                        exchangeDescription: undefined,
                        specifications: undefined,
                    }))
                );

                // Insert return exchange policies for new products
                const returnPolicyInserts = newData.map((product) => {
                    const inputProduct = newProducts.find(
                        (p) => p.sku === product.sku
                    );
                    return {
                        id: crypto.randomUUID(),
                        productId: product.id,
                        returnable: inputProduct?.returnable ?? false,
                        exchangeable: inputProduct?.exchangeable ?? false,
                        returnDescription:
                            inputProduct?.returnDescription ?? null,
                        exchangeDescription:
                            inputProduct?.exchangeDescription ?? null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                });

                if (returnPolicyInserts.length > 0) {
                    await ctx.db
                        .insert(returnExchangePolicy)
                        .values(returnPolicyInserts);
                }

                // Insert specifications for new products
                const specificationInserts = newData.flatMap((product) => {
                    const inputProduct = newProducts.find(
                        (p) => p.sku === product.sku
                    );
                    return (inputProduct?.specifications ?? []).map(
                        (spec: any) => ({
                            id: crypto.randomUUID(),
                            productId: product.id,
                            key: spec.key,
                            value: spec.value,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                    );
                });

                if (specificationInserts.length > 0) {
                    await ctx.db
                        .insert(productSpecifications)
                        .values(specificationInserts);
                }
            }

            // return data;
            // Track the event
            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
                distinctId: user.brand.id,
                properties: {
                    brandName: user.brand.name,
                    brandOwnerId: user.id,
                    productIds: newData.map((product) => product.id),
                    productTitles: newData.map((product) => product.title),
                },
            });

            return newData;
        }),
    updateProduct: protectedProcedure
        .input(
            z.object({
                productId: productSchema.shape.id,
                values: updateProductSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, values } = input;
            const { queries, user } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            // if (existingProduct.brand.id !== user.brand?.id)
            //     throw new TRPCError({
            //         code: "FORBIDDEN",
            //         message: "You are not a member of this brand",
            //     });
            const isAdmin = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.ADMINISTRATOR,
            ]);

            if (!isAdmin && existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const [existingCategory, existingSubCategory, existingProductType] =
                await Promise.all([
                    categoryCache.get(values.categoryId),
                    subCategoryCache.get(values.subcategoryId),
                    productTypeCache.get(values.productTypeId),
                ]);

            if (!existingCategory)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid category",
                });

            if (!existingSubCategory)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid subcategory",
                });

            if (!existingProductType)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid product type",
                });

            // if (
            //     existingProduct.isActive &&
            //     existingProduct.media.length === 0 &&
            //     values.media.length === 0
            // )
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one image",
            //     });

            if (values.productHasVariants) {
                if (!values.variants || values.variants.length === 0)
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Product variants are required",
                    });

                const existingVariants = existingProduct.variants;
                const newlyAddedVariants = values.variants.filter(
                    (variant) =>
                        !existingVariants.some((v) => v.id === variant.id)
                );

                for (const variant of newlyAddedVariants) {
                    const optionCombinations = Object.entries(
                        variant.combinations
                    ).map(([optionId, valueId]) => {
                        const option = values.options.find(
                            (opt) => opt.id === optionId
                        );
                        const value = option?.values.find(
                            (val) => val.id === valueId
                        );
                        return {
                            name: option?.name ?? "",
                            value: value?.name ?? "",
                        };
                    });

                    variant.nativeSku = generateSKU({
                        brand: user.brand ?? undefined,
                        category: existingCategory.name,
                        subcategory: existingSubCategory.name,
                        productType: existingProductType.name,
                        options: optionCombinations,
                    });
                }
            }

            const data = await queries.products.updateProduct(
                productId,
                values
            );
            return data;
        }),
    updateProductAvailability: protectedProcedure
        .input(
            z.object({
                productId: productSchema.shape.id,
                isAvailable: productSchema.shape.isAvailable,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, isAvailable } = input;
            const { queries, user } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const data = await queries.products.updateProductAvailability(
                productId,
                isAvailable
            );
            return data;
        }),
    updateProductPublishStatus: protectedProcedure
        .input(
            z.object({
                productId: productSchema.shape.id,
                isPublished: productSchema.shape.isPublished,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, isPublished } = input;
            const { queries, user } = ctx;

            // if (user.brand?.confidentialVerificationStatus !== "approved")
            //     throw new TRPCError({
            //         code: "FORBIDDEN",
            //         message:
            //             "You must complete the brand verification process to publish products",
            //     });

            const existingProduct = await queries.products.getProduct({
                productId,
                // isDeleted: tr,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            // if (existingProduct.brand.id !== user.brand?.id)
            //     throw new TRPCError({
            //         code: "FORBIDDEN",
            //         message: "You are not a member of this brand",
            //     });

            if (existingProduct.isPublished && !isPublished)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "You cannot unpublish a product that is already published, to unlist make the product inactive",
                });

            // if (existingProduct.media.length === 0)
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one image",
            //     });

            const data = await queries.products.updateProductPublishStatus(
                productId,
                isPublished
            );

            // posthog.capture({
            //     event: POSTHOG_EVENTS.PRODUCT.PUBLISHED,
            //     distinctId: user.brand.id,
            //     properties: {
            //         brandName: user.brand.name,
            //         brandOwnerId: user.id,
            //         productId: data.id,
            //         productTitle: data.title,
            //     },
            // });

            return data;
        }),
    updateProductActivationStatus: protectedProcedure
        .input(
            z.object({
                productId: productSchema.shape.id,
                isActive: productSchema.shape.isActive,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, isActive } = input;
            const { queries, user } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            // if (
            //     !existingProduct.isActive &&
            //     isActive &&
            //     existingProduct.media.length === 0
            // )
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one image",
            //     });

            const data = await queries.products.updateProductActivationStatus(
                productId,
                isActive
            );
            return data;
        }),
    sendProductForReview: protectedProcedure
        .input(z.object({ productId: productSchema.shape.id }))
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries, user, schemas, db } = ctx;

            const existingProduct = await db.query.products.findFirst({
                with: { brand: true, journey: true, values: true },
                where: and(
                    eq(schemas.products.id, productId),
                    eq(schemas.products.isDeleted, false),
                    or(
                        eq(schemas.products.verificationStatus, "idle"),
                        eq(schemas.products.verificationStatus, "rejected")
                    )
                ),
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            if (
                existingProduct.verificationStatus === "rejected" &&
                existingProduct.lastReviewedAt &&
                new Date(existingProduct.lastReviewedAt).getTime() >
                    Date.now() - 1000 * 60 * 60 * 24 * 3
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Product was rejected on ${format(
                        new Date(existingProduct.lastReviewedAt),
                        "MMMM dd, yyyy"
                    )}. You still have to wait for ${
                        3 -
                        Math.floor(
                            (Date.now() -
                                new Date(
                                    existingProduct.lastReviewedAt
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                        )
                    } days before you can resend for review`,
                });

            // if (existingProduct.media.length === 0)
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one image",
            //     });

            // if (
            //     !existingProduct.journey ||
            //     existingProduct.journey.data?.length === 0
            // )
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one product journey",
            //     });

            // if (
            //     !existingProduct.values ||
            //     existingProduct.values.data?.length === 0
            // )
            //     throw new TRPCError({
            //         code: "BAD_REQUEST",
            //         message: "Product must have at least one product value",
            //     });

            const data = await queries.products.sendProductForReview(productId);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingProduct.brand.email,
                subject: `Product Review Request Submitted - ${existingProduct.title}`,
                react: ProductReviewSubmitted({
                    user: {
                        name: existingProduct.brand.name,
                    },
                    brand: existingProduct.brand,
                    product: {
                        title: existingProduct.title,
                    },
                }),
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.SENT_FOR_REVIEW,
                distinctId: user.brand.id,
                properties: {
                    brandName: user.brand.name,
                    brandOwnerId: user.id,
                    productId: data.id,
                    productTitle: data.title,
                },
            });

            return data;
        }),
    deleteProduct: protectedProcedure
        .input(z.object({ productId: productSchema.shape.id }))
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries, user } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId,
                isDeleted: false,
            });
            console.log(existingProduct, "existingProduct");
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            // if (existingProduct.brand.id !== user.brand?.id)
            //     throw new TRPCError({
            //         code: "FORBIDDEN",
            //         message: "You are not a member of this brand",
            //     });
            const isAdmin = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.ADMINISTRATOR,
            ]);

            if (!isAdmin && existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const [data] = await Promise.all([
                queries.products.softDeleteProduct(productId),
                userCartCache.dropAll(),
                userWishlistCache.dropAll(),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.DELETED,
                distinctId: user.brand?.id ?? user.id,
                properties: {
                    brandName: user.brand?.name ?? "Admin",
                    brandOwnerId: user.id,
                    productId: data.id,
                    productTitle: data.title,
                },
            });

            return data;
        }),
    createProductJourney: protectedProcedure
        .input(createProductJourneySchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId: input.productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.journey)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product journey already exists",
                });

            const data = await queries.products.createProductJourney(input);
            return data;
        }),
    updateProductJourney: protectedProcedure
        .input(
            z.object({
                id: productJourneySchema.shape.id,
                values: updateProductJourneySchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingProductJourney =
                await queries.products.getProductJourney(id);
            if (!existingProductJourney)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product journey not found",
                });

            const data = await queries.products.updateProductJourney(
                id,
                values
            );
            return data;
        }),
    createProductValue: protectedProcedure
        .input(createProductValueSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const existingProduct = await queries.products.getProduct({
                productId: input.productId,
                isDeleted: false,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.values)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product values already exist",
                });

            const data = await queries.products.createProductValue(input);
            return data;
        }),
    updateProductValue: protectedProcedure
        .input(
            z.object({
                id: productValueSchema.shape.id,
                values: updateProductValueSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingProductValue =
                await queries.products.getProductValue(id);
            if (!existingProductValue)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product value not found",
                });

            const data = await queries.products.updateProductValue(id, values);
            return data;
        }),

    getRecommendations: publicProcedure
        .input(
            z.object({
                productId: z.string().uuid(),
            })
        )
        .query(async ({ input }) => {
            // ✅ Call the shared axios helper inside the tRPC resolver
            try {
                const products = await getAdvancedRecommendations(
                    input.productId
                );

                // Optionally slice to respect the limit coming from input
                return products;
            } catch (err: any) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: err?.message || "Failed to fetch recommendations",
                });
            }
        }),
});
