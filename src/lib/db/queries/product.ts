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
    UpdateProduct,
    UpdateProductJourney,
    UpdateProductValue,
    ReturnExchangePolicy
} from "@/lib/validations";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "..";
import {
    productOptions,
    products,
    productsJourney,
    productValues,
    productVariants,
    returnExchangePolicy,
    productSpecifications
} from "../schema";

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
        productImage,
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
            productImage
                ? productImage === "with"
                    ? hasMedia(products, "media")
                    : productImage === "without"
                      ? noMedia(products, "media")
                      : undefined
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
            returnable: product.returnExchangePolicy?.returnable ?? false,
            returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
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
            returnDescription: data.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: data.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription: data.returnExchangePolicy?.exchangeDescription ?? null,
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
            returnDescription: data.returnExchangePolicy?.returnDescription ?? null,
            exchangeable: data.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription: data.returnExchangePolicy?.exchangeDescription ?? null,
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
            const newProduct = await tx
                .insert(products)
                .values(values)
                .returning()
                .then((res) => res[0]);
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

    async updateProduct(productId: string, values: UpdateProduct) {
        const data = await db.transaction(async (tx) => {
            const updatedProduct = await tx
                .update(products)
                .set(values)
                .where(eq(products.id, productId))
                .returning()
                .then((res) => res[0]);
                    // Step 2: Extract return/exchange policy fields
                    const {
                        returnable,
                        returnDescription,
                        exchangeable,
                        exchangeDescription,
                    } = values;

                    // Step 3: Check for existing return/exchange policy by productId
                    const existingPolicy = await tx
                        .select({ id: returnExchangePolicy.id }) // Only fetch the id for efficiency
                        .from(returnExchangePolicy)
                        .where(eq(returnExchangePolicy.productId, productId))
                        .limit(1)
                        .then((res) => res[0]);

                    if (existingPolicy) {
                        // Update the existing policy using its id
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
                        // Insert a new policy if none exists
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
            const [existingOptions, existingVariants] = await Promise.all([
                tx.query.productOptions.findMany({
                    where: eq(productOptions.productId, productId),
                }),
                tx.query.productVariants.findMany({
                    where: eq(productVariants.productId, productId),
                }),
            ]);
            // Step 3: Handle specifications (simplified: delete all, then insert new)
            await tx
            .delete(productSpecifications)
            .where(eq(productSpecifications.productId, productId));

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
            );
            }
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
