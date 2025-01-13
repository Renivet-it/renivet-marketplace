import { DEFAULT_MESSAGES } from "@/config/const";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema, createWishlistSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";

export const wishlistRouter = createTRPCRouter({
    getWishlist: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
            })
        )
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            const isAuthorized = user.id === userId;
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to view this wishlist",
                });

            return next({ ctx, input });
        })
        .query(async ({ input }) => {
            const { userId } = input;

            const existingWishlist = await userWishlistCache.get(userId);

            if (!existingWishlist) return [];
            return existingWishlist;
        }),
    addProductInWishlist: protectedProcedure
        .input(createWishlistSchema)
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            const isAuthorized = user.id === userId;
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to add to this wishlist",
                });

            if (user.roles.length > 0)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: DEFAULT_MESSAGES.ERRORS.USER_NOT_CUSTOMER,
                });

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { userId, productId } = input;

            const [existingWishlist, existingProduct] = await Promise.all([
                userWishlistCache.getProduct(userId, productId),
                queries.products.getProduct({
                    productId,
                    verificationStatus: "approved",
                    isPublished: true,
                    isActive: true,
                    isAvailable: true,
                    isDeleted: false,
                }),
            ]);
            if (existingWishlist)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This product is already in your wishlist",
                });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const data =
                await queries.userWishlists.addProductInWishlist(input);

            posthog.capture({
                event: POSTHOG_EVENTS.WISHLIST.ADDED,
                distinctId: userId,
                properties: {
                    productId,
                    sku: existingProduct.nativeSku,
                },
            });

            return data;
        }),
    moveProductToCart: protectedProcedure
        .input(createCartSchema)
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            const isAuthorized = user.id === userId;
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to add to this cart",
                });

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries, db, schemas } = ctx;
            const { userId, productId, variantId, quantity } = input;

            if (variantId) {
                const existingVariant =
                    await db.query.productVariants.findFirst({
                        where: and(
                            variantId
                                ? eq(schemas.productVariants.id, variantId)
                                : undefined,
                            eq(schemas.productVariants.productId, productId),
                            gte(schemas.productVariants.quantity, quantity),
                            eq(schemas.productVariants.isDeleted, false)
                        ),
                        with: {
                            product: true,
                        },
                    });
                if (!existingVariant)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    });

                if (
                    !existingVariant.product.isAvailable ||
                    !existingVariant.product.isActive ||
                    existingVariant.product.isDeleted ||
                    existingVariant.product.verificationStatus !== "approved" ||
                    !existingVariant.product.isPublished
                )
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "This product is not available for purchase",
                    });

                const existingWishlist = await userWishlistCache.getProduct(
                    userId,
                    existingVariant.productId
                );
                if (!existingWishlist)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "This product is not in your wishlist",
                    });

                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                });
                if (!existingCart)
                    await Promise.all([
                        queries.userCarts.addProductToCart(input),
                        queries.userWishlists.deleteProductInWishlist(
                            existingWishlist.id
                        ),
                        userWishlistCache.drop(userId),
                    ]);
                else
                    await Promise.all([
                        queries.userCarts.updateProductInCart(existingCart.id, {
                            ...existingCart,
                            quantity: existingCart.quantity + quantity,
                        }),
                        queries.userWishlists.deleteProductInWishlist(
                            existingWishlist.id
                        ),
                        userCartCache.remove({
                            userId,
                            productId,
                            variantId: variantId ?? undefined,
                        }),
                    ]);

                posthog.capture({
                    event: POSTHOG_EVENTS.CART.ADDED,
                    distinctId: userId,
                    properties: {
                        productId,
                        variantId,
                        sku: existingVariant.nativeSku,
                        quantity,
                    },
                });

                posthog.capture({
                    event: POSTHOG_EVENTS.WISHLIST.REMOVED,
                    distinctId: userId,
                    properties: {
                        productId,
                        sku: existingVariant.nativeSku,
                    },
                });

                return {
                    type: existingCart ? ("update" as const) : ("add" as const),
                };
            } else {
                const existingProduct = await db.query.products.findFirst({
                    where: and(
                        eq(schemas.products.id, productId),
                        gte(schemas.products.quantity, quantity),
                        eq(schemas.products.isDeleted, false),
                        eq(schemas.products.isAvailable, true),
                        eq(schemas.products.isActive, true),
                        eq(schemas.products.verificationStatus, "approved"),
                        eq(schemas.products.isPublished, true)
                    ),
                });
                if (!existingProduct)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    });

                if (existingProduct.quantity! <= quantity)
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "This product is out of stock",
                    });

                const existingWishlist = await userWishlistCache.getProduct(
                    userId,
                    productId
                );
                if (!existingWishlist)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "This product is not in your wishlist",
                    });

                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                });
                if (!existingCart)
                    await Promise.all([
                        queries.userCarts.addProductToCart({
                            userId,
                            productId,
                            quantity,
                            variantId: null,
                        }),
                        queries.userWishlists.deleteProductInWishlist(
                            existingWishlist.id
                        ),
                        userWishlistCache.drop(userId),
                    ]);
                else
                    await Promise.all([
                        queries.userCarts.updateProductInCart(existingCart.id, {
                            ...existingCart,
                            quantity: existingCart.quantity + quantity,
                        }),
                        queries.userWishlists.deleteProductInWishlist(
                            existingWishlist.id
                        ),
                        userCartCache.remove({
                            userId,
                            productId,
                        }),
                    ]);

                posthog.capture({
                    event: POSTHOG_EVENTS.CART.ADDED,
                    distinctId: userId,
                    properties: {
                        productId,
                        sku: existingProduct.nativeSku,
                        quantity,
                    },
                });

                posthog.capture({
                    event: POSTHOG_EVENTS.WISHLIST.REMOVED,
                    distinctId: userId,
                    properties: {
                        productId,
                        sku: existingProduct.nativeSku,
                    },
                });

                return {
                    type: existingCart ? ("update" as const) : ("add" as const),
                };
            }
        }),
    removeProductInWishlist: protectedProcedure
        .input(createWishlistSchema)
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            const isAuthorized = user.id === userId;
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You are not authorized to remove from this wishlist",
                });

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { userId, productId } = input;

            const existingWishlist = await userWishlistCache.getProduct(
                userId,
                productId
            );
            if (!existingWishlist)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your wishlist",
                });

            const [data] = await Promise.all([
                queries.userWishlists.deleteProductInWishlist(
                    existingWishlist.id
                ),
                userWishlistCache.remove(userId, productId),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.WISHLIST.REMOVED,
                distinctId: userId,
                properties: {
                    productId,
                    sku: existingWishlist.product.nativeSku,
                },
            });

            return data;
        }),
});
