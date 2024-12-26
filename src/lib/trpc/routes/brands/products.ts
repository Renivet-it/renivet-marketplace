import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { generateProductSlug, getUploadThingFileKey } from "@/lib/utils";
import { createProductSchema, updateProductSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

export const productsRouter = createTRPCRouter({
    getProducts: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
                brandIds: z.array(z.string()).optional(),
                colors: z.array(z.string()).optional(),
                minPrice: z.number().optional(),
                maxPrice: z.number().optional(),
                isAvailable: z.boolean().optional(),
                isPublished: z.boolean().optional(),
                sortBy: z.enum(["price", "createdAt"]).optional(),
                sortOrder: z.enum(["asc", "desc"]).optional(),
                categoryId: z.string().optional(),
                subCategoryId: z.string().optional(),
                productTypeId: z.string().optional(),
                status: z
                    .enum(["idle", "pending", "approved", "rejected"])
                    .optional(),
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
                productId: z.string(),
                visibility: z.enum(["published", "draft"]).optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { productId, visibility } = input;
            const { queries } = ctx;

            const data = await queries.products.getProduct(
                productId,
                visibility
            );
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
            const { queries, user, db, schemas } = ctx;
            const { brandId, ...product } = input;

            if (!product.sustainabilityCertificateUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Sustainability certificate is required",
                });

            if (brandId !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const totalProducts = await queries.products.getProductCount(
                brandId,
                "active"
            );
            if (totalProducts >= 5)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have reached the maximum number of products",
                });

            const slug = generateProductSlug(product.name, user.brand.name);

            const data = await queries.products.createProduct({
                ...product,
                sustainabilityCertificateUrl:
                    product.sustainabilityCertificateUrl!,
                slug,
                brandId,
            });

            await db.insert(schemas.productVariants).values(
                input.variants.map((variant) => ({
                    ...variant,
                    productId: data.id,
                }))
            );

            return data;
        }),
    updateProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                values: updateProductSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, values } = input;
            const { queries, user, db, schemas } = ctx;

            if (!values.sustainabilityCertificateUrl)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Sustainability certificate is required",
                });

            const existingProduct =
                await queries.products.getProduct(productId);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.isPublished && !values.isPublished)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Once a product is published, it cannot be unpublished",
                });

            if (values.isPublished && existingProduct.status !== "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only approved products can be published",
                });

            if (
                existingProduct.isPublished &&
                (existingProduct.name !== values.name ||
                    existingProduct.description !== values.description ||
                    existingProduct.imageUrls.join() !==
                        values.imageUrls.join() ||
                    existingProduct.sustainabilityCertificateUrl !==
                        values.sustainabilityCertificateUrl)
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "You cannot update the name, description, images, or sustainability certificate of a published product",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const existingImages = existingProduct.imageUrls.map((url) => ({
                key: getUploadThingFileKey(url),
                url,
            }));
            const inputImages = values.imageUrls.map((url) => ({
                key: getUploadThingFileKey(url),
                url,
            }));

            const removedImages = existingImages.filter(
                (img) => !inputImages.some((i) => i.key === img.key)
            );

            const existingDoc = {
                key: getUploadThingFileKey(
                    existingProduct.sustainabilityCertificateUrl
                ),
                url: existingProduct.sustainabilityCertificateUrl,
            };
            const inputDoc = {
                key: getUploadThingFileKey(values.sustainabilityCertificateUrl),
                url: values.sustainabilityCertificateUrl,
            };

            const filesToBeDeleted = [];

            if (existingDoc.key !== inputDoc.key)
                filesToBeDeleted.push(existingDoc.key);
            if (removedImages.length > 0)
                filesToBeDeleted.push(...removedImages.map((img) => img.key));

            await utApi.deleteFiles(filesToBeDeleted);

            const slug =
                values.name !== existingProduct.name
                    ? generateProductSlug(values.name, user.brand.name)
                    : existingProduct.slug;

            const existingSkus = existingProduct.variants.map((v) => v.sku);
            const inputSkus = values.variants.map((v) => v.sku);

            const variantsToBeDeleted = existingSkus.filter(
                (sku) => !inputSkus.includes(sku)
            );
            const variantsToBeAdded = values.variants.filter(
                (v) => !existingSkus.includes(v.sku)
            );

            const variantsToBeUpdated = values.variants.filter((v) =>
                existingSkus.includes(v.sku)
            );

            const filteredVariantsToBeUpdated = variantsToBeUpdated.filter(
                (v) => {
                    const existingVariant = existingProduct.variants.find(
                        (ev) => ev.sku === v.sku
                    );
                    if (!existingVariant) return false;

                    return (
                        JSON.stringify({
                            sku: v.sku,
                            size: v.size,
                            colorName: v.color.name,
                            colorHex: v.color.hex,
                            quantity: v.quantity,
                        }) !==
                        JSON.stringify({
                            sku: existingVariant.sku,
                            size: existingVariant.size,
                            colorName: existingVariant.color.name,
                            colorHex: existingVariant.color.hex,
                            quantity: existingVariant.quantity,
                        })
                    );
                }
            );

            const [data] = await Promise.all([
                queries.products.updateProduct(productId, {
                    ...values,
                    sustainabilityCertificateUrl:
                        values.sustainabilityCertificateUrl!,
                    slug,
                }),
                userWishlistCache.dropAll(),
                userCartCache.dropAll(),
                variantsToBeDeleted.length > 0 &&
                    db
                        .update(schemas.productVariants)
                        .set({
                            isDeleted: true,
                            isAvailable: false,
                        })
                        .where(
                            inArray(
                                schemas.productVariants.sku,
                                variantsToBeDeleted
                            )
                        ),
                variantsToBeAdded.length > 0 &&
                    db.insert(schemas.productVariants).values(
                        variantsToBeAdded.map((variant) => ({
                            ...variant,
                            productId,
                        }))
                    ),
            ]);

            if (filteredVariantsToBeUpdated.length > 0)
                await Promise.all(
                    filteredVariantsToBeUpdated.map(({ sku, ...rest }) =>
                        db
                            .update(schemas.productVariants)
                            .set(rest)
                            .where(eq(schemas.productVariants.sku, sku))
                    )
                );

            return data;
        }),
    updateVariantAvailability: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                sku: z.string(),
                isAvailable: z.boolean(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, sku, isAvailable } = input;
            const { queries, user } = ctx;

            const existingProduct =
                await queries.products.getProduct(productId);
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

            const existingVariant = existingProduct.variants.find(
                (v) => v.sku === sku
            );
            if (!existingVariant)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Variant not found",
                });

            const [data] = await Promise.all([
                queries.products.updateVariantAvailability(sku, isAvailable),
                userCartCache.dropAll(),
            ]);
            return data;
        }),
    sendProductForReview: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries, user } = ctx;

            const existingProduct =
                await queries.products.getProduct(productId);
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

            if (existingProduct.status === "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product is already sent for review",
                });

            if (existingProduct.status === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Product is already approved",
                });

            if (
                existingProduct.status === "rejected" &&
                existingProduct.lastReviewedAt &&
                new Date(existingProduct.lastReviewedAt).getTime() >
                    Date.now() - 1000 * 60 * 60 * 24 * 7
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Product was rejected on ${format(
                        new Date(existingProduct.lastReviewedAt),
                        "MMMM dd, yyyy"
                    )}. You still have to wait for ${
                        7 -
                        Math.floor(
                            (Date.now() -
                                new Date(
                                    existingProduct.lastReviewedAt
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                        )
                    } days before you can resend for review`,
                });

            const data = await queries.products.sendProductForReview(productId);
            return data;
        }),
    deleteProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries, user } = ctx;

            const existingProduct =
                await queries.products.getProduct(productId);
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

            const data = await queries.products.softDeleteProduct(productId);
            return data;
        }),
});
