import { hasMedia, noMedia } from "@/lib/db/helperfilter";
import { getEmbedding } from "@/lib/python/sematic-search";
import { mediaCache } from "@/lib/redis/methods";
import { convertPriceToPaise } from "@/lib/utils";
import {
    CreateProduct,
    CreateProductJourney,
    CreateProductValue,
    Product,
    ProductWithBrand,
    productWithBrandSchema,
    ReturnExchangePolicy,
    UpdateProduct,
    UpdateProductJourney,
    UpdateProductMediaInput,
    UpdateProductValue,
} from "@/lib/validations";
import { InferenceClient } from "@huggingface/inference";
import {
    and,
    asc,
    count,
    desc,
    eq,
    exists,
    gte,
    ilike,
    inArray,
    or,
    sql,
    sum,
} from "drizzle-orm";
import { db } from "..";
import {
    beautyNewArrivals,
    beautyTopPicks,
    brands,
    categories,
    homeandlivingNewArrival,
    homeandlivingTopPicks,
    homeNewArrivals,
    homeProductLoveTheseSection,
    homeProductMayAlsoLikeThese,
    homeProductPageList,
    homeProductSection,
    kidsFreshCollectionSection,
    menPageFeaturedProducts,
    newProductEventPage,
    orderItems,
    orders,
    productEvents,
    productOptions,
    products,
    productsJourney,
    productSpecifications,
    productValues,
    productVariants,
    returnExchangePolicy,
    womenPageFeaturedProducts,
} from "../schema";
import { brandQueries } from "./brand";
import { categoryQueries } from "./category";
import { productTypeQueries } from "./product-type";
import { subCategoryQueries } from "./sub-category";

const token = process.env.HF_TOKEN;
type EventFilters = {
    page?: number;
    limit?: number;
    search?: string;
    brandIds?: string[];
    colors?: string[];
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    categoryId?: string | undefined;
    subCategoryId?: string | undefined;
    productTypeId?: string | undefined;
    sortBy?: "price" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
};

const hf = new InferenceClient(token);
interface CreateWomenPageFeaturedProduct {
    productId: string;
}

interface CreateMenPageFeaturedProduct {
    productId: string;
}

interface CreateKidsFeaturedProduct {
    productId: string;
}

interface UpdateWomenPageFeaturedProduct {
    isDeleted?: boolean;
    deletedAt?: Date | null;
}
// async function getEmbedding(text: string): Promise<number[]> {
//     const response = await hf.featureExtraction({
//         model: "sentence-transformers/all-MiniLM-L6-v2",
//         inputs: text,
//     });
//     return response as number[];
// }
class ProductQuery {
    async getProductCount({
        brandId,
        isDeleted,
        isAvailable,
        isPublished,
        isActive,
        verificationStatus,
    }: {
        brandId: string;
        isDeleted?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isActive?: boolean;
        verificationStatus?: Product["verificationStatus"];
    }) {
        const data = await db.$count(
            products,
            and(
                eq(products.brandId, brandId),
                isDeleted !== undefined
                    ? eq(products.isDeleted, isDeleted)
                    : undefined,
                isAvailable !== undefined
                    ? eq(products.isAvailable, isAvailable)
                    : undefined,
                isPublished !== undefined
                    ? eq(products.isPublished, isPublished)
                    : undefined,
                isActive !== undefined
                    ? eq(products.isActive, isActive)
                    : undefined,
                verificationStatus !== undefined
                    ? eq(products.verificationStatus, verificationStatus)
                    : undefined
            )
        );
        return +data || 0;
    }

