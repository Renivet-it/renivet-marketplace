import { mediaCache } from "@/lib/redis/methods";
import { convertPriceToPaise } from "@/lib/utils";
import {
    CreateProduct,
    Product,
    ProductWithBrand,
    productWithBrandSchema,
    UpdateProduct,
} from "@/lib/validations";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "..";
import { productOptions, products, productVariants } from "../schema";

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
    }) {
        const searchQuery = !!search?.length
            ? sql`(
            setweight(to_tsvector('english', ${products.title}), 'A') ||
            setweight(to_tsvector('english', ${products.description}), 'B'))
            @@ plainto_tsquery('english', ${search})`
            : undefined;

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
        ];

        const data = await db.query.products.findMany({
            with: {
                brand: true,
                variants: true,
                category: true,
                subcategory: true,
                productType: true,
                options: true,
            },
            where: and(...filters),
            limit,
            offset: (page - 1) * limit,
            orderBy: searchQuery
                ? [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                      desc(sql`ts_rank(
                        setweight(to_tsvector('english', ${products.title}), 'A') ||
                        setweight(to_tsvector('english', ${products.description}), 'B'),
                        plainto_tsquery('english', ${search})
                      )`),
                  ]
                : [
                      sortOrder === "asc"
                          ? asc(products[sortBy])
                          : desc(products[sortBy]),
                  ],
            extras: {
                count: db.$count(products, and(...filters)).as("product_count"),
            },
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
        };

        return productWithBrandSchema.parse(enhancedData);
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
        };

        return productWithBrandSchema.parse(enhancedData);
    }

    async createProduct(
        values: CreateProduct & {
            slug: string;
        }
    ) {
        const data = await db.transaction(async (tx) => {
            const newProduct = await tx
                .insert(products)
                .values(values)
                .returning()
                .then((res) => res[0]);

            const [newOptions, newVariants] = await Promise.all([
                tx
                    .insert(productOptions)
                    .values(
                        values.options.map((option) => ({
                            ...option,
                            productId: newProduct.id,
                        }))
                    )
                    .returning(),
                tx
                    .insert(productVariants)
                    .values(
                        values.variants.map((variant) => ({
                            ...variant,
                            productId: newProduct.id,
                        }))
                    )
                    .returning(),
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
        })[]
    ) {
        const data = await db.transaction(async (tx) => {
            const newProducts = await tx
                .insert(products)
                .values(values)
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
                tx
                    .insert(productOptions)
                    .values(productOptionsToInsert)
                    .returning()
                    .then((res) => res),
                tx
                    .insert(productVariants)
                    .values(productVariantsToInsert)
                    .returning()
                    .then((res) => res),
            ]);

            return newProducts.map((product) => ({
                ...product,
                options: newOptions.filter((o) => o.productId === product.id),
                variants: newVariants.filter((v) => v.productId === product.id),
            }));
        });

        return data;
    }

    async updateProduct(productId: string, values: UpdateProduct) {
        const data = await db.transaction(async (tx) => {
            const updatedProduct = await tx
                .update(products)
                .set(values)
                .where(eq(products.id, productId))
                .returning()
                .then((res) => res[0]);

            const [existingOptions, existingVariants] = await Promise.all([
                tx.query.productOptions.findMany({
                    where: eq(productOptions.productId, productId),
                }),
                tx.query.productVariants.findMany({
                    where: eq(productVariants.productId, productId),
                }),
            ]);

            const optionsToBeAdded = values.options.filter(
                (option) => !existingOptions.find((o) => o.id === option.id)
            );
            const optionsToBeUpdated = values.options.filter((option) => {
                const existing = existingOptions.find(
                    (o) => o.id === option.id
                );
                return (
                    existing &&
                    JSON.stringify(option) !== JSON.stringify(existing)
                );
            });
            const optionsToBeDeleted = existingOptions.filter(
                (option) => !values.options.find((o) => o.id === option.id)
            );

            const variantsToBeAdded = values.variants.filter(
                (variant) => !existingVariants.find((v) => v.id === variant.id)
            );
            const variantsToBeUpdated = values.variants.filter((variant) => {
                const existing = existingVariants.find(
                    (v) => v.id === variant.id
                );
                return (
                    existing &&
                    JSON.stringify(variant) !== JSON.stringify(existing)
                );
            });
            const variantsToBeDeleted = existingVariants.filter(
                (variant) => !values.variants.find((v) => v.id === variant.id)
            );

            await Promise.all([
                optionsToBeAdded.length &&
                    tx.insert(productOptions).values(optionsToBeAdded),
                variantsToBeAdded.length &&
                    tx
                        .insert(productVariants)
                        .values(variantsToBeAdded)
                        .returning(),
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
                    ),
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
                    ),
            ]);

            const [updatedOptions, updatedVariants] = await Promise.all([
                tx.query.productOptions.findMany({
                    where: eq(productOptions.productId, productId),
                }),
                tx.query.productVariants.findMany({
                    where: eq(productVariants.productId, productId),
                }),
            ]);

            return {
                ...updatedProduct,
                options: updatedOptions,
                variants: updatedVariants,
            };
        });

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
}

export const productQueries = new ProductQuery();
