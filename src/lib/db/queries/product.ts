import { hasMedia, noMedia } from "@/lib/db/helperfilter";
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
    UpdateProductValue,
    UpdateProductMediaInput
} from "@/lib/validations";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "..";
import {
    brands,
    productOptions,
    products,
    productsJourney,
    productSpecifications,
    productValues,
    productVariants,
    returnExchangePolicy,
    womenPageFeaturedProducts,
    menPageFeaturedProducts
} from "../schema";
import { categoryQueries } from "./category";
import { productTypeQueries } from "./product-type";
import { subCategoryQueries } from "./sub-category";
import { brandQueries } from "./brand";
import { InferenceClient } from "@huggingface/inference";
import { getEmbedding } from "@/lib/python/sematic-search";

const token = process.env.HF_TOKEN;

const hf = new InferenceClient(token);
interface CreateWomenPageFeaturedProduct {
    productId: string;
}

interface CreateMenPageFeaturedProduct {
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
}) {
    // Price conversions remain the same
    minPrice = !!minPrice
        ? minPrice < 0
            ? 0
            : convertPriceToPaise(minPrice)
        : null;
    maxPrice = !!maxPrice
        ? maxPrice > 10000
            ? null
            : convertPriceToPaise(maxPrice)
        : null;

    let searchQuery;
    // if (search?.length) {
    //     // Get embedding for the search query
    //     const searchEmbedding = await getEmbedding(search);

    //     // Use cosine similarity with pgvector
    //     searchQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < 0.8`;
    // }
        if (search?.length) {
        // Get embedding for the search query
        const searchEmbedding = await getEmbedding(search);

        // Create two tiers of relevance
        const highRelevanceThreshold = 0.6; // Strong matches (adjust as needed)
        const lowRelevanceThreshold = 0.8; // Weaker but still relevant matches

        // Tier 1: Strong matches (high relevance)
        const highRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold}`;

        // Tier 2: Weaker matches (still relevant)
        const lowRelevanceQuery = sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector BETWEEN ${highRelevanceThreshold} AND ${lowRelevanceThreshold}`;

        // Combine with OR but order by tier first, then similarity
        searchQuery = sql`(${highRelevanceQuery}) OR (${lowRelevanceQuery})`;

        // // Order by tier first (high relevance comes first), then by similarity
        // orderBy.push(
        //     sql`CASE
        //         WHEN ${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold} THEN 0
        //         ELSE 1
        //     END ASC`,
        //     sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`
        // );
    }

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
    ].filter(Boolean);

    const orderBy = [];

    if (search?.length) {
        // Order by cosine similarity (1 - distance)
        const searchEmbedding = await getEmbedding(search);
                 const highRelevanceThreshold = 0.6; // Strong matches (adjust as needed)
        orderBy.push(
            sql`CASE 
                WHEN ${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector < ${highRelevanceThreshold} THEN 0 
                ELSE 1 
            END ASC`,
            sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`
        );
        // orderBy.push(sql`${products.embeddings} <=> ${JSON.stringify(searchEmbedding)}::vector ASC`);
    }

    // Add the regular sort order
    orderBy.push(
        sortOrder === "asc"
            ? asc(products[sortBy])
            : desc(products[sortBy])
    );

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
        limit,
        offset: (page - 1) * limit,
        orderBy,
        extras: {
            count: db.$count(products, and(...filters)).as("product_count"),
        },
    });

    // Rest of your media handling remains the same
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
        count: +data?.[0]?.count || 0,
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

console.log("Input values:", values);
        let categoryName = "";
        let subcategoryName = "";
        let productTypeName = "";
        let brandName = "";

    if (values.categoryId) {
          const category = await categoryQueries.getCategory(values.categoryId);
          categoryName = category?.name || "";
        }
            if (values.brandId) {
          const brand = await brandQueries.getBrand(values.brandId);
          brandName = brand?.name || "";
        }
                    if (values.subcategoryId) {
          const subcategory = await subCategoryQueries.getSubCategory(values.subcategoryId);
          subcategoryName = subcategory?.name || "";
        }
            if (values.productTypeId) {
          const productType = await productTypeQueries.getProductType(values.productTypeId);
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

    console.log("Text for embedding:", text);

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
        if (!Array.isArray(embeddingArray) || embeddingArray.length !== 384) {
          console.error(`Invalid embedding for product with title ${values.title}. Response length: ${embeddingArray?.length}`);
        } else {
          embeddings = embeddingArray;
          console.log(`Generated embedding for product ${values.title}: ${embeddings.length} dimensions`);
        }
      } catch (error) {
        console.error(`Error generating embedding for product with title ${values.title}:`, error);
      }
    } else {
      console.warn(`No text available for embedding generation for product with title ${values.title}`);
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
                .values(values.map((value) => ({
                    ...value,
                    embeddings: value.embeddings, // Include embeddings
                })))
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
                const validatedMedia = Array.isArray(values.media) && values.media.every(
                    (item) => item && typeof item === "object" && "id" in item && "position" in item
                ) ? values.media : [];

                // If media is empty or invalid, log a warning and use a default value
                if (!values.media || values.media.length === 0) {
                    console.warn(`Media field is empty or missing for product ${productId}. Using default empty array.`);
                }
        let categoryName = "";
        let subcategoryName = "";
        let productTypeName = "";
        let brandName = "";

    if (values.categoryId) {
          const category = await categoryQueries.getCategory(values.categoryId);
          categoryName = category?.name || "";
        }
            if (values.subcategoryId) {
          const subcategory = await subCategoryQueries.getSubCategory(values.subcategoryId);
          subcategoryName = subcategory?.name || "";
        }
            if (values.productTypeId) {
          const productType = await productTypeQueries.getProductType(values.productTypeId);
          productTypeName = productType?.name || "";
        }
            if (values.brandId) {
          const brand = await brandQueries.getBrand(values.brandId);
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
            if (!Array.isArray(embeddingArray) || embeddingArray.length !== 384) {
              console.error(`Invalid embedding for product ${productId}. Response length: ${embeddingArray?.length}`);
            } else {
              embeddings = embeddingArray;
              console.log(`Generated embedding for product ${productId}: ${embeddings.length} dimensions`);
            }
          } catch (error) {
            console.error(`Error generating embedding for product ${productId}:`, error);
          }
        } else {
          console.warn(`No text available for embedding generation for product ${productId}`);
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
                        throw new Error(`Product with ID ${productId} not found or failed to update`);
                    }
                // Post-update verification: Check if media was saved correctly
                const maxRetries = 3;
                let retryCount = 0;
                while (retryCount < maxRetries) {
                    if (JSON.stringify(updatedProduct.media) === JSON.stringify(validatedMedia)) {
                        break; // Media was saved correctly
                    }

                    console.warn(`Media not saved correctly for product ${productId}. Retrying (${retryCount + 1}/${maxRetries})...`);
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
                        throw new Error(`Product with ID ${productId} not found during retry`);
                    }

                    retryCount++;
                }

                // Final check after retries
                if (JSON.stringify(updatedProduct.media) !== JSON.stringify(validatedMedia)) {
                    throw new Error(`Failed to save media for product ${productId} after ${maxRetries} retries`);
                }
                    // Handle return/exchange policy
                    const { returnable, returnDescription, exchangeable, exchangeDescription } = values;

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
                                exchangeDescription: exchangeDescription ?? null,
                                updatedAt: new Date(),
                            })
                            .where(eq(returnExchangePolicy.id, existingPolicy.id));
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
                    const [existingOptions, existingVariants] = await Promise.all([
                        tx.query.productOptions.findMany({
                            where: eq(productOptions.productId, productId),
                        }).catch((err) => {
                            throw new Error(`Failed to fetch product options: ${err.message}`);
                        }),
                        tx.query.productVariants.findMany({
                            where: eq(productVariants.productId, productId),
                        }).catch((err) => {
                            throw new Error(`Failed to fetch product variants: ${err.message}`);
                        }),
                    ]);

                    // Handle specifications
                    await tx
                        .delete(productSpecifications)
                        .where(eq(productSpecifications.productId, productId))
                        .catch((err) => {
                            throw new Error(`Failed to delete product specifications: ${err.message}`);
                        });

                    const specifications = values.specifications ?? [];
                    if (specifications.length) {
                        await tx.insert(productSpecifications).values(
                            specifications.map((spec) => ({
                                productId,
                                key: spec.key,
                                value: spec.value,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }))
                        ).catch((err) => {
                            throw new Error(`Failed to insert product specifications: ${err.message}`);
                        });
                    }

                    // Handle options and variants
                    const optionsToBeAdded = values.options.filter(
                        (option) => !existingOptions.find((o) => o.id === option.id)
                    );
                    const optionsToBeUpdated = values.options.filter((option) => {
                        const existing = existingOptions.find((o) => o.id === option.id);
                        return existing && JSON.stringify(option) !== JSON.stringify(existing);
                    });
                    const optionsToBeDeleted = existingOptions.filter(
                        (option) => !values.options.find((o) => o.id === option.id)
                    );

                    const variantsToBeAdded = values.variants.filter(
                        (variant) => !existingVariants.find((v) => v.id === variant.id)
                    );
                    const variantsToBeUpdated = values.variants.filter((variant) => {
                        const existing = existingVariants.find((v) => v.id === variant.id);
                        return existing && JSON.stringify(variant) !== JSON.stringify(existing);
                    });
                    const variantsToBeDeleted = existingVariants.filter(
                        (variant) => !values.variants.find((v) => v.id === variant.id)
                    );

                    await Promise.all([
                        optionsToBeAdded.length &&
                            tx.insert(productOptions).values(optionsToBeAdded).catch((err) => {
                                throw new Error(`Failed to insert product options: ${err.message}`);
                            }),
                        variantsToBeAdded.length &&
                            tx.insert(productVariants).values(variantsToBeAdded).returning().catch((err) => {
                                throw new Error(`Failed to insert product variants: ${err.message}`);
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
                                    throw new Error(`Failed to update product option ${option.id}: ${err.message}`);
                                })
                        ),
                        ...variantsToBeUpdated.map((variant) =>
                            tx
                                .update(productVariants)
                                .set(variant)
                                .where(
                                    and(
                                        eq(productVariants.productId, productId),
                                        eq(productVariants.id, variant.id)
                                    )
                                )
                                .catch((err) => {
                                    throw new Error(`Failed to update product variant ${variant.id}: ${err.message}`);
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
                                throw new Error(`Failed to delete product options: ${err.message}`);
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
                                throw new Error(`Failed to delete product variants: ${err.message}`);
                            }),
                    ]);
                        const [updatedOptions, updatedVariants] = await Promise.all([
                        tx.query.productOptions.findMany({
                            where: eq(productOptions.productId, productId),
                        }).catch((err) => {
                            throw new Error(`Failed to fetch updated product options: ${err.message}`);
                        }),
                        tx.query.productVariants.findMany({
                            where: eq(productVariants.productId, productId),
                        }).catch((err) => {
                            throw new Error(`Failed to fetch updated product variants: ${err.message}`);
                        }),
                    ]);

                    return {
                        ...updatedProduct,
                        options: updatedOptions,
                        variants: updatedVariants,
                    };
                } catch (error:any) {
                    // Log the error to the server console
                    console.error(`Transaction error for product ${productId}:`, error.message);
                    throw new Error(`Transaction failed: ${error.message}`);
                }
            });

            return data;
        } catch (error:any) {
            // Log the error to the server console
            console.error(`Failed to update product ${productId}:`, error.message);
            // Throw a clear error to be caught by the API handler
            throw new Error(`Unable to update product: ${error.message}`);
        }
    }

    async updateProductMedia(productId: string, media: UpdateProductMediaInput["media"]) {
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

    async updateProductStock(
        data: {
            productId: string;
            variantId?: string;
            quantity: number;
        }[]
    ) {
        const updatedData = await db.transaction(async (tx) => {
            const updated = await Promise.all(
                data.map(async (item) => {
                    if (item.variantId) {
                        const res = await tx
                            .update(productVariants)
                            .set({
                                quantity: item.quantity,
                                updatedAt: new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        productVariants.productId,
                                        item.productId
                                    ),
                                    eq(productVariants.id, item.variantId)
                                )
                            )
                            .returning();
                        return res[0];
                    }

                    const res = await tx
                        .update(products)
                        .set({
                            quantity: item.quantity,
                            updatedAt: new Date(),
                        })
                        .where(eq(products.id, item.productId))
                        .returning();
                    return res[0];
                })
            );

            return updated;
        });

        return updatedData;
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

        async createWomenPageFeaturedProduct(values: CreateWomenPageFeaturedProduct) {
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
          specifications: true
        }
      }
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
  const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));

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
        mediaItem: variant.image ? mediaMap.get(variant.image) : null,
        url: variant.image ? mediaMap.get(variant.image)?.url ?? null : null,
      })),
      returnable: product.returnExchangePolicy?.returnable ?? false,
      returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
      exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
      exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
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
          specifications: true
        }
      }
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
  const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));

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
        mediaItem: variant.image ? mediaMap.get(variant.image) : null,
        url: variant.image ? mediaMap.get(variant.image)?.url ?? null : null,
      })),
      returnable: product.returnExchangePolicy?.returnable ?? false,
      returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
      exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
      exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
      specifications: product.specifications.map((spec) => ({
        key: spec.key,
        value: spec.value,
      })),
    },
  }));

  return enhancedData;
}

    async updateProductValue(id: string, values: UpdateProductValue) {
        const data = await db
            .update(productValues)
            .set(values)
            .where(eq(productValues.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const productQueries = new ProductQuery();