    async getAllProducts({
        brandIds,
        categoryId,
        subcategoryId,
        productTypeId,
        isActive,
        isAvailable,
        isPublished,
        isDeleted,
        verificationStatus,
    }: {
        brandIds?: string[];
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
        isActive?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isDeleted?: boolean;
        verificationStatus?: Product["verificationStatus"];
    }) {
        const filters = [
            !!brandIds?.length
                ? inArray(products.brandId, brandIds)
                : undefined,
            isActive !== undefined
                ? eq(products.isActive, isActive)
                : undefined,
            isAvailable !== undefined
                ? eq(products.isAvailable, isAvailable)
                : undefined,
            isPublished !== undefined
                ? eq(products.isPublished, isPublished)
                : undefined,
            isDeleted !== undefined
                ? eq(products.isDeleted, isDeleted)
                : undefined,
            categoryId ? eq(products.categoryId, categoryId) : undefined,
            subcategoryId
                ? eq(products.subcategoryId, subcategoryId)
                : undefined,
            productTypeId
                ? eq(products.productTypeId, productTypeId)
                : undefined,
            verificationStatus
                ? eq(products.verificationStatus, verificationStatus)
                : undefined,
        ];

        const data = await db.query.products.findMany({
            with: {
                brand: true,
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
                journey: true,
                values: true,
                returnExchangePolicy: true,
                specifications: {
                    columns: {
                        key: true,
                        value: true,
                    },
                },
            },
            where: and(...filters),
        });

        const mediaIds = new Set<string>();
        for (const product of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map((product) => ({
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
            returnable: product.returnExchangePolicy?.returnable ?? false,
            returnDescription:
                product.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                product.returnExchangePolicy?.exchangeDescription ?? null,
            specifications: product.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
            })),
        }));

        const parsed: ProductWithBrand[] = productWithBrandSchema
            .array()
            .parse(enhancedData);

        return parsed;
    }

    // async getProducts({
    //     limit,
    //     page,
    //     search,
    //     brandIds,
    //     minPrice,
    //     maxPrice,
    //     categoryId,
    //     subcategoryId,
    //     productTypeId,
    //     isActive,
    //     isAvailable,
    //     isPublished,
    //     isDeleted,
    //     verificationStatus,
    //     sortBy = "createdAt",
    //     sortOrder = "desc",
    //     productImage,
    //     productVisiblity,
    //         colors,
    //     sizes,
    // }: {
    //     limit: number;
    //     page: number;
    //     search?: string;
    //     brandIds?: string[];
    //     minPrice?: number | null;
    //     maxPrice?: number | null;
    //     categoryId?: string;
    //     subcategoryId?: string;
    //     productTypeId?: string;
    //     isActive?: boolean;
    //     isAvailable?: boolean;
    //     isPublished?: boolean;
    //     isDeleted?: boolean;
    //     verificationStatus?: Product["verificationStatus"];
    //     sortBy?: "price" | "createdAt";
    //     sortOrder?: "asc" | "desc";
    //     productImage?: Product["productImageFilter"];
    //     productVisiblity?: Product["productVisiblityFilter"];
    //         colors?: string[];
    //     sizes?: string[];
    // }) {
    //     // Price conversions
    //     minPrice = !!minPrice ? (minPrice < 0 ? 0 : convertPriceToPaise(minPrice)) : null;
    //     maxPrice = !!maxPrice ? (maxPrice > 10000 ? null : convertPriceToPaise(maxPrice)) : null;

    //     let searchQuery;
    //     if (search?.length) {
    //         const searchEmbedding = await getEmbedding(search);
    //         const highRelevanceThreshold = 0.6;
    //         const lowRelevanceThreshold = 0.8;
    //         const highRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold}`;
    //         const lowRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector BETWEEN ${highRelevanceThreshold} AND ${lowRelevanceThreshold}`;
    //         searchQuery = sql`(${highRelevanceQuery}) OR (${lowRelevanceQuery})`;
    //     }
    //    const colorOptionNames = ["Colour", "Color", "colour", "color", "COLOUR", "COLOR"];
    //     const sizeOptionNames = ["sizes", "size", "SIZE", "Size", "Sizes"];
    //     const normalizedColors = colors?.map(c => c.toLowerCase());
    // const normalizedSizes = sizes?.map(s => s.toLowerCase());
    //     const filters = [
    //         searchQuery,
    //         !!brandIds?.length ? inArray(products.brandId, brandIds) : undefined,
    //         !!minPrice
    //             ? sql`(
    //                 COALESCE(${products.price}, 0) >= ${minPrice}
    //                 OR EXISTS (
    //                     SELECT 1 FROM ${productVariants} pv
    //                     WHERE pv.product_id = ${products.id}
    //                     AND COALESCE(pv.price, 0) >= ${minPrice}
    //                     AND pv.is_deleted = false
    //                 )
    //             )`
    //             : undefined,
    //         !!maxPrice
    //             ? sql`(
    //                 COALESCE(${products.price}, 0) <= ${maxPrice}
    //                 OR EXISTS (
    //                     SELECT 1 FROM ${productVariants} pv
    //                     WHERE pv.product_id = ${products.id}
    //                     AND COALESCE(pv.price, 0) <= ${maxPrice}
    //                     AND pv.is_deleted = false
    //                 )
    //             )`
    //             : undefined,
    //         isActive !== undefined ? eq(products.isActive, isActive) : undefined,
    //         isAvailable !== undefined ? eq(products.isAvailable, isAvailable) : undefined,
    //         isPublished !== undefined ? eq(products.isPublished, isPublished) : undefined,
    //         isDeleted !== undefined ? eq(products.isDeleted, isDeleted) : undefined,
    //         categoryId ? eq(products.categoryId, categoryId) : undefined,
    //         subcategoryId ? eq(products.subcategoryId, subcategoryId) : undefined,
    //         productTypeId ? eq(products.productTypeId, productTypeId) : undefined,
    //         verificationStatus ? eq(products.verificationStatus, verificationStatus) : undefined,
    //         productImage
    //             ? productImage === "with"
    //                 ? hasMedia(products, "media")
    //                 : productImage === "without"
    //                   ? noMedia(products, "media")
    //                   : undefined
    //             : undefined,
    //         productVisiblity
    //             ? productVisiblity === "public"
    //               ? eq(products.isDeleted, false)
    //               : productVisiblity === "private"
    //               ? eq(products.isDeleted, true)
    //               : undefined
    //             : undefined,
    //              // 🟦 Color filter (for JSON object format)
    //   !!colors?.length
    //     ? sql`
    //         EXISTS (
    //           SELECT 1
    //           FROM ${productOptions} po,
    //                jsonb_to_recordset(po.values) AS item(name text)
    //           WHERE po.product_id = ${products.id}
    //             AND LOWER(po.name) IN (${sql.join(colorOptionNames.map(c => c.toLowerCase()), sql`, `)})
    //             AND LOWER(item.name) IN (${sql.join(normalizedColors!, sql`, `)})
    //         )
    //       `
    //     : undefined,

    //   // 🟩 Size filter (for JSON object format)
    //   !!sizes?.length
    //     ? sql`
    //         EXISTS (
    //           SELECT 1
    //           FROM ${productOptions} po,
    //                jsonb_to_recordset(po.values) AS item(name text)
    //           WHERE po.product_id = ${products.id}
    //             AND LOWER(po.name) IN (${sql.join(sizeOptionNames.map(c => c.toLowerCase()), sql`, `)})
    //             AND LOWER(item.name) IN (${sql.join(normalizedSizes!, sql`, `)})
    //         )
    //       `
    //     : undefined,
    //               // +++ ADDED: Conditionally push the new color and size filters +++
    //     ].filter(Boolean);
    // if (colors?.length) {
    //   filters.push(sql`
    //     EXISTS (
    //       SELECT 1
    //       FROM ${productOptions} po,
    //            jsonb_to_recordset(po.values) AS item(name text)
    //       WHERE po.product_id = ${products.id}
    //         AND LOWER(po.name) IN (${sql.join(colorOptionNames.map(c => c.toLowerCase()), sql`, `)})
    //         AND LOWER(item.name) IN (${sql.join(colors.map(c => c.toLowerCase()), sql`, `)})
    //     )
    //   `);
    // }

    // if (sizes?.length) {
    //   filters.push(sql`
    //     EXISTS (
    //       SELECT 1
    //       FROM ${productOptions} po,
    //            jsonb_to_recordset(po.values) AS item(name text)
    //       WHERE po.product_id = ${products.id}
    //         AND LOWER(po.name) IN (${sql.join(sizeOptionNames.map(c => c.toLowerCase()), sql`, `)})
    //         AND LOWER(item.name) IN (${sql.join(sizes.map(s => s.toLowerCase()), sql`, `)})
    //     )
    //   `);
    // }
    //     const orderBy = [];

    //     if (search?.length) {
    //         const searchEmbedding = await getEmbedding(search);
    //         const highRelevanceThreshold = 0.6;
    //         orderBy.push(
    //             sql`CASE
    //                 WHEN ${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold} THEN 0
    //                 ELSE 1
    //             END ASC`,
    //             sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`
    //         );
    //     }

    //     if (sortBy && sortOrder) {
    //         orderBy.push(
    //             sortBy === "price"
    //                 ? sql`
    //                     (
    //                         SELECT COALESCE(
    //                             MIN(COALESCE(pv.price, ${products.price}, 0)),
    //                             COALESCE(${products.price}, 0)
    //                         )
    //                         FROM ${productVariants} pv
    //                         WHERE pv.product_id = ${products.id}
    //                         AND pv.is_deleted = false
    //                     ) ${sortOrder === "asc" ? sql`ASC` : sql`DESC`} NULLS LAST
    //                 `
    //                 : sortOrder === "asc"
    //                   ? asc(products[sortBy])
    //                   : desc(products[sortBy])
    //         );
    //     }

    //     const data = await db.query.products.findMany({
    //         with: {
    //             brand: true,
    //             variants: true,
    //             category: true,
    //             subcategory: true,
    //             productType: true,
    //             options: true,
    //             journey: true,
    //             values: true,
    //             returnExchangePolicy: true,
    //             specifications: {
    //                 columns: {
    //                     key: true,
    //                     value: true,
    //                 },
    //             },
    //         },
    //         where: and(...filters),
    //         limit,
    //         offset: (page - 1) * limit,
    //         orderBy,
    //         extras: {
    //             count: db.$count(products, and(...filters)).as("product_count"),
    //         },
    //     });

    //     // Media handling remains the same
    //     const mediaIds = new Set<string>();
    //     for (const product of data) {
    //         product.media.forEach((media) => mediaIds.add(media.id));
    //         product.variants.forEach((variant) => {
    //             if (variant.image) mediaIds.add(variant.image);
    //         });
    //         if (product.sustainabilityCertificate)
    //             mediaIds.add(product.sustainabilityCertificate);
    //     }
    //     const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
    //     const mediaMap = new Map(
    //         mediaItems.data.map((item) => [item.id, item])
    //     );

    //     const enhancedData = data.map((product) => ({
    //         ...product,
    //         media: product.media.map((media) => ({
    //             ...media,
    //             mediaItem: mediaMap.get(media.id),
    //         })),
    //         sustainabilityCertificate: product.sustainabilityCertificate
    //             ? mediaMap.get(product.sustainabilityCertificate)
    //             : null,
    //         variants: product.variants.map((variant) => ({
    //             ...variant,
    //             mediaItem: variant.image ? mediaMap.get(variant.image) : null,
    //         })),
    //         returnable: product.returnExchangePolicy?.returnable ?? false,
    //         returnDescription:
    //             product.returnExchangePolicy?.returnDescription ?? null,
    //         exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
    //         exchangeDescription:
    //             product.returnExchangePolicy?.exchangeDescription ?? null,
    //         specifications: product.specifications.map((spec) => ({
    //             key: spec.key,
    //             value: spec.value,
    //         })),
    //     }));

    //     const parsed: ProductWithBrand[] = productWithBrandSchema
    //         .array()
    //         .parse(enhancedData);
    //     return {
    //         data: parsed,
    //         count: +data?.[0]?.count || 0,
    //     };
    // }

    // Database query method
    async getProducts({
        limit,
        page,
        search,
        brandIds,
        minPrice,
        maxPrice,
        categoryId,
        subcategoryId,
        productTypeId,
        isActive,
        isAvailable,
        isPublished,
        isDeleted,
        verificationStatus,
        sortBy = "createdAt",
        sortOrder = "desc",
        productImage,
        productVisiblity,
        colors,
        sizes,
        minDiscount,
        prioritizeBestSellers,
        requireMedia,
    }: {
        limit: number;
        page: number;
        search?: string;
        brandIds?: string[];
        minPrice?: number | null;
        maxPrice?: number | null;
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
        isActive?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isDeleted?: boolean;
        verificationStatus?: Product["verificationStatus"];
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
        productImage?: Product["productImageFilter"];
        productVisiblity?: Product["productVisiblityFilter"];
        colors?: string[];
        sizes?: string[];
        minDiscount?: number | null;
        prioritizeBestSellers?: boolean;
        requireMedia?: boolean;
    }) {
        // --- Price conversions ---
        minPrice = !!minPrice
            ? minPrice < 0
                ? 0
                : convertPriceToPaise(minPrice)
            : null;
        maxPrice = !!maxPrice ? convertPriceToPaise(maxPrice) : null;

        // --- Constants ---
        const colorOptionNames = [
            "Colour",
            "Color",
            "colour",
            "color",
            "COLOUR",
            "COLOR",
        ];
        const sizeOptionNames = ["sizes", "size", "SIZE", "Size", "Sizes"];
        const normalizedColors = colors?.map((c) => c.toLowerCase());
        const normalizedSizes = sizes?.map((s) => s.toLowerCase());
        const BRAND_MATCH_THRESHOLD = 0.28;

        let searchEmbedding: number[] | null = null;
        let topBrandMatch: {
            id: string;
            name: string;
            distance: number;
        } | null = null;

        // --- Search embedding (semantic) ---
        if (search?.length) {
            searchEmbedding = await getEmbedding(search);

            // 🔍 Detect brand intent
            const brandResult = await db.execute(sql`
      SELECT id::text AS id, name, (embeddings <=> ${JSON.stringify(searchEmbedding)}::vector) AS distance
      FROM brands
      WHERE embeddings IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    `);

            const brandRow = Array.isArray(brandResult)
                ? brandResult[0]
                : brandResult?.rows?.[0];
            if (brandRow && Number(brandRow.distance) < BRAND_MATCH_THRESHOLD) {
                topBrandMatch = {
                    id: brandRow.id,
                    name: brandRow.name,
                    distance: Number(brandRow.distance),
                };
                console.log(
                    `🔥 Brand match detected: ${topBrandMatch.name} (distance ${topBrandMatch.distance})`
                );
            }
        }

        // --- Search relevance filters ---
        let searchQuery;
        if (searchEmbedding) {
            const highRelevanceThreshold = 0.6;
            const lowRelevanceThreshold = 0.99;
            const highRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold}`;
            const lowRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector BETWEEN ${highRelevanceThreshold} AND ${lowRelevanceThreshold}`;
            searchQuery = sql`(${highRelevanceQuery}) OR (${lowRelevanceQuery})`;
        }

        // --- Build filters ---
        const filters = [
            searchQuery,
            !!brandIds?.length
                ? inArray(products.brandId, brandIds)
                : undefined,
            !!minPrice
                ? sql`(
          COALESCE(${products.price}, 0) >= ${minPrice}
          OR EXISTS (
            SELECT 1 FROM ${productVariants} pv
            WHERE pv.product_id = ${products.id}
            AND COALESCE(pv.price, 0) >= ${minPrice}
            AND pv.is_deleted = false
          )
        )`
                : undefined,
            !!maxPrice
                ? sql`(
          COALESCE(${products.price}, 0) <= ${maxPrice}
          OR EXISTS (
            SELECT 1 FROM ${productVariants} pv
            WHERE pv.product_id = ${products.id}
            AND COALESCE(pv.price, 0) <= ${maxPrice}
            AND pv.is_deleted = false
          )
        )`
                : undefined,
            isActive !== undefined
                ? eq(products.isActive, isActive)
                : undefined,
            isAvailable !== undefined
                ? eq(products.isAvailable, isAvailable)
                : undefined,
            isPublished !== undefined
                ? eq(products.isPublished, isPublished)
                : undefined,
            isDeleted !== undefined
                ? eq(products.isDeleted, isDeleted)
                : undefined,
            categoryId ? eq(products.categoryId, categoryId) : undefined,
            subcategoryId
                ? eq(products.subcategoryId, subcategoryId)
                : undefined,
            productTypeId
                ? eq(products.productTypeId, productTypeId)
                : undefined,
            verificationStatus
                ? eq(products.verificationStatus, verificationStatus)
                : undefined,
            productImage
                ? productImage === "with"
                    ? hasMedia(products, "media")
                    : productImage === "without"
                      ? noMedia(products, "media")
                      : undefined
                : undefined,
            productVisiblity
                ? productVisiblity === "public"
                    ? eq(products.isDeleted, false)
                    : productVisiblity === "private"
                      ? eq(products.isDeleted, true)
                      : undefined
                : undefined,
            !!colors?.length
                ? sql`
          EXISTS (
            SELECT 1
            FROM ${productOptions} po,
                 jsonb_to_recordset(po.values) AS item(name text)
            WHERE po.product_id = ${products.id}
              AND LOWER(po.name) IN (${sql.join(
                  colorOptionNames.map((c) => c.toLowerCase()),
                  sql`, `
              )})
              AND LOWER(item.name) IN (${sql.join(normalizedColors!, sql`, `)})
          )
        `
                : undefined,
            !!sizes?.length
                ? sql`
          EXISTS (
            SELECT 1
            FROM ${productOptions} po,
                 jsonb_to_recordset(po.values) AS item(name text)
            WHERE po.product_id = ${products.id}
              AND LOWER(po.name) IN (${sql.join(
                  sizeOptionNames.map((c) => c.toLowerCase()),
                  sql`, `
              )})
              AND LOWER(item.name) IN (${sql.join(normalizedSizes!, sql`, `)})
          )
        `
                : undefined,
            // Discount filter: only show products with discount >= minDiscount%
            // Discount = ((compare_at_price - price) / compare_at_price) * 100
            minDiscount !== undefined && minDiscount !== null && minDiscount > 0
                ? sql`(
                    -- Product-level discount check (for products without variants)
                    (
                        COALESCE(${products.compareAtPrice}, 0) > 0
                        AND COALESCE(${products.price}, 0) > 0
                        AND COALESCE(${products.compareAtPrice}, 0) > COALESCE(${products.price}, 0)
                        AND (
                            (COALESCE(${products.compareAtPrice}, 0) - COALESCE(${products.price}, 0))::float 
                            / COALESCE(${products.compareAtPrice}, 1)::float * 100
                        ) >= ${minDiscount}
                    )
                    OR
                    -- Variant-level discount check (for products with variants)
                    EXISTS (
                        SELECT 1 FROM product_variants pv
                        WHERE pv.product_id = ${products.id}
                        AND pv.is_deleted = false
                        AND COALESCE(pv.compare_at_price, 0) > 0
                        AND COALESCE(pv.price, 0) > 0
                        AND COALESCE(pv.compare_at_price, 0) > COALESCE(pv.price, 0)
                        AND (
                            (COALESCE(pv.compare_at_price, 0) - COALESCE(pv.price, 0))::float 
                            / COALESCE(pv.compare_at_price, 1)::float * 100
                        ) >= ${minDiscount}
                    )
                )`
                : undefined,
            // Filter for products with media (images) - used by shop page
            requireMedia ? hasMedia(products, "media") : undefined,
        ].filter(Boolean);

        // --- OrderBy construction ---
        const orderBy: any[] = [];

        // 🌟 Step 0: prioritize best sellers (only on page 1)
        if (prioritizeBestSellers) {
            orderBy.push(
                sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`
            );
        }

        // 🟦 Step 1: prioritize matched brand
        if (topBrandMatch) {
            orderBy.push(
                sql`CASE WHEN ${products.brandId} = ${topBrandMatch.id} THEN 0 ELSE 1 END ASC`
            );
        }

        // 🟩 Step 2: semantic relevance (embedding distance)
        if (searchEmbedding) {
            orderBy.push(
                sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`
            );
        }

        // 🟪 Step 2.5: Sort by discount percentage when discount filter is applied
        // Products with lower discount (e.g., 20%) appear first, then gradually increase
        if (
            minDiscount !== undefined &&
            minDiscount !== null &&
            minDiscount > 0
        ) {
            orderBy.push(
                sql`
                    COALESCE(
                        -- Calculate discount % from product-level pricing
                        CASE 
                            WHEN COALESCE(${products.compareAtPrice}, 0) > 0 
                                AND COALESCE(${products.price}, 0) > 0 
                                AND COALESCE(${products.compareAtPrice}, 0) > COALESCE(${products.price}, 0)
                            THEN (COALESCE(${products.compareAtPrice}, 0) - COALESCE(${products.price}, 0))::float 
                                / COALESCE(${products.compareAtPrice}, 1)::float * 100
                            ELSE NULL
                        END,
                        -- Or calculate from variant with highest discount
                        (
                            SELECT MAX(
                                (COALESCE(pv.compare_at_price, 0) - COALESCE(pv.price, 0))::float 
                                / COALESCE(pv.compare_at_price, 1)::float * 100
                            )
                            FROM product_variants pv
                            WHERE pv.product_id = ${products.id}
                            AND pv.is_deleted = false
                            AND COALESCE(pv.compare_at_price, 0) > COALESCE(pv.price, 0)
                        ),
                        0
                    ) ASC NULLS LAST
                `
            );
        }

        // 🟨 Step 3: user-selected sorting (price or createdAt)
        if (sortBy && sortOrder) {
            orderBy.push(
                sortBy === "price"
                    ? sql`
            (
              SELECT COALESCE(
                MIN(COALESCE(pv.price, ${products.price}, 0)),
                COALESCE(${products.price}, 0)
              )
              FROM ${productVariants} pv
              WHERE pv.product_id = ${products.id}
              AND pv.is_deleted = false
            ) ${sortOrder === "asc" ? sql`ASC` : sql`DESC`} NULLS LAST
          `
                    : sortOrder === "asc"
                      ? asc(products[sortBy])
                      : desc(products[sortBy])
            );
        }

        // --- Query the DB ---
        const data = await db.query.products.findMany({
            with: {
                brand: true,
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
                journey: true,
                values: true,
                returnExchangePolicy: true,
                specifications: {
                    columns: { key: true, value: true },
                },
            },
            where: and(...filters),
            limit,
            offset: (page - 1) * limit,
            orderBy,
            extras: {
                count: db.$count(products, and(...filters)).as("product_count"),
            },
        });

        // --- Media mapping ---
        const mediaIds = new Set<string>();
        for (const product of data) {
            product.media.forEach((m) => mediaIds.add(m.id));
            product.variants.forEach((v) => {
                if (v.image) mediaIds.add(v.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(mediaItems.data.map((i) => [i.id, i]));

        const enhancedData = data.map((product) => ({
            ...product,
            media: product.media.map((m) => ({
                ...m,
                mediaItem: mediaMap.get(m.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((v) => ({
                ...v,
                mediaItem: v.image ? mediaMap.get(v.image) : null,
            })),
            returnable: product.returnExchangePolicy?.returnable ?? false,
            returnDescription:
                product.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                product.returnExchangePolicy?.exchangeDescription ?? null,
            specifications: product.specifications.map((s) => ({
                key: s.key,
                value: s.value,
            })),
        }));

        const parsed: ProductWithBrand[] = productWithBrandSchema
            .array()
            .parse(enhancedData);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
            topBrandMatch, // optional — can show in frontend
        };
    }

    async getAllCatalogueProducts({
        search,
        brandIds,
        minPrice,
        maxPrice,
        categoryId,
        subcategoryId,
        productTypeId,
        isActive,
        isAvailable,
        isPublished,
        verificationStatus,
        sortBy = "createdAt",
        sortOrder = "desc",
        productImage,
        productVisiblity,
        isFeaturedWomen,
        isFeaturedMen,
        isStyleWithSubstanceWoMen,
        isStyleWithSubstanceMen,
        iskidsFetchSection,
        isHomeAndLivingSectionNewArrival,
        isHomeAndLivingSectionTopPicks,
        isBeautyNewArrival,
        isBeautyTopPicks,
        isHomeNewArrival,
        isAddedInEventProductPage,
    }: {
        search?: string;
        brandIds?: string[];
        minPrice?: number | null;
        maxPrice?: number | null;
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
        isActive?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        verificationStatus?: Product["verificationStatus"];
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
        productImage?: Product["productImageFilter"];
        productVisiblity?: Product["productVisiblityFilter"];
        isFeaturedWomen?: Product["isFeaturedWomen"];
        isFeaturedMen?: Product["isFeaturedMen"];
        isStyleWithSubstanceWoMen?: Product["isStyleWithSubstanceWoMen"];
        isStyleWithSubstanceMen?: Product["isStyleWithSubstanceMen"];
        iskidsFetchSection?: Product["iskidsFetchSection"];
        isHomeAndLivingSectionNewArrival?: Product["isHomeAndLivingSectionNewArrival"];
        isHomeAndLivingSectionTopPicks?: Product["isHomeAndLivingSectionTopPicks"];
        isBeautyNewArrival?: Product["isBeautyNewArrival"];
        isBeautyTopPicks?: Product["isBeautyTopPicks"];
        isHomeNewArrival?: Product["isHomeNewArrival"];
        isAddedInEventProductPage?: Product["isAddedInEventProductPage"];
    }) {
        // Price conversions
        minPrice = !!minPrice
            ? minPrice < 0
                ? 0
                : convertPriceToPaise(minPrice)
            : null;
        maxPrice = !!maxPrice ? convertPriceToPaise(maxPrice) : null;

        let searchQuery;
        if (search?.length) {
            const searchEmbedding = await getEmbedding(search);
            const highRelevanceThreshold = 0.6;
            const lowRelevanceThreshold = 0.8;
            const highRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold}`;
            const lowRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector BETWEEN ${highRelevanceThreshold} AND ${lowRelevanceThreshold}`;
            searchQuery = sql`(${highRelevanceQuery}) OR (${lowRelevanceQuery})`;
        }

        const filters = [
            // Always exclude deleted products (assuming you have deletedAt field)
            searchQuery,
            !!brandIds?.length
                ? inArray(products.brandId, brandIds)
                : undefined,
            !!minPrice
                ? sql`(
                COALESCE(${products.price}, 0) >= ${minPrice} 
                OR EXISTS (
                    SELECT 1 FROM ${productVariants} pv
                    WHERE pv.product_id = ${products.id}
                    AND COALESCE(pv.price, 0) >= ${minPrice}
                    AND pv.is_deleted = false
                )
            )`
                : undefined,
            !!maxPrice
                ? sql`(
                COALESCE(${products.price}, 0) <= ${maxPrice}
                OR EXISTS (
                    SELECT 1 FROM ${productVariants} pv
                    WHERE pv.product_id = ${products.id}
                    AND COALESCE(pv.price, 0) <= ${maxPrice}
                    AND pv.is_deleted = false
                )
            )`
                : undefined,
            isActive !== undefined
                ? eq(products.isActive, isActive)
                : undefined,
            isAvailable !== undefined
                ? eq(products.isAvailable, isAvailable)
                : undefined,
            isPublished !== undefined
                ? eq(products.isPublished, isPublished)
                : undefined,
            categoryId ? eq(products.categoryId, categoryId) : undefined,
            subcategoryId
                ? eq(products.subcategoryId, subcategoryId)
                : undefined,
            productTypeId
                ? eq(products.productTypeId, productTypeId)
                : undefined,
            verificationStatus
                ? eq(products.verificationStatus, verificationStatus)
                : undefined,
            productImage
                ? productImage === "with"
                    ? hasMedia(products, "media")
                    : productImage === "without"
                      ? noMedia(products, "media")
                      : undefined
                : undefined,
            productVisiblity
                ? productVisiblity === "public"
                    ? eq(products.isDeleted, false)
                    : productVisiblity === "private"
                      ? eq(products.isDeleted, true)
                      : undefined
                : undefined,
            isFeaturedWomen !== undefined
                ? eq(products.isFeaturedWomen, isFeaturedWomen)
                : undefined,
            isFeaturedMen !== undefined
                ? eq(products.isFeaturedMen, isFeaturedMen)
                : undefined,
            isStyleWithSubstanceWoMen !== undefined
                ? eq(
                      products.isStyleWithSubstanceWoMen,
                      isStyleWithSubstanceWoMen
                  )
                : undefined,
            isStyleWithSubstanceMen !== undefined
                ? eq(products.isStyleWithSubstanceMen, isStyleWithSubstanceMen)
                : undefined,
            iskidsFetchSection !== undefined
                ? eq(products.iskidsFetchSection, iskidsFetchSection)
                : undefined,
            isHomeAndLivingSectionNewArrival !== undefined
                ? eq(
                      products.isHomeAndLivingSectionNewArrival,
                      isHomeAndLivingSectionNewArrival
                  )
                : undefined,
            isHomeAndLivingSectionTopPicks !== undefined
                ? eq(
                      products.isHomeAndLivingSectionTopPicks,
                      isHomeAndLivingSectionTopPicks
                  )
                : undefined,
            isBeautyNewArrival !== undefined
                ? eq(products.isBeautyNewArrival, isBeautyNewArrival)
                : undefined,
            isBeautyTopPicks !== undefined
                ? eq(products.isBeautyTopPicks, isBeautyTopPicks)
                : undefined,
            isHomeNewArrival !== undefined
                ? eq(products.isHomeNewArrival, isHomeNewArrival)
                : undefined,
            isAddedInEventProductPage !== undefined
                ? eq(
                      products.isAddedInEventProductPage,
                      isAddedInEventProductPage
                  )
                : undefined,
        ].filter(Boolean);

        const orderBy = [];

        if (search?.length) {
            const searchEmbedding = await getEmbedding(search);
            const highRelevanceThreshold = 0.6;
            orderBy.push(
                sql`CASE 
                WHEN ${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold} THEN 0 
                ELSE 1 
            END ASC`,
                sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`
            );
        }

        if (sortBy && sortOrder) {
            orderBy.push(
                sortBy === "price"
                    ? sql`
                    (
                        SELECT COALESCE(
                            MIN(COALESCE(pv.price, ${products.price}, 0)),
                            COALESCE(${products.price}, 0)
                        )
                        FROM ${productVariants} pv
                        WHERE pv.product_id = ${products.id}
                        AND pv.is_deleted = false
                    ) ${sortOrder === "asc" ? sql`ASC` : sql`DESC`} NULLS LAST
                `
                    : sortOrder === "asc"
                      ? asc(products[sortBy])
                      : desc(products[sortBy])
            );
        }

        // Use the same query structure as getProducts, but without limit and offset
        const data = await db.query.products.findMany({
            with: {
                brand: true,
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
                journey: true,
                values: true,
                returnExchangePolicy: true,
                specifications: {
                    columns: {
                        key: true,
                        value: true,
                    },
                },
            },
            where: and(...filters),
            // Remove limit and offset for getting all products
            orderBy,
        });

        // Media handling - same as getProducts
        const mediaIds = new Set<string>();
        for (const product of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }
        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map((product) => ({
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
            returnable: product.returnExchangePolicy?.returnable ?? false,
            returnDescription:
                product.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                product.returnExchangePolicy?.exchangeDescription ?? null,
            specifications: product.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
            })),
        }));

        const parsed: ProductWithBrand[] = productWithBrandSchema
            .array()
            .parse(enhancedData);
        return {
            data: parsed,
            total: parsed.length,
        };
    }
    async getProduct({
        productId,
        isDeleted,
        isAvailable,
        isPublished,
        isActive,
        verificationStatus,
    }: {
        productId: string;
        isDeleted?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isActive?: boolean;
        verificationStatus?: Product["verificationStatus"];
    }) {
        const data = await db.query.products.findFirst({
            with: {
                brand: {
                    with: {
                        packingRules: {
                            with: {
                                packingType: true,
                            },
                        },
                    },
                },
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
                journey: true,
                values: true,
                returnExchangePolicy: true,
                specifications: {
                    columns: {
                        key: true,
                        value: true,
                    },
                },
            },
            where: and(
                eq(products.id, productId),
                isDeleted !== undefined
                    ? eq(products.isDeleted, isDeleted)
                    : undefined,
                isAvailable !== undefined
                    ? eq(products.isAvailable, isAvailable)
                    : undefined,
                isPublished !== undefined
                    ? eq(products.isPublished, isPublished)
                    : undefined,
                isActive !== undefined
                    ? eq(products.isActive, isActive)
                    : undefined,
                verificationStatus !== undefined
                    ? eq(products.verificationStatus, verificationStatus)
                    : undefined
            ),
        });
        if (!data) return null;
        const mediaIds = new Set<string>();
        data.media.forEach((media) => mediaIds.add(media.id));
        data.variants.forEach((variant) => {
            if (variant.image) mediaIds.add(variant.image);
        });
        if (data.sustainabilityCertificate)
            mediaIds.add(data.sustainabilityCertificate);

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = {
            ...data,
            media: data.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: data.sustainabilityCertificate
                ? mediaMap.get(data.sustainabilityCertificate)
                : null,
            variants: data.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
            returnable: data.returnExchangePolicy?.returnable ?? false,
            returnDescription:
                data.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: data.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                data.returnExchangePolicy?.exchangeDescription ?? null,
            specifications: data.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
            })),
        };

        return productWithBrandSchema.parse(enhancedData);
    }

    async getProductBySku({
        sku,
        brandId,
        isDeleted,
        isAvailable,
        isPublished,
        isActive,
        verificationStatus,
    }: {
        sku: string;
        brandId?: string;
        isDeleted?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isActive?: boolean;
        verificationStatus?: Product["verificationStatus"];
    }) {
        const productData = await db.query.products.findFirst({
            with: {
                variants: true,
                brand: true,
            },
            where: and(
                eq(products.nativeSku, sku),
                brandId ? eq(products.brandId, brandId) : undefined,
                isDeleted !== undefined
                    ? eq(products.isDeleted, isDeleted)
                    : undefined,
                isAvailable !== undefined
                    ? eq(products.isAvailable, isAvailable)
                    : undefined,
                isPublished !== undefined
                    ? eq(products.isPublished, isPublished)
                    : undefined,
                isActive !== undefined
                    ? eq(products.isActive, isActive)
                    : undefined,
                verificationStatus !== undefined
                    ? eq(products.verificationStatus, verificationStatus)
                    : undefined
            ),
        });

        if (productData) {
            const image = productData.media[0]?.id
                ? await mediaCache.get(productData.media[0]?.id)
                : null;

            return {
                id: productData.id,
                title: productData.title,
                brand: productData.brand.name,
                variants: productData.variants.length,
                imageUrl: image?.url,
                price: productData.price || 0,
            };
        } else {
            const variantData = await db.query.productVariants.findFirst({
                with: {
                    product: {
                        with: {
                            brand: true,
                            variants: true,
                        },
                    },
                },
                where: and(
                    eq(productVariants.nativeSku, sku),
                    isDeleted !== undefined
                        ? eq(productVariants.isDeleted, isDeleted)
                        : undefined
                ),
            });

            if (!variantData) return null;
            if (
                brandId !== undefined &&
                variantData.product.brandId !== brandId
            )
                return null;
            if (
                isAvailable !== undefined &&
                variantData.product.isAvailable !== isAvailable
            )
                return null;
            if (
                isPublished !== undefined &&
                variantData.product.isPublished !== isPublished
            )
                return null;
            if (
                isActive !== undefined &&
                variantData.product.isActive !== isActive
            )
                return null;
            if (
                verificationStatus !== undefined &&
                variantData.product.verificationStatus !== verificationStatus
            )
                return null;

            const image = variantData.image
                ? await mediaCache.get(variantData.image)
                : null;

            return {
                id: variantData.productId,
                title: variantData.product.title,
                brand: variantData.product.brand.name,
                variants: variantData.product.variants.length,
                imageUrl: image?.url,
                price: variantData.price || 0,
            };
        }
    }

    async getProductBySlug({
        slug,
        isDeleted,
        isAvailable,
        isPublished,
        isActive,
        verificationStatus,
    }: {
        slug: string;
        isDeleted?: boolean;
        isAvailable?: boolean;
        isPublished?: boolean;
        isActive?: boolean;
        verificationStatus?: Product["verificationStatus"];
    }) {
        const data = await db.query.products.findFirst({
            with: {
                brand: true,
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
                journey: true,
                values: true,
                returnExchangePolicy: true,
                specifications: {
                    columns: {
                        key: true,
                        value: true,
                    },
                },
            },
            where: and(
                eq(products.slug, slug),
                isDeleted !== undefined
                    ? eq(products.isDeleted, isDeleted)
                    : undefined,
                isAvailable !== undefined
                    ? eq(products.isAvailable, isAvailable)
                    : undefined,
                isPublished !== undefined
                    ? eq(products.isPublished, isPublished)
                    : undefined,
                isActive !== undefined
                    ? eq(products.isActive, isActive)
                    : undefined,
                verificationStatus !== undefined
                    ? eq(products.verificationStatus, verificationStatus)
                    : undefined
            ),
        });
        if (!data) return null;

        const mediaIds = new Set<string>();
        data.media.forEach((media) => mediaIds.add(media.id));
        data.variants.forEach((variant) => {
            if (variant.image) mediaIds.add(variant.image);
        });
        if (data.sustainabilityCertificate)
            mediaIds.add(data.sustainabilityCertificate);

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = {
            ...data,
            media: data.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: data.sustainabilityCertificate
                ? mediaMap.get(data.sustainabilityCertificate)
                : null,
            variants: data.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
            returnable: data.returnExchangePolicy?.returnable ?? false,
            returnDescription:
                data.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: data.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                data.returnExchangePolicy?.exchangeDescription ?? null,
            specifications: data.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
            })),
        };

        return productWithBrandSchema.parse(enhancedData);
    }

    async createProduct(
        values: CreateProduct & {
            slug: string;
        }
    ) {
        const data = await db.transaction(async (tx) => {
            let categoryName = "";
            let subcategoryName = "";
            let productTypeName = "";
            let brandName = "";

            if (values.categoryId) {
                const category = await categoryQueries.getCategory(
                    values.categoryId
                );
                categoryName = category?.name || "";
            }
            if (values.brandId) {
                const brand = await brandQueries.getBrand(values.brandId);
                brandName = brand?.name || "";
            }
            if (values.subcategoryId) {
                const subcategory = await subCategoryQueries.getSubCategory(
                    values.subcategoryId
                );
                subcategoryName = subcategory?.name || "";
            }
            if (values.productTypeId) {
                const productType = await productTypeQueries.getProductType(
                    values.productTypeId
                );
                productTypeName = productType?.name || "";
            }
            // Combine fields for embedding
            const specsText = (values.specifications ?? [])
                .map((spec) => `${spec.key}:${spec.value}`)
                .join(" ");

            const text = [
                values.title,
                values.description || "",
                values.sizeAndFit || "",
                values.metaTitle || "",
                values.metaDescription || "",
                values.materialAndCare || "",
                brandName,
                categoryName || "",
                subcategoryName,
                productTypeName,
                specsText,
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

            let embeddings: number[] | null = null;
            if (text) {
                try {
                    //         console.log("Calling Hugging Face API for feature extraction...");
                    //         const response = await hf.featureExtraction({
                    //           model: "sentence-transformers/all-MiniLM-L6-v2",
                    //    inputs: text,
                    //         });

                    //         console.log("Hugging Face API response:", response);

                    // Extract the embedding array
                    // const embeddingArray = Array.isArray(response) ? response : (response as any).data;
                    const embeddingArray = await getEmbedding(text);
                    if (
                        !Array.isArray(embeddingArray) ||
                        embeddingArray.length !== 384
                    ) {
                        console.error(
                            `Invalid embedding for product with title ${values.title}. Response length: ${embeddingArray?.length}`
                        );
                    } else {
                        embeddings = embeddingArray;
                        console.log(
                            `Generated embedding for product ${values.title}: ${embeddings.length} dimensions`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error generating embedding for product with title ${values.title}:`,
                        error
                    );
                }
            } else {
                console.warn(
                    `No text available for embedding generation for product with title ${values.title}`
                );
            }

            // Insert the new product with embeddings
            const newProduct = await tx
                .insert(products)
                .values({
                    ...values,
                    embeddings, // Include embeddings in the initial insert
                })
                .returning()
                .then((res) => res[0]);

            console.log("Inserted product:", newProduct);

            console.log("Return/Exchange Policy Fields:", {
                returnable: values.returnable,
                returnDescription: values.returnDescription,
                exchangeable: values.exchangeable,
                exchangeDescription: values.exchangeDescription,
            });

            const returnPolicyData = {
                productId: newProduct.id,
                returnable: values.returnable ?? false, // Default to false if undefined
                returnDescription: values.returnDescription ?? null, // Default to null if undefined
                exchangeable: values.exchangeable ?? false, // Default to false if undefined
                exchangeDescription: values.exchangeDescription ?? null, // Default to null if undefined
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await tx.insert(returnExchangePolicy).values(returnPolicyData);

            const specifications = values.specifications ?? [];
            if (specifications.length) {
                await tx.insert(productSpecifications).values(
                    specifications.map((spec) => ({
                        productId: newProduct.id,
                        key: spec.key,
                        value: spec.value,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }))
                );
            }

            const [newOptions, newVariants] = await Promise.all([
                !!values.options.length
                    ? tx
                          .insert(productOptions)
                          .values(
                              values.options.map((option) => ({
                                  ...option,
                                  productId: newProduct.id,
                              }))
                          )
                          .returning()
                    : [],
                !!values.variants.length
                    ? tx
                          .insert(productVariants)
                          .values(
                              values.variants.map((variant) => ({
                                  ...variant,
                                  productId: newProduct.id,
                              }))
                          )
                          .returning()
                    : [],
            ]);

            return {
                ...newProduct,
                options: newOptions,
                variants: newVariants,
            };
        });

        return data;
    }

    async bulkCreateProducts(
        values: (CreateProduct & {
            slug: string;
            embeddings?: number[] | null;
        })[]
    ) {
        const data = await db.transaction(async (tx) => {
            // const newProducts = await tx
            //     .insert(products)
            //     .values(values)
            //     .returning()
            //     .then((res) => res);
            const newProducts = await tx
                .insert(products)
                .values(
                    values.map((value) => ({
                        ...value,
                        embeddings: value.embeddings, // Include embeddings
                    }))
                )
                .returning()
                .then((res) => res);

            const productOptionsToInsert = values.flatMap((value, index) =>
                value.options.map((option) => ({
                    ...option,
                    productId: newProducts[index].id,
                }))
            );
            const productVariantsToInsert = values.flatMap((value, index) =>
                value.variants.map((variant) => ({
                    ...variant,
                    productId: newProducts[index].id,
                }))
            );

            const [newOptions, newVariants] = await Promise.all([
                !!productOptionsToInsert.length
                    ? tx
                          .insert(productOptions)
                          .values(productOptionsToInsert)
                          .returning()
                    : [],
                !!productVariantsToInsert.length
                    ? tx
                          .insert(productVariants)
                          .values(productVariantsToInsert)
                          .returning()
                    : [],
            ]);

            return newProducts.map((product) => ({
                ...product,
                options: newOptions.filter((o) => o.productId === product.id),
                variants: newVariants.filter((v) => v.productId === product.id),
            }));
        });

        return data;
    }

    // async updateProduct(productId: string, values: UpdateProduct) {
    //     const data = await db.transaction(async (tx) => {
    //         const updatedProduct = await tx
    //             .update(products)
    //             .set(values)
    //             .where(eq(products.id, productId))
    //             .returning()
    //             .then((res) => res[0]);
    //         // Step 2: Extract return/exchange policy fields
    //         const {
    //             returnable,
    //             returnDescription,
    //             exchangeable,
    //             exchangeDescription,
    //         } = values;

    //         // Step 3: Check for existing return/exchange policy by productId
    //         const existingPolicy = await tx
    //             .select({ id: returnExchangePolicy.id }) // Only fetch the id for efficiency
    //             .from(returnExchangePolicy)
    //             .where(eq(returnExchangePolicy.productId, productId))
    //             .limit(1)
    //             .then((res) => res[0]);

    //         if (existingPolicy) {
    //             // Update the existing policy using its id
    //             await tx
    //                 .update(returnExchangePolicy)
    //                 .set({
    //                     returnable: returnable ?? false,
    //                     returnDescription: returnDescription ?? null,
    //                     exchangeable: exchangeable ?? false,
    //                     exchangeDescription: exchangeDescription ?? null,
    //                     updatedAt: new Date(),
    //                 })
    //                 .where(eq(returnExchangePolicy.id, existingPolicy.id));
    //         } else {
    //             // Insert a new policy if none exists
    //             await tx.insert(returnExchangePolicy).values({
    //                 productId,
    //                 returnable: returnable ?? false,
    //                 returnDescription: returnDescription ?? null,
    //                 exchangeable: exchangeable ?? false,
    //                 exchangeDescription: exchangeDescription ?? null,
    //                 createdAt: new Date(),
    //                 updatedAt: new Date(),
    //             });
    //         }
    //         const [existingOptions, existingVariants] = await Promise.all([
    //             tx.query.productOptions.findMany({
    //                 where: eq(productOptions.productId, productId),
    //             }),
    //             tx.query.productVariants.findMany({
    //                 where: eq(productVariants.productId, productId),
    //             }),
    //         ]);
    //         // Step 3: Handle specifications (simplified: delete all, then insert new)
    //         await tx
    //             .delete(productSpecifications)
    //             .where(eq(productSpecifications.productId, productId));

    //         const specifications = values.specifications ?? [];
    //         if (specifications.length) {
    //             await tx.insert(productSpecifications).values(
    //                 specifications.map((spec) => ({
    //                     productId,
    //                     key: spec.key,
    //                     value: spec.value,
    //                     createdAt: new Date(),
    //                     updatedAt: new Date(),
    //                 }))
    //             );
    //         }
    //         const optionsToBeAdded = values.options.filter(
    //             (option) => !existingOptions.find((o) => o.id === option.id)
    //         );
    //         const optionsToBeUpdated = values.options.filter((option) => {
    //             const existing = existingOptions.find(
    //                 (o) => o.id === option.id
    //             );
    //             return (
    //                 existing &&
    //                 JSON.stringify(option) !== JSON.stringify(existing)
    //             );
    //         });
    //         const optionsToBeDeleted = existingOptions.filter(
    //             (option) => !values.options.find((o) => o.id === option.id)
    //         );

    //         const variantsToBeAdded = values.variants.filter(
    //             (variant) => !existingVariants.find((v) => v.id === variant.id)
    //         );
    //         const variantsToBeUpdated = values.variants.filter((variant) => {
    //             const existing = existingVariants.find(
    //                 (v) => v.id === variant.id
    //             );
    //             return (
    //                 existing &&
    //                 JSON.stringify(variant) !== JSON.stringify(existing)
    //             );
    //         });
    //         const variantsToBeDeleted = existingVariants.filter(
    //             (variant) => !values.variants.find((v) => v.id === variant.id)
    //         );

    //         await Promise.all([
    //             optionsToBeAdded.length &&
    //                 tx.insert(productOptions).values(optionsToBeAdded),
    //             variantsToBeAdded.length &&
    //                 tx
    //                     .insert(productVariants)
    //                     .values(variantsToBeAdded)
    //                     .returning(),
    //             ...optionsToBeUpdated.map((option) =>
    //                 tx
    //                     .update(productOptions)
    //                     .set(option)
    //                     .where(
    //                         and(
    //                             eq(productOptions.productId, productId),
    //                             eq(productOptions.id, option.id)
    //                         )
    //                     )
    //             ),
    //             ...variantsToBeUpdated.map((variant) =>
    //                 tx
    //                     .update(productVariants)
    //                     .set(variant)
    //                     .where(
    //                         and(
    //                             eq(productVariants.productId, productId),
    //                             eq(productVariants.id, variant.id)
    //                         )
    //                     )
    //             ),
    //         ]);

    //         await Promise.all([
    //             tx
    //                 .update(productOptions)
    //                 .set({
    //                     isDeleted: true,
    //                     deletedAt: new Date(),
    //                     updatedAt: new Date(),
    //                 })
    //                 .where(
    //                     and(
    //                         eq(productOptions.productId, productId),
    //                         inArray(
    //                             productOptions.id,
    //                             optionsToBeDeleted.map((o) => o.id)
    //                         )
    //                     )
    //                 ),
    //             tx
    //                 .update(productVariants)
    //                 .set({
    //                     isDeleted: true,
    //                     deletedAt: new Date(),
    //                     updatedAt: new Date(),
    //                 })
    //                 .where(
    //                     and(
    //                         eq(productVariants.productId, productId),
    //                         inArray(
    //                             productVariants.id,
    //                             variantsToBeDeleted.map((v) => v.id)
    //                         )
    //                     )
    //                 ),
    //         ]);

    //         const [updatedOptions, updatedVariants] = await Promise.all([
    //             tx.query.productOptions.findMany({
    //                 where: eq(productOptions.productId, productId),
    //             }),
    //             tx.query.productVariants.findMany({
    //                 where: eq(productVariants.productId, productId),
    //             }),
    //         ]);

    //         return {
    //             ...updatedProduct,
    //             options: updatedOptions,
    //             variants: updatedVariants,
    //         };
    //     });

    //     return data;
    // }

    async updateProduct(productId: string, values: UpdateProduct) {
        try {
            const data = await db.transaction(async (tx) => {
                try {
                    // Strict validation for media: ensure it's always an array
                    const validatedMedia =
                        Array.isArray(values.media) &&
                        values.media.every(
                            (item) =>
                                item &&
                                typeof item === "object" &&
                                "id" in item &&
                                "position" in item
                        )
                            ? values.media
                            : [];

                    // If media is empty or invalid, log a warning and use a default value
                    if (!values.media || values.media.length === 0) {
                        console.warn(
                            `Media field is empty or missing for product ${productId}. Using default empty array.`
                        );
                    }
                    let categoryName = "";
                    let subcategoryName = "";
                    let productTypeName = "";
                    let brandName = "";

                    if (values.categoryId) {
                        const category = await categoryQueries.getCategory(
                            values.categoryId
                        );
                        categoryName = category?.name || "";
                    }
                    if (values.subcategoryId) {
                        const subcategory =
                            await subCategoryQueries.getSubCategory(
                                values.subcategoryId
                            );
                        subcategoryName = subcategory?.name || "";
                    }
                    if (values.productTypeId) {
                        const productType =
                            await productTypeQueries.getProductType(
                                values.productTypeId
                            );
                        productTypeName = productType?.name || "";
                    }
                    if (values.brandId) {
                        const brand = await brandQueries.getBrand(
                            values.brandId
                        );
                        brandName = brand?.name || "";
                    }

                    // Combine fields for embedding
                    const specsText = (values.specifications ?? [])
                        .map((spec) => `${spec.key}:${spec.value}`)
                        .join(" ");

                    const text = [
                        values.title || "",
                        values.description || "",
                        values.sizeAndFit || "",
                        values.metaTitle || "",
                        values.metaDescription || "",
                        values.materialAndCare || "",
                        brandName,
                        categoryName,
                        subcategoryName,
                        productTypeName,
                        specsText,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                    console.log("Text for embedding:", text);

                    let embeddings: number[] | null = null;
                    if (text) {
                        try {
                            // console.log("Calling Hugging Face API for feature extraction...");
                            // const response = await hf.featureExtraction({
                            //   model: "sentence-transformers/all-MiniLM-L6-v2",
                            //   inputs: text,
                            // });

                            // console.log("Hugging Face API response:", response);

                            // Extract the embedding array
                            // const embeddingArray = Array.isArray(response) ? response : (response as any).data;
                            const embeddingArray = await getEmbedding(text);
                            if (
                                !Array.isArray(embeddingArray) ||
                                embeddingArray.length !== 384
                            ) {
                                console.error(
                                    `Invalid embedding for product ${productId}. Response length: ${embeddingArray?.length}`
                                );
                            } else {
                                embeddings = embeddingArray;
                                console.log(
                                    `Generated embedding for product ${productId}: ${embeddings.length} dimensions`
                                );
                            }
                        } catch (error) {
                            console.error(
                                `Error generating embedding for product ${productId}:`,
                                error
                            );
                        }
                    } else {
                        console.warn(
                            `No text available for embedding generation for product ${productId}`
                        );
                    }

                    // Update product
                    let updatedProduct = await tx
                        .update(products)
                        .set({
                            ...values,
                            embeddings,
                            media: validatedMedia, // Use validated media
                            updatedAt: new Date(),
                        })
                        .where(eq(products.id, productId))
                        .returning()
                        .then((res) => res[0]);

                    if (!updatedProduct) {
                        throw new Error(
                            `Product with ID ${productId} not found or failed to update`
                        );
                    }
                    // Post-update verification: Check if media was saved correctly
                    const maxRetries = 3;
                    let retryCount = 0;
                    while (retryCount < maxRetries) {
                        if (
                            JSON.stringify(updatedProduct.media) ===
                            JSON.stringify(validatedMedia)
                        ) {
                            break; // Media was saved correctly
                        }

                        console.warn(
                            `Media not saved correctly for product ${productId}. Retrying (${retryCount + 1}/${maxRetries})...`
                        );
                        updatedProduct = await tx
                            .update(products)
                            .set({
                                ...values,
                                media: validatedMedia,
                                updatedAt: new Date(),
                            })
                            .where(eq(products.id, productId))
                            .returning()
                            .then((res) => res[0]);

                        if (!updatedProduct) {
                            throw new Error(
                                `Product with ID ${productId} not found during retry`
                            );
                        }

                        retryCount++;
                    }

                    // Final check after retries
                    if (
                        JSON.stringify(updatedProduct.media) !==
                        JSON.stringify(validatedMedia)
                    ) {
                        throw new Error(
                            `Failed to save media for product ${productId} after ${maxRetries} retries`
                        );
                    }
                    // Handle return/exchange policy
                    const {
                        returnable,
                        returnDescription,
                        exchangeable,
                        exchangeDescription,
                    } = values;

                    const existingPolicy = await tx
                        .select({ id: returnExchangePolicy.id })
                        .from(returnExchangePolicy)
                        .where(eq(returnExchangePolicy.productId, productId))
                        .limit(1)
                        .then((res) => res[0]);

                    if (existingPolicy) {
                        await tx
                            .update(returnExchangePolicy)
                            .set({
                                returnable: returnable ?? false,
                                returnDescription: returnDescription ?? null,
                                exchangeable: exchangeable ?? false,
                                exchangeDescription:
                                    exchangeDescription ?? null,
                                updatedAt: new Date(),
                            })
                            .where(
                                eq(returnExchangePolicy.id, existingPolicy.id)
                            );
                    } else {
                        await tx.insert(returnExchangePolicy).values({
                            productId,
                            returnable: returnable ?? false,
                            returnDescription: returnDescription ?? null,
                            exchangeable: exchangeable ?? false,
                            exchangeDescription: exchangeDescription ?? null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }

                    // Fetch existing options and variants
                    const [existingOptions, existingVariants] =
                        await Promise.all([
                            tx.query.productOptions
                                .findMany({
                                    where: eq(
                                        productOptions.productId,
                                        productId
                                    ),
                                })
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to fetch product options: ${err.message}`
                                    );
                                }),
                            tx.query.productVariants
                                .findMany({
                                    where: eq(
                                        productVariants.productId,
                                        productId
                                    ),
                                })
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to fetch product variants: ${err.message}`
                                    );
                                }),
                        ]);

                    // Handle specifications
                    await tx
                        .delete(productSpecifications)
                        .where(eq(productSpecifications.productId, productId))
                        .catch((err) => {
                            throw new Error(
                                `Failed to delete product specifications: ${err.message}`
                            );
                        });

                    const specifications = values.specifications ?? [];
                    if (specifications.length) {
                        await tx
                            .insert(productSpecifications)
                            .values(
                                specifications.map((spec) => ({
                                    productId,
                                    key: spec.key,
                                    value: spec.value,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }))
                            )
                            .catch((err) => {
                                throw new Error(
                                    `Failed to insert product specifications: ${err.message}`
                                );
                            });
                    }

                    // Handle options and variants
                    const optionsToBeAdded = values.options.filter(
                        (option) =>
                            !existingOptions.find((o) => o.id === option.id)
                    );
                    const optionsToBeUpdated = values.options.filter(
                        (option) => {
                            const existing = existingOptions.find(
                                (o) => o.id === option.id
                            );
                            return (
                                existing &&
                                JSON.stringify(option) !==
                                    JSON.stringify(existing)
                            );
                        }
                    );
                    const optionsToBeDeleted = existingOptions.filter(
                        (option) =>
                            !values.options.find((o) => o.id === option.id)
                    );

                    const variantsToBeAdded = values.variants.filter(
                        (variant) =>
                            !existingVariants.find((v) => v.id === variant.id)
                    );
                    const variantsToBeUpdated = values.variants.filter(
                        (variant) => {
                            const existing = existingVariants.find(
                                (v) => v.id === variant.id
                            );
                            return (
                                existing &&
                                JSON.stringify(variant) !==
                                    JSON.stringify(existing)
                            );
                        }
                    );
                    const variantsToBeDeleted = existingVariants.filter(
                        (variant) =>
                            !values.variants.find((v) => v.id === variant.id)
                    );

                    await Promise.all([
                        optionsToBeAdded.length &&
                            tx
                                .insert(productOptions)
                                .values(optionsToBeAdded)
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to insert product options: ${err.message}`
                                    );
                                }),
                        variantsToBeAdded.length &&
                            tx
                                .insert(productVariants)
                                .values(variantsToBeAdded)
                                .returning()
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to insert product variants: ${err.message}`
                                    );
                                }),
                        ...optionsToBeUpdated.map((option) =>
                            tx
                                .update(productOptions)
                                .set(option)
                                .where(
                                    and(
                                        eq(productOptions.productId, productId),
                                        eq(productOptions.id, option.id)
                                    )
                                )
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to update product option ${option.id}: ${err.message}`
                                    );
                                })
                        ),
                        ...variantsToBeUpdated.map((variant) =>
                            tx
                                .update(productVariants)
                                .set(variant)
                                .where(
                                    and(
                                        eq(
                                            productVariants.productId,
                                            productId
                                        ),
                                        eq(productVariants.id, variant.id)
                                    )
                                )
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to update product variant ${variant.id}: ${err.message}`
                                    );
                                })
                        ),
                    ]);
                    await Promise.all([
                        tx
                            .update(productOptions)
                            .set({
                                isDeleted: true,
                                deletedAt: new Date(),
                                updatedAt: new Date(),
                            })
                            .where(
                                and(
                                    eq(productOptions.productId, productId),
                                    inArray(
                                        productOptions.id,
                                        optionsToBeDeleted.map((o) => o.id)
                                    )
                                )
                            )
                            .catch((err) => {
                                throw new Error(
                                    `Failed to delete product options: ${err.message}`
                                );
                            }),
                        tx
                            .update(productVariants)
                            .set({
                                isDeleted: true,
                                deletedAt: new Date(),
                                updatedAt: new Date(),
                            })
                            .where(
                                and(
                                    eq(productVariants.productId, productId),
                                    inArray(
                                        productVariants.id,
                                        variantsToBeDeleted.map((v) => v.id)
                                    )
                                )
                            )
                            .catch((err) => {
                                throw new Error(
                                    `Failed to delete product variants: ${err.message}`
                                );
                            }),
                    ]);
                    const [updatedOptions, updatedVariants] = await Promise.all(
                        [
                            tx.query.productOptions
                                .findMany({
                                    where: eq(
                                        productOptions.productId,
                                        productId
                                    ),
                                })
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to fetch updated product options: ${err.message}`
                                    );
                                }),
                            tx.query.productVariants
                                .findMany({
                                    where: eq(
                                        productVariants.productId,
                                        productId
                                    ),
                                })
                                .catch((err) => {
                                    throw new Error(
                                        `Failed to fetch updated product variants: ${err.message}`
                                    );
                                }),
                        ]
                    );

                    return {
                        ...updatedProduct,
                        options: updatedOptions,
                        variants: updatedVariants,
                    };
                } catch (error: any) {
                    // Log the error to the server console
                    console.error(
                        `Transaction error for product ${productId}:`,
                        error.message
                    );
                    throw new Error(`Transaction failed: ${error.message}`);
                }
            });

            return data;
        } catch (error: any) {
            // Log the error to the server console
            console.error(
                `Failed to update product ${productId}:`,
                error.message
            );
            // Throw a clear error to be caught by the API handler
            throw new Error(`Unable to update product: ${error.message}`);
        }
    }

    async updateProductMedia(
        productId: string,
        media: UpdateProductMediaInput["media"]
    ) {
        const data = await db
            .update(products)
            .set({
                media,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductAvailability(productId: string, isAvailable: boolean) {
        const data = await db
            .update(products)
            .set({
                isAvailable,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductPublishStatus(productId: string, isPublished: boolean) {
        const data = await db
            .update(products)
            .set({
                isPublished,
                publishedAt: isPublished ? new Date() : null,
                isDeleted: false,
                isActive: true,
                isAvailable: true,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductActivationStatus(productId: string, isActive: boolean) {
        const data = await db
            .update(products)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    // async updateProductStock(
    //     data: {
    //         productId: string;
    //         variantId?: string;
    //         quantity: number;
    //     }[]
    // ) {
    //     const updatedData = await db.transaction(async (tx) => {
    //         const updated = await Promise.all(
    //             data.map(async (item) => {
    //                 if (item.variantId) {
    //                     const res = await tx
    //                         .update(productVariants)
    //                         .set({
    //                             quantity: item.quantity,
    //                             updatedAt: new Date(),
    //                         })
    //                         .where(
    //                             and(
    //                                 eq(
    //                                     productVariants.productId,
    //                                     item.productId
    //                                 ),
    //                                 eq(productVariants.id, item.variantId)
    //                             )
    //                         )
    //                         .returning();
    //                     return res[0];
    //                 }

    //                 const res = await tx
    //                     .update(products)
    //                     .set({
    //                         quantity: item.quantity,
    //                         updatedAt: new Date(),
    //                     })
    //                     .where(eq(products.id, item.productId))
    //                     .returning();
    //                 return res[0];
    //             })
    //         );

    //         return updated;
    //     });

    //     return updatedData;
    // }

    async updateProductStock(
        data: {
            productId: string;
            variantId?: string;
            quantity: number;
        }[]
    ) {
        try {
            const updatedData = await db.transaction(async (tx) => {
                const results = await Promise.all(
                    data.map(async (item) => {
                        try {
                            if (item.variantId) {
                                const [result] = await tx
                                    .update(productVariants)
                                    .set({
                                        quantity: sql`${productVariants.quantity} - ${item.quantity}`,
                                        updatedAt: new Date(),
                                    })
                                    .where(
                                        and(
                                            eq(
                                                productVariants.productId,
                                                item.productId
                                            ),
                                            eq(
                                                productVariants.id,
                                                item.variantId
                                            )
                                        )
                                    )
                                    .returning();
                                return { success: true, data: result };
                            } else {
                                const [result] = await tx
                                    .update(products)
                                    .set({
                                        quantity: sql`${products.quantity} - ${item.quantity}`,
                                        updatedAt: new Date(),
                                    })
                                    .where(eq(products.id, item.productId))
                                    .returning();
                                return { success: true, data: result };
                            }
                        } catch (error) {
                            return {
                                success: false,
                                productId: item.productId,
                                variantId: item.variantId,
                                error: "Update failed (silenced)",
                            };
                        }
                    })
                );
                return results;
            });

            return {
                updated: updatedData.filter((x) => x.success),
                failed: updatedData.filter((x) => !x.success),
            };
        } catch (error) {
            return {
                updated: [],
                failed: data.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    error: "Transaction failed (silenced)",
                })),
            };
        }
    }

    async sendProductForReview(productId: string) {
        const data = await db
            .update(products)
            .set({
                verificationStatus: "pending",
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async approveProduct(productId: string) {
        const data = await db
            .update(products)
            .set({
                verificationStatus: "approved",
                lastReviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async rejectProduct(productId: string, rejectionReason: string | null) {
        const data = await db
            .update(products)
            .set({
                verificationStatus: "rejected",
                rejectionReason,
                rejectedAt: new Date(),
                lastReviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async softDeleteProduct(productId: string) {
        const data = await db
            .update(products)
            .set({
                isDeleted: true,
                isActive: false,
                isPublished: false,
                isAvailable: false,
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async getProductJourney(id: string) {
        const data = await db.query.productsJourney.findFirst({
            where: eq(productsJourney.id, id),
        });

        return data;
    }

    async createProductJourney(values: CreateProductJourney) {
        const data = await db
            .insert(productsJourney)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductJourney(id: string, values: UpdateProductJourney) {
        const data = await db
            .update(productsJourney)
            .set(values)
            .where(eq(productsJourney.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async createWomenPageFeaturedProduct(
        values: CreateWomenPageFeaturedProduct
    ) {
        const data = await db
            .insert(womenPageFeaturedProducts)
            .values({
                productId: values.productId,
                isDeleted: false,
                deletedAt: null,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async removeWomenPageFeaturedProduct(productId: string) {
        const data = await db
            .update(womenPageFeaturedProducts)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(eq(womenPageFeaturedProducts.productId, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async createMenPageFeaturedProduct(values: CreateMenPageFeaturedProduct) {
        const data = await db
            .insert(menPageFeaturedProducts)
            .values({
                productId: values.productId,
                isDeleted: false,
                deletedAt: null,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async removeMenPageFeaturedProduct(productId: string) {
        const data = await db
            .update(menPageFeaturedProducts)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(eq(menPageFeaturedProducts.productId, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async removeStyleWithSubstanceWomenProduct(productId: string) {
        const data = await db
            .update(menPageFeaturedProducts)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(eq(menPageFeaturedProducts.productId, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
    async createKidsFeaturedProduct(values: CreateKidsFeaturedProduct) {
        const data = await db
            .insert(kidsFreshCollectionSection)
            .values({
                productId: values.productId,
                isDeleted: false,
                deletedAt: null,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }
    async removeKidsFeaturedProduct(productId: string) {
        const data = await db
            .update(kidsFreshCollectionSection)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(eq(kidsFreshCollectionSection.productId, productId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async getProductValue(id: string) {
        const data = await db.query.productValues.findFirst({
            where: eq(productValues.id, id),
        });

        return data;
    }

    async createProductValue(values: CreateProductValue) {
        const data = await db
            .insert(productValues)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async getWomenPageFeaturedProducts() {
        const data = await db.query.womenPageFeaturedProducts.findMany({
            where: eq(womenPageFeaturedProducts.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getMenPageFeaturedProducts() {
        const data = await db.query.menPageFeaturedProducts.findMany({
            where: eq(menPageFeaturedProducts.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getKidsPageFeaturedProducts() {
        const data = await db.query.kidsFreshCollectionSection.findMany({
            where: eq(kidsFreshCollectionSection.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomePageFeaturedProducts() {
        const data = await db.query.homeNewArrivals.findMany({
            where: eq(homeNewArrivals.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomeHeroProducts() {
        const data = await db.query.homeProductSection.findMany({
            where: eq(homeProductSection.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomeLoveTheseProducts() {
        const data = await db.query.homeProductLoveTheseSection.findMany({
            where: eq(homeProductLoveTheseSection.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomePageProducts() {
        const data = await db.query.homeProductPageList.findMany({
            where: eq(homeProductPageList.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomeYouMayAlsoLikeProducts() {
        const data = await db.query.homeProductMayAlsoLikeThese.findMany({
            where: eq(homeProductMayAlsoLikeThese.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomeAndLivingTopPicks() {
        const data = await db.query.homeandlivingTopPicks.findMany({
            where: eq(homeandlivingTopPicks.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getHomeAndLivingNewArrivals() {
        const data = await db.query.homeandlivingNewArrival.findMany({
            where: eq(homeandlivingNewArrival.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getBeautyNewArrivals() {
        const data = await db.query.beautyNewArrivals.findMany({
            where: eq(beautyNewArrivals.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    async getBeautyTopPicks() {
        const data = await db.query.beautyTopPicks.findMany({
            where: eq(beautyTopPicks.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
                ...product,
                media: product.media.map((media) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: product.variants.map((variant) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: product.specifications.map((spec) => ({
                    key: spec.key,
                    value: spec.value,
                })),
            },
        }));

        return enhancedData;
    }

    // async getNewEventPage() {
    //   const data = await db.query.newProductEventPage.findMany({
    //     where: eq(newProductEventPage.isDeleted, false),
    //     with: {
    //       product: {
    //         with: {
    //           brand: true,
    //           variants: true,
    //           returnExchangePolicy: true,
    //           specifications: true
    //         }
    //       }
    //     },
    //   });

    //   const mediaIds = new Set<string>();
    //   for (const { product } of data) {
    //     product.media.forEach((media) => mediaIds.add(media.id));
    //     product.variants.forEach((variant) => {
    //       if (variant.image) mediaIds.add(variant.image);
    //     });
    //     if (product.sustainabilityCertificate)
    //       mediaIds.add(product.sustainabilityCertificate);
    //   }

    //   const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
    //   const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));

    //   const enhancedData = data.map(({ product, ...rest }) => ({
    //     ...rest,
    //     product: {
    //       ...product,
    //       media: product.media.map((media) => ({
    //         ...media,
    //         mediaItem: mediaMap.get(media.id),
    //         url: mediaMap.get(media.id)?.url ?? null,
    //       })),
    //       sustainabilityCertificate: product.sustainabilityCertificate
    //         ? mediaMap.get(product.sustainabilityCertificate)
    //         : null,
    //       variants: product.variants.map((variant) => ({
    //         ...variant,
    //         mediaItem: variant.image ? mediaMap.get(variant.image) : null,
    //         url: variant.image ? mediaMap.get(variant.image)?.url ?? null : null,
    //       })),
    //       returnable: product.returnExchangePolicy?.returnable ?? false,
    //       returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
    //       exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
    //       exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
    //       specifications: product.specifications.map((spec) => ({
    //         key: spec.key,
    //         value: spec.value,
    //       })),
    //     },
    //   }));

    //   return enhancedData;
    // }

    //  async getProductClicks() {
    //   return db
    //     .select({
    //       productId: productEvents.productId,
    //       clicks: count(productEvents.id).as("clicks"),
    //     })
    //     .from(productEvents)
    //     .where(eq(productEvents.event, "click"))
    //     .groupBy(productEvents.productId)
    //     .orderBy(desc(count(productEvents.id)));
    // }

    // @/lib/db/queries.ts (or the file you keep productQueries in)

    async getNewEventPage(filters: EventFilters = {}) {
        const data = await db.query.newProductEventPage.findMany({
            where: eq(newProductEventPage.isDeleted, false),
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        returnExchangePolicy: true,
                        specifications: true,
                    },
                },
            },
        });

        // 2) Collect media IDs
        const mediaIds = new Set<string>();
        for (const { product } of data) {
            product.media?.forEach((m) => mediaIds.add(m.id));
            product.variants?.forEach((variant: any) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate) {
                mediaIds.add(product.sustainabilityCertificate);
            }
        }

        // 3) Resolve media from cache
        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item: any) => [item.id, item])
        );

        // 4) Enhance products with media + policies
        const enhancedData = data.map(({ product, ...rest }: any) => ({
            ...rest,
            product: {
                ...product,
                media: (product.media || []).map((media: any) => ({
                    ...media,
                    mediaItem: mediaMap.get(media.id),
                    url: mediaMap.get(media.id)?.url ?? null,
                })),
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants: (product.variants || []).map((variant: any) => ({
                    ...variant,
                    mediaItem: variant.image
                        ? mediaMap.get(variant.image)
                        : null,
                    url: variant.image
                        ? (mediaMap.get(variant.image)?.url ?? null)
                        : null,
                })),
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications: (product.specifications || []).map(
                    (spec: any) => ({
                        key: spec.key,
                        value: spec.value,
                    })
                ),
            },
        }));

        // helper: compute min/max price for a product
        const getPriceRange = (product: any) => {
            const prices = (product.variants || [])
                .map((v: any) =>
                    Number(v.price ?? v.sellingPrice ?? v.mrp ?? 0)
                )
                .filter((p: number) => !isNaN(p) && p > 0);
            if (!prices.length) return { min: 0, max: 0 };
            return { min: Math.min(...prices), max: Math.max(...prices) };
        };

        // 5) Apply in-memory filters
        const filtered = enhancedData.filter((row) => {
            const product = row.product;

            // search
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const hay = [
                    product.name,
                    product.description,
                    product.shortDescription,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }

            // brand
            if (filters.brandIds?.length) {
                if (!filters.brandIds.includes(product.brandId)) return false;
            }

            // category / subcategory / product type
            if (filters.categoryId && product.categoryId !== filters.categoryId)
                return false;
            if (
                filters.subCategoryId &&
                product.subCategoryId !== filters.subCategoryId
            )
                return false;
            if (
                filters.productTypeId &&
                product.productTypeId !== filters.productTypeId
            )
                return false;

            // colors
            if (filters.colors?.length) {
                const hasColor =
                    (product.variants || []).some((v: any) =>
                        v.color
                            ? filters.colors!.includes(String(v.color))
                            : false
                    ) ||
                    (product.media || []).some((m: any) =>
                        m.color
                            ? filters.colors!.includes(String(m.color))
                            : false
                    );
                if (!hasColor) return false;
            }

            // price range
            if (
                filters.minPrice !== undefined ||
                filters.maxPrice !== undefined
            ) {
                const pr = getPriceRange(product);
                if (
                    filters.minPrice !== undefined &&
                    pr.max < (filters.minPrice ?? 0)
                ) {
                    return false;
                }
                if (
                    filters.maxPrice !== undefined &&
                    pr.min > (filters.maxPrice ?? Number.MAX_SAFE_INTEGER)
                ) {
                    return false;
                }
            }

            return true;
        });

        // 6) Sorting
        if (filters.sortBy === "price") {
            filtered.sort((a: any, b: any) => {
                const aMin = getPriceRange(a.product).min;
                const bMin = getPriceRange(b.product).min;
                return (filters.sortOrder === "asc" ? 1 : -1) * (aMin - bMin);
            });
        } else {
            // default: createdAt
            filtered.sort((a: any, b: any) => {
                const aDate = new Date(
                    a.product.createdAt ?? a.createdAt ?? 0
                ).getTime();
                const bDate = new Date(
                    b.product.createdAt ?? b.createdAt ?? 0
                ).getTime();
                return (filters.sortOrder === "asc" ? 1 : -1) * (aDate - bDate);
            });
        }

        // 7) Pagination
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 24;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);

        return paginated;
    }

    async trackProductClick(
        productId: string,
        brandId: string,
        userId?: string
    ) {
        return db
            .insert(productEvents)
            .values({
                productId,
                brandId,
                userId: userId ?? null,
                event: "click",
                createdAt: new Date(),
            })
            .returning()
            .then((res) => res[0]);
    }
    async trackAddToCart(productId: string, brandId: string, userId?: string) {
        return db
            .insert(productEvents)
            .values({
                productId,
                brandId,
                userId: userId ?? null,
                event: "add_to_cart",
                createdAt: new Date(),
            })
            .returning()
            .then((res) => res[0]);
    }

    async trackPurchase(productId: string, brandId: string, userId?: string) {
        return db
            .insert(productEvents)
            .values({
                productId,
                brandId,
                userId: userId ?? null,
                event: "purchase",
                createdAt: new Date(),
            })
            .returning()
            .then((res) => res[0]);
    }

    // ✅ Get clicks per brand
    // async getBrandClicks() {
    //   return db
    //     .select({
    //       brandId: productEvents.brandId,
    //       clicks: count(productEvents.id).as("clicks"),
    //     })
    //     .from(productEvents)
    //     .where(eq(productEvents.event, "click"))
    //     .groupBy(productEvents.brandId);
    // }

    async updateProductValue(id: string, values: UpdateProductValue) {
        const data = await db
            .update(productValues)
            .set(values)
            .where(eq(productValues.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async getOverviewMetrics(dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);
        const [totalRevenue, totalSales, totalCustomers, conversionData] =
            await Promise.all([
                // Total Revenue (convert from paise to rupees)
                db
                    .select({ total: sum(orders.totalAmount) })
                    .from(orders)
                    .where(gte(orders.createdAt, startDate))
                    .then((res) => Number(res[0]?.total || 0) / 100),

                // Total Sales (product sales value, convert from paise to rupees)
                db
                    .select({ total: sum(orders.totalAmount) })
                    .from(orders)
                    .where(gte(orders.createdAt, startDate))
                    .then((res) => Number(res[0]?.total || 0) / 100),

                // Total Customers
                db
                    .select({ count: count() })
                    .from(orders)
                    .where(gte(orders.createdAt, startDate))
                    .then((res) => res[0]?.count || 0),

                // Conversion Data (clicks/views and purchases)
                Promise.all([
                    // Total clicks/views
                    db
                        .select({ count: count() })
                        .from(productEvents)
                        .where(
                            and(
                                inArray(productEvents.event, ["click", "view"]),
                                gte(productEvents.createdAt, startDate)
                            )
                        )
                        .then((res) => res[0]?.count || 0),
                    // Total purchases (from product_events table)
                    db
                        .select({ count: count() })
                        .from(productEvents)
                        .where(
                            and(
                                eq(productEvents.event, "purchase"),
                                gte(productEvents.createdAt, startDate)
                            )
                        )
                        .then((res) => res[0]?.count || 0),
                ]),
            ]);

        const [totalClicks, totalPurchases] = conversionData;
        const conversionRate =
            totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
        console.log("Conversion Metrics:", {
            totalClicks,
            totalPurchases,
            conversionRate,
        });

        return {
            totalRevenue,
            totalSales,
            totalCustomers,
            conversionRate: Number(conversionRate.toFixed(2)),
            // trends: {
            //     revenue: this.calculateGrowth(totalRevenue, previousData.revenue),
            //     sales: this.calculateGrowth(totalSales, previousData.sales),
            //     customers: this.calculateGrowth(totalCustomers, previousData.customers),
            //     conversion: this.calculateGrowth(conversionRate, previousData.conversion)
            // }
        };
    }

    // ✅ Get Revenue Trend Data
    async getRevenueTrend(dateRange: string = "7d") {
        const startDate = this.getStartDate(dateRange);

        const revenueData = await db
            .select({
                date: sql<string>`DATE(${orders.createdAt})`,
                brand: brands.name,
                revenue: sum(sql`${orders.totalAmount} / 100`),
            })
            .from(orders)
            .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
            .leftJoin(products, eq(orderItems.productId, products.id))
            .leftJoin(brands, eq(products.brandId, brands.id))
            .where(gte(orders.createdAt, startDate))
            .groupBy(sql`DATE(${orders.createdAt})`, brands.name)
            .orderBy(sql`DATE(${orders.createdAt})`);

        console.log("Raw SQL data:", revenueData);
        const formattedData = this.formatRevenueData(revenueData, dateRange);
        console.log("Formatted data:", formattedData);
        return formattedData;
    }

    // ✅ Get Brand Performance
    async getBrandPerformance(dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);

        return db
            .select({
                brand: brands.name,
                clicks: count(productEvents.id),
                sales: sum(sql`${orders.totalAmount} / 100`),
                products: count(products.id),
                totalOrders: count(orders.id), // Added total orders count
            })
            .from(brands)
            .leftJoin(products, eq(products.brandId, brands.id))
            .leftJoin(orderItems, eq(orderItems.productId, products.id)) // Join through order_items
            .leftJoin(orders, eq(orders.id, orderItems.orderId)) // Join orders via order_items
            .leftJoin(
                productEvents,
                and(
                    eq(productEvents.productId, products.id),
                    eq(productEvents.event, "click"),
                    gte(productEvents.createdAt, startDate)
                )
            )
            .where(gte(orders.createdAt, startDate))
            .groupBy(brands.id, brands.name)
            .orderBy(desc(sum(orders.totalAmount)));
    }

    // ✅ Get Top Products
    async getTopProducts(limit: number = 5, dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);

        return db
            .select({
                id: products.id,
                name: products.title,
                brand: brands.name,
                sales: sum(sql`${orders.totalAmount} / 100`), // Use the order total amount
                inventory: products.quantity,
                price: products.price,
            })
            .from(products)
            .innerJoin(brands, eq(products.brandId, brands.id))
            .innerJoin(orderItems, eq(orderItems.productId, products.id))
            .innerJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(orders.createdAt, startDate))
            .groupBy(
                products.id,
                products.title,
                brands.name,
                products.quantity,
                products.price
            )
            .orderBy(desc(sum(sql`${orders.totalAmount} / 100`)))
            .limit(limit);
    }

    async getTopProductsbySales(limit: number = 10, dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);

        return db
            .select({
                id: products.id,
                name: products.title,
                brand: brands.name,
                sales: sum(sql`${orders.totalAmount} / 100`),
                inventory: products.quantity,
                price: products.price,
            })
            .from(products)
            .innerJoin(brands, eq(products.brandId, brands.id))
            .innerJoin(orderItems, eq(orderItems.productId, products.id))
            .innerJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(orders.createdAt, startDate))
            .groupBy(
                products.id,
                products.title,
                brands.name,
                products.quantity,
                products.price
            )
            .orderBy(desc(sum(sql`${orders.totalAmount} / 100`)))
            .limit(limit);
    }

    async getProductsByCategory(dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);

        return db
            .select({
                category: categories.name, // Get category name instead of ID
                sales: sum(sql`${orders.totalAmount} / 100`),
                productsCount: sql`COUNT(DISTINCT ${products.id})`.as(
                    "products_count"
                ),
            })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id)) // Join with categories table
            .innerJoin(orderItems, eq(orderItems.productId, products.id))
            .innerJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(orders.createdAt, startDate))
            .groupBy(categories.name) // Group by category name instead of ID
            .orderBy(desc(sum(sql`${orders.totalAmount} / 100`)));
    }

    // ✅ Get Total Clicks (your existing method)
    async getProductClicks() {
        return db
            .select({
                productId: productEvents.productId,
                clicks: count(productEvents.id).as("clicks"),
            })
            .from(productEvents)
            .where(eq(productEvents.event, "click"))
            .groupBy(productEvents.productId)
            .orderBy(desc(count(productEvents.id)));
    }

    // ✅ Get Brand Clicks (your existing method)
    async getBrandClicks() {
        return db
            .select({
                brandId: productEvents.brandId,
                clicks: count(productEvents.id).as("clicks"),
            })
            .from(productEvents)
            .where(eq(productEvents.event, "click"))
            .groupBy(productEvents.brandId);
    }

    async getProductsForConversion(
        limit: number = 10,
        dateRange: string = "30d"
    ) {
        const startDate = this.getStartDate(dateRange);

        const conversionData = await db
            .select({
                id: products.id,
                name: products.title,
                brand: brands.name,
                sales: sum(sql`${orders.totalAmount} / 100`),
                price: products.price,
                // Count of purchase events
                purchases: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} = 'purchase' 
          THEN ${productEvents.id} 
        END)
      `.as("purchases"),
                // Count of click/view events
                clicks: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} IN ('click', 'view') 
          THEN ${productEvents.id} 
        END)
      `.as("clicks"),
            })
            .from(products)
            .innerJoin(brands, eq(products.brandId, brands.id))
            .innerJoin(productEvents, eq(productEvents.productId, products.id))
            .leftJoin(orderItems, eq(orderItems.productId, products.id))
            .leftJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(productEvents.createdAt, startDate))
            .groupBy(products.id, products.title, brands.name, products.price)
            .having(
                sql`COUNT(DISTINCT CASE WHEN ${productEvents.event} IN ('click', 'view') THEN ${productEvents.id} END) > 0`
            )
            .orderBy(desc(sum(sql`${orders.totalAmount} / 100`)))
            .limit(limit);

        return conversionData.map((product) => ({
            ...product,
            sales: Number(product.sales),
            price: Number(product.price),
            purchases: Number(product.purchases),
            clicks: Number(product.clicks),
            conversionRate:
                product.clicks > 0
                    ? (product.purchases / product.clicks) * 100
                    : 0,
        }));
    }

    async getTopProductsByClicks(
        limit: number = 10,
        dateRange: string = "30d"
    ) {
        const startDate = this.getStartDate(dateRange);

        const clickData = await db
            .select({
                id: products.id,
                name: products.title,
                brand: brands.name,
                sales: sum(sql`${orders.totalAmount} / 100`),
                price: products.price,
                purchases: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} = 'purchase' 
          THEN ${productEvents.id} 
        END)
      `.as("purchases"),
                clicks: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} IN ('click', 'view') 
          THEN ${productEvents.id} 
        END)
      `.as("clicks"),
            })
            .from(products)
            .innerJoin(brands, eq(products.brandId, brands.id))
            .innerJoin(productEvents, eq(productEvents.productId, products.id))
            .leftJoin(orderItems, eq(orderItems.productId, products.id))
            .leftJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(productEvents.createdAt, startDate))
            .groupBy(products.id, products.title, brands.name, products.price)
            .having(
                sql`
      COUNT(DISTINCT CASE WHEN ${productEvents.event} IN ('click', 'view') THEN ${productEvents.id} END) > 0
    `
            )
            .orderBy(
                desc(sql`
      COUNT(DISTINCT CASE WHEN ${productEvents.event} IN ('click', 'view') THEN ${productEvents.id} END)
    `)
            ) // ✅ Order by clicks instead of sales
            .limit(limit);

        return clickData.map((product) => ({
            ...product,
            sales: Number(product.sales),
            price: Number(product.price),
            purchases: Number(product.purchases),
            clicks: Number(product.clicks),
            conversionRate:
                product.clicks > 0
                    ? (product.purchases / product.clicks) * 100
                    : 0,
        }));
    }

    async getProductsForFunnel(limit: number = 15, dateRange: string = "30d") {
        const startDate = this.getStartDate(dateRange);

        const funnelData = await db
            .select({
                id: products.id,
                name: products.title,
                brand: brands.name,
                sales: sum(sql`${orders.totalAmount} / 100`),
                price: products.price,
                // Count of each event type
                clicks: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} IN ('click', 'view') 
          THEN ${productEvents.id} 
        END)
      `.as("clicks"),
                addToCart: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} = 'add_to_cart' 
          THEN ${productEvents.id} 
        END)
      `.as("add_to_cart"),
                purchases: sql`
        COUNT(DISTINCT CASE 
          WHEN ${productEvents.event} = 'purchase' 
          THEN ${productEvents.id} 
        END)
      `.as("purchases"),
            })
            .from(products)
            .innerJoin(brands, eq(products.brandId, brands.id))
            .innerJoin(productEvents, eq(productEvents.productId, products.id))
            .leftJoin(orderItems, eq(orderItems.productId, products.id))
            .leftJoin(orders, eq(orders.id, orderItems.orderId))
            .where(gte(productEvents.createdAt, startDate))
            .groupBy(products.id, products.title, brands.name, products.price)
            .orderBy(desc(sum(sql`${orders.totalAmount} / 100`)))
            .limit(limit);

        return funnelData.map((product) => ({
            ...product,
            sales: Number(product.sales),
            price: Number(product.price),
            clicks: Number(product.clicks),
            addToCart: Number(product.addToCart),
            purchases: Number(product.purchases),
            ctcRate:
                product.clicks > 0
                    ? (product.addToCart / product.clicks) * 100
                    : 0,
            ctpRate:
                product.addToCart > 0
                    ? (product.purchases / product.addToCart) * 100
                    : 0,
        }));
    }

    async getUniqueColors(filters?: {
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
    }): Promise<{ name: string; count: number }[]> {
        try {
            const whereConditions = [
                or(
                    ilike(productOptions.name, "%color%"),
                    ilike(productOptions.name, "%colour%"),
                    sql`LOWER(${productOptions.name}) = 'color'`,
                    sql`LOWER(${productOptions.name}) = 'colour'`
                ),
                eq(products.isDeleted, false),
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.verificationStatus, "approved"),
            ];

            if (filters?.categoryId) {
                whereConditions.push(
                    eq(products.categoryId, filters.categoryId)
                );
            }
            if (filters?.subcategoryId) {
                whereConditions.push(
                    eq(products.subcategoryId, filters.subcategoryId)
                );
            }
            if (filters?.productTypeId) {
                whereConditions.push(
                    eq(products.productTypeId, filters.productTypeId)
                );
            }

            const colorOptions = await db
                .select({
                    productId: products.id,
                    values: productOptions.values,
                })
                .from(productOptions)
                .innerJoin(products, eq(productOptions.productId, products.id))
                .where(and(...whereConditions));

            // Map: normalized color name -> { displayName, productIds Set }
            const colorDataMap = new Map<
                string,
                { displayName: string; productIds: Set<string> }
            >();

            colorOptions.forEach((option) => {
                if (option.values && Array.isArray(option.values)) {
                    (option.values as any[]).forEach((colorObj: any) => {
                        if (
                            colorObj?.name &&
                            typeof colorObj.name === "string"
                        ) {
                            const normalized = colorObj.name
                                .trim()
                                .toLowerCase();

                            if (!colorDataMap.has(normalized)) {
                                colorDataMap.set(normalized, {
                                    displayName: colorObj.name.trim(),
                                    productIds: new Set([option.productId]),
                                });
                            } else {
                                colorDataMap
                                    .get(normalized)!
                                    .productIds.add(option.productId);
                            }
                        }
                    });
                }
            });

            // Convert to array with counts and sort by count descending
            return Array.from(colorDataMap.values())
                .map(({ displayName, productIds }) => ({
                    name: displayName,
                    count: productIds.size,
                }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error("Error fetching unique colors:", error);
            return [];
        }
    }

    async getUniqueBrands(filters?: {
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
    }): Promise<{ id: string; name: string; slug: string; count: number }[]> {
        try {
            const whereConditions = [
                eq(products.isDeleted, false),
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.verificationStatus, "approved"),
                eq(brands.isActive, true),
            ];

            if (filters?.categoryId) {
                whereConditions.push(
                    eq(products.categoryId, filters.categoryId)
                );
            }
            if (filters?.subcategoryId) {
                whereConditions.push(
                    eq(products.subcategoryId, filters.subcategoryId)
                );
            }
            if (filters?.productTypeId) {
                whereConditions.push(
                    eq(products.productTypeId, filters.productTypeId)
                );
            }

            const brandsData = await db
                .select({
                    id: brands.id,
                    name: brands.name,
                    slug: brands.slug,
                    count: sql<number>`COUNT(${products.id})`.as(
                        "product_count"
                    ),
                })
                .from(products)
                .innerJoin(brands, eq(products.brandId, brands.id))
                .where(and(...whereConditions))
                .groupBy(brands.id, brands.name, brands.slug)
                .having(sql`COUNT(${products.id}) > 0`)
                .orderBy(sql`COUNT(${products.id}) DESC`);

            return brandsData
                .map((brand) => ({
                    id: brand.id,
                    name: brand.name,
                    slug: brand.slug,
                    count: Number(brand.count),
                }))
                .filter((brand) => brand.count > 0);
        } catch (error) {
            console.error("Error fetching unique brands:", error);
            return [];
        }
    }

    private normalizeSizeName(val: string): string {
        let str = val.trim().toLowerCase();

        // Replace underscores with space
        str = str.replace(/_/g, " ");

        // Normalize months
        str = str.replace(/\b(m|months?)\b/gi, "Months");

        // Normalize years
        str = str.replace(/\b(y|years?)\b/gi, "Years");

        // Remove hyphen before "Years" or "Months" if exists
        str = str.replace(/-(Years|Months)/gi, " $1");

        // Collapse multiple spaces
        str = str.replace(/\s+/g, " ").trim();

        // Capitalize first letters
        str = str.replace(/\b\w/g, (c) => c.toUpperCase());

        return str;
    }

    async getNumericSizes(filters?: {
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
    }) {
        try {
            const whereConditions = [
                or(
                    ilike(productOptions.name, "%size%"),
                    sql`LOWER(${productOptions.name}) = 'size'`,
                    sql`LOWER(${productOptions.name}) = 'sizes'`
                ),
                eq(products.isDeleted, false),
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.verificationStatus, "approved"),
            ];

            if (filters?.categoryId) {
                whereConditions.push(
                    eq(products.categoryId, filters.categoryId)
                );
            }
            if (filters?.subcategoryId) {
                whereConditions.push(
                    eq(products.subcategoryId, filters.subcategoryId)
                );
            }
            if (filters?.productTypeId) {
                whereConditions.push(
                    eq(products.productTypeId, filters.productTypeId)
                );
            }

            const sizeOptions = await db
                .select({ values: productOptions.values })
                .from(productOptions)
                .innerJoin(products, eq(productOptions.productId, products.id))
                .where(and(...whereConditions));

            const uniqueSizesMap = new Map<string, string>();

            sizeOptions.forEach((option) => {
                if (option.values && Array.isArray(option.values)) {
                    (option.values as any[]).forEach((sizeObj: any) => {
                        if (sizeObj?.name && typeof sizeObj.name === "string") {
                            const normalized = this.normalizeSizeName(
                                sizeObj.name
                            );
                            if (!uniqueSizesMap.has(normalized)) {
                                uniqueSizesMap.set(normalized, normalized);
                            }
                        }
                    });
                }
            });

            const numericSizes = Array.from(uniqueSizesMap.values()).filter(
                (val) =>
                    /(\d|\d+-\d+|\d+\s?(Months|Years)|\d{2}[A-D])/i.test(val)
            );

            return numericSizes.sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true })
            );
        } catch (error) {
            console.error("Error fetching numeric sizes:", error);
            return [];
        }
    }

    async getAlphaSizes(filters?: {
        categoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
    }) {
        try {
            const whereConditions = [
                or(
                    ilike(productOptions.name, "%size%"),
                    sql`LOWER(${productOptions.name}) = 'size'`,
                    sql`LOWER(${productOptions.name}) = 'sizes'`
                ),
                eq(products.isDeleted, false),
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.verificationStatus, "approved"),
            ];

            if (filters?.categoryId) {
                whereConditions.push(
                    eq(products.categoryId, filters.categoryId)
                );
            }
            if (filters?.subcategoryId) {
                whereConditions.push(
                    eq(products.subcategoryId, filters.subcategoryId)
                );
            }
            if (filters?.productTypeId) {
                whereConditions.push(
                    eq(products.productTypeId, filters.productTypeId)
                );
            }

            const sizeOptions = await db
                .select({
                    values: productOptions.values,
                })
                .from(productOptions)
                .innerJoin(products, eq(productOptions.productId, products.id))
                .where(and(...whereConditions));

            const uniqueSizesMap = new Map<string, string>();

            sizeOptions.forEach((option) => {
                if (option.values && Array.isArray(option.values)) {
                    (option.values as any[]).forEach((sizeObj: any) => {
                        if (sizeObj?.name && typeof sizeObj.name === "string") {
                            const normalized = sizeObj.name
                                .trim()
                                .toLowerCase();
                            if (!uniqueSizesMap.has(normalized)) {
                                uniqueSizesMap.set(
                                    normalized,
                                    sizeObj.name.trim()
                                );
                            }
                        }
                    });
                }
            });

            // Only keep alpha sizes (XS, S, M, L, XL, XXL, Free Size)
            const alphaSizes = Array.from(uniqueSizesMap.values()).filter(
                (val) => /^(xxxl|xxl|xl|l|m|s|xs|free size)$/i.test(val.trim())
            );

            // Custom order for XS → S → M → L → XL → XXL → XXXL → Free Size
            const order = [
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "XXXL",
                "Free Size",
            ];
            return alphaSizes.sort(
                (a, b) =>
                    order.indexOf(a.toUpperCase()) -
                    order.indexOf(b.toUpperCase())
            );
        } catch (error) {
            console.error("Error fetching alpha sizes:", error);
            return [];
        }
    }

    // ✅ Helper: Get Start Date based on range
    private getStartDate(dateRange: string): Date {
        const startDate = new Date();
        switch (dateRange) {
            case "7d":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(startDate.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(startDate.getDate() - 90);
                break;
            case "1y":
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }
        return startDate;
    }

    // ✅ Helper: Format Revenue Data
    private formatRevenueData(data: any[], dateRange: string) {
        const result: any[] = [];

        // ✅ Convert dateRange into days
        let days = 7; // default
        if (dateRange.endsWith("d")) {
            days = parseInt(dateRange.replace("d", ""), 10);
        } else if (dateRange.endsWith("m")) {
            const months = parseInt(dateRange.replace("m", ""), 10);
            days = months * 30; // Approximate for now
        } else if (dateRange.endsWith("y")) {
            const years = parseInt(dateRange.replace("y", ""), 10);
            days = years * 365; // Approximate for now
        }

        // ✅ Extract all unique brands
        const brands = new Set(data.map((item) => item.brand));

        // ✅ Generate list of dates for the range
        const dates = Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            return date.toISOString().split("T")[0];
        });

        console.log("Available brands:", Array.from(brands)); // Debug brands
        console.log("Date range:", dates); // Debug generated dates

        dates.forEach((date) => {
            const entry: any = { date };
            brands.forEach((brand) => {
                const brandData = data.find(
                    (d) => d.date === date && d.brand === brand
                );
                entry[brand as string] = brandData
                    ? Number(brandData.revenue)
                    : 0;
            });
            result.push(entry);
        });

        return result;
    }

    // ✅ Helper: Calculate Growth Percentage
    private calculateGrowth(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
    }

    // ✅ Helper: Get Previous Period Data (simplified)
    private async getPreviousPeriodData(startDate: Date, dateRange: string) {
        // This is a simplified version - you might want to store historical data
        const previousStart = new Date(startDate);
        previousStart.setDate(
            previousStart.getDate() - (dateRange === "7d" ? 7 : 30)
        );
        const previousEnd = new Date(startDate);
        const [revenue, sales, customers, conversion] = await Promise.all([
            db
                .select({ total: sum(orders.totalAmount) })
                .from(orders)
                .where(
                    and(
                        gte(orders.createdAt, previousStart),
                        gte(previousEnd, orders.createdAt)
                    )
                )
                .then((res) => Number(res[0]?.total || 0)),
            db
                .select({ total: sum(orders.totalAmount) })
                .from(orders)
                .where(
                    and(
                        gte(orders.createdAt, previousStart),
                        gte(previousEnd, orders.createdAt)
                    )
                )
                .then((res) => Number(res[0]?.total || 0)),
            db
                .select({ count: count() })
                .from(orders)
                .where(
                    and(
                        gte(orders.createdAt, previousStart),
                        gte(previousEnd, orders.createdAt)
                    )
                )
                .then((res) => res[0]?.count || 0),
            Promise.resolve(0), // Simplified conversion rate
        ]);

        return { revenue, sales, customers, conversion };
    }

    async getProcuctReturnExchangePolicyByProductId() {}
}

export const productQueries = new ProductQuery();
