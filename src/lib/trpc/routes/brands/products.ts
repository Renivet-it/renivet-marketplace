import { env } from "@/../env";
import { BitFieldBrandPermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import {
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
    createProductSchema,
    productSchema,
    updateProductSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

export const productsRouter = createTRPCRouter({
    getProducts: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
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
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.products.getProducts(input);
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

            return data;
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

            const inputWithSlug = input.map((product) => {
                const slug = generateProductSlug(
                    product.title,
                    user.brand!.name
                );
                return { ...product, slug };
            });

            const data =
                await queries.products.bulkCreateProducts(inputWithSlug);

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
                distinctId: user.brand.id,
                properties: {
                    brandName: user.brand.name,
                    brandOwnerId: user.id,
                    productIds: data.map((product) => product.id),
                    productTitles: data.map((product) => product.title),
                },
            });

            return data;
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

            if (existingProduct.brand.id !== user.brand?.id)
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

            if (
                existingProduct.isActive &&
                existingProduct.media.length === 0 &&
                values.media.length === 0
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product must have at least one image",
                });

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
                        brand: user.brand,
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

            if (user.brand?.confidentialVerificationStatus !== "approved")
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You must complete the brand verification process to publish products",
                });

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

            if (existingProduct.isPublished && !isPublished)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "You cannot unpublish a product that is already published, to unlist make the product inactive",
                });

            if (existingProduct.media.length === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product must have at least one image",
                });

            const data = await queries.products.updateProductPublishStatus(
                productId,
                isPublished
            );

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.PUBLISHED,
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

            if (
                !existingProduct.isActive &&
                isActive &&
                existingProduct.media.length === 0
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product must have at least one image",
                });

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
                with: { brand: true },
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

            if (existingProduct.media.length === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product must have at least one image",
                });

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

            const [data] = await Promise.all([
                queries.products.softDeleteProduct(productId),
                userCartCache.dropAll(),
                userWishlistCache.dropAll(),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.DELETED,
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
});
