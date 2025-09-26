import { BRAND_EVENTS } from "@/config/brand";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import {
    analytics,
    userCartCache,
    userWishlistCache,
} from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { getAbsoluteURL } from "@/lib/utils";
import { cartSchema, createCartSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";

export const cartRouter = createTRPCRouter({
    getCartForUser: protectedProcedure
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
                    message: "You are not authorized to view this cart",
                });

            return next({ ctx, input });
        })
        .query(async ({ input }) => {
            const { userId } = input;

            const existingCart = await userCartCache.get(userId);
            if (!existingCart) return [];

            return existingCart;
        }),
        mergeGuestCart: protectedProcedure
  .input(
    z.array(
      z.object({
        productId: z.string(),
        variantId: z.string().nullable(),
        quantity: z.number(),
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { queries, db } = ctx;
    const userId = ctx.user.id;

    for (const item of input) {
      const existingCart = await userCartCache.getProduct({
        userId,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
      });

      if (!existingCart) {
        await queries.userCarts.addProductToCart({
          userId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        });
      } else {
        await queries.userCarts.updateProductInCart(existingCart.id, {
          ...existingCart,
          quantity: existingCart.quantity + item.quantity,
        });

        // Remove from cache so it refetches
        await userCartCache.remove({
          userId,
          productId: item.productId,
          variantId: item.variantId ?? undefined,
        });
      }
    }

    // Clear entire user cart cache to refetch updated cart
    await userCartCache.drop(userId);

    return { success: true };
  }),
    addProductToCart: protectedProcedure
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

                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                });

                if (!existingCart)
                    await queries.userCarts.addProductToCart(input);
                else {
                    await Promise.all([
                        queries.userCarts.updateProductInCart(existingCart.id, {
                            ...existingCart,
                            quantity: existingCart.quantity + quantity,
                        }),
                        userCartCache.remove({
                            userId,
                            productId,
                            variantId: variantId ?? undefined,
                        }),
                    ]);
                }

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

                await analytics.track({
                    namespace: BRAND_EVENTS.CART.ADDED,
                    brandId: existingVariant.product.brandId,
                    event: {
                        productId,
                        variantId,
                        userId,
                        productName: existingVariant.product.title,
                        url: getAbsoluteURL(
                            `/products/${existingVariant.product.slug}`
                        ),
                        sku: existingVariant.nativeSku,
                        quantity,
                    },
                });

                return {
                    type: existingCart ? ("update" as const) : ("add" as const),
                };
            } else {
                const existingProduct = await queries.products.getProduct({
                    productId,
                    isAvailable: true,
                    isActive: true,
                    isDeleted: false,
                    verificationStatus: "approved",
                    isPublished: true,
                });
                if (!existingProduct)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    });

                if (existingProduct.quantity! <= quantity)
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Not enough stock available",
                    });

                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                });

                if (!existingCart)
                    await queries.userCarts.addProductToCart(input);
                else {
                    await Promise.all([
                        queries.userCarts.updateProductInCart(existingCart.id, {
                            ...existingCart,
                            quantity: existingCart.quantity + quantity,
                        }),
                        userCartCache.remove({
                            userId,
                            productId,
                            variantId: variantId ?? undefined,
                        }),
                    ]);
                }

                posthog.capture({
                    event: POSTHOG_EVENTS.CART.ADDED,
                    distinctId: userId,
                    properties: {
                        productId,
                        variantId,
                        sku: existingProduct.nativeSku,
                        quantity,
                    },
                });

                await analytics.track({
                    namespace: BRAND_EVENTS.CART.ADDED,
                    brandId: existingProduct.brandId,
                    event: {
                        productId,
                        variantId,
                        userId,
                        productName: existingProduct.title,
                        url: getAbsoluteURL(
                            `/products/${existingProduct.slug}`
                        ),
                        sku: existingProduct.nativeSku,
                        quantity,
                    },
                });

                return {
                    type: existingCart ? ("update" as const) : ("add" as const),
                };
            }
        }),
    updateProductQuantityInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: cartSchema.shape.productId,
                variantId: cartSchema.shape.variantId,
                quantity: cartSchema.shape.quantity,
            })
        )
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
            const { queries } = ctx;
            const { userId, productId, variantId, quantity } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                productId,
                variantId: variantId ?? undefined,
            });
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            if (quantity === existingCart.quantity)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No changes were made to the cart",
                });

            if (
                !existingCart.product.isAvailable ||
                !existingCart.product.isActive ||
                existingCart.product.isDeleted ||
                existingCart.product.verificationStatus !== "approved" ||
                !existingCart.product.isPublished ||
                existingCart.variant?.isDeleted
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This product is not available",
                });

            if (variantId && existingCart.variant) {
                if (existingCart.variant.quantity <= quantity)
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Not enough stock available",
                    });
            } else if ((existingCart.product.quantity ?? 0) <= quantity)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Not enough stock available",
                });

            const [data] = await Promise.all([
                queries.userCarts.updateProductInCart(existingCart.id, {
                    ...existingCart,
                    quantity,
                }),
                userCartCache.remove({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                }),
            ]);
            return data;
        }),
    updateStatusInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: cartSchema.shape.productId.optional(),
                variantId: cartSchema.shape.variantId.optional(),
                status: cartSchema.shape.status,
            })
        )
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            const isAuthorized = user.id === userId;
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to update this cart",
                });

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { userId, status, productId, variantId } = input;

            if (productId && (productId || variantId)) {
                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                });
                if (!existingCart)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "This variant is not in your cart",
                    });

                if (
                    !existingCart.product.isAvailable ||
                    !existingCart.product.isActive ||
                    existingCart.product.isDeleted ||
                    existingCart.product.verificationStatus !== "approved" ||
                    !existingCart.product.isPublished ||
                    existingCart.variant?.isDeleted
                )
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "This product is not available",
                    });

                const [data] = await Promise.all([
                    queries.userCarts.updateProductInCart(existingCart.id, {
                        ...existingCart,
                        status,
                    }),
                    userCartCache.drop(userId),
                ]);

                return data;
            }

            const [data] = await Promise.all([
                queries.userCarts.updateStatusInCart(userId, status),
                userCartCache.drop(userId),
            ]);
            return data;
        }),
    moveProductToWishlist: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: cartSchema.shape.productId,
                variantId: cartSchema.shape.variantId,
            })
        )
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
            const { queries } = ctx;
            const { userId, variantId, productId } = input;

            const [existingCart, existingWishlist] = await Promise.all([
                userCartCache.getProduct({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                }),
                userWishlistCache.getProduct(userId, productId),
            ]);
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });
            if (existingWishlist)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "This product is already in your wishlist, you can remove it from your cart instead",
                });

            if (
                existingCart.product.isDeleted ||
                existingCart.product.verificationStatus !== "approved" ||
                !existingCart.product.isPublished ||
                existingCart.variant?.isDeleted
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This product is not available",
                });

            const [data] = await Promise.all([
                queries.userWishlists.addProductInWishlist(input),
                queries.userCarts.deleteProductFromCart(existingCart.id),
                userCartCache.remove({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                }),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.WISHLIST.ADDED,
                distinctId: userId,
                properties: {
                    productId,
                    sku: existingCart.product.nativeSku,
                },
            });

            posthog.capture({
                event: POSTHOG_EVENTS.CART.REMOVED,
                distinctId: userId,
                properties: {
                    productId,
                    variantId,
                    sku: variantId
                        ? existingCart.variant?.nativeSku
                        : existingCart.product.nativeSku,
                },
            });

            await Promise.all([
                analytics.track({
                    namespace: BRAND_EVENTS.WISHLIST.ADDED,
                    brandId: existingCart.product.brandId,
                    event: {
                        productId,
                        userId,
                        productName: existingCart.product.title,
                        url: getAbsoluteURL(
                            `/products/${existingCart.product.slug}`
                        ),
                        sku: existingCart.product.nativeSku,
                    },
                }),
                analytics.track({
                    namespace: BRAND_EVENTS.CART.REMOVED,
                    brandId: existingCart.product.brandId,
                    event: {
                        productId,
                        variantId,
                        userId,
                        productName: existingCart.product.title,
                        url: getAbsoluteURL(
                            `/products/${existingCart.product.slug}`
                        ),
                        sku: variantId
                            ? existingCart.variant?.nativeSku
                            : existingCart.product.nativeSku,
                    },
                }),
            ]);

            return data;
        }),
    removeProductInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: cartSchema.shape.productId,
                variantId: cartSchema.shape.variantId,
            })
        )
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
            const { queries } = ctx;
            const { userId, productId, variantId } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                productId,
                variantId: variantId ?? undefined,
            });
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            const [data] = await Promise.all([
                queries.userCarts.deleteProductFromCart(existingCart.id),
                userCartCache.remove({
                    userId,
                    productId,
                    variantId: variantId ?? undefined,
                }),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.CART.REMOVED,
                distinctId: userId,
                properties: {
                    productId,
                    variantId,
                    sku: variantId
                        ? existingCart.variant?.nativeSku
                        : existingCart.product.nativeSku,
                },
            });

            return data;
        }),
    removeProductsInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                items: z.array(
                    z.object({
                        productId: cartSchema.shape.productId,
                        variantId: cartSchema.shape.variantId,
                    })
                ),
            })
        )
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
            const { queries } = ctx;
            const { userId, items } = input;

            const existingCart = await userCartCache.get(userId);
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            const existingVariants = existingCart.filter((cart) =>
                items.some(
                    (item) =>
                        cart.productId === item.productId &&
                        cart.variantId === item.variantId
                )
            );
            if (existingVariants.length === 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "These variants are not in your cart",
                });

            const [data] = await Promise.all([
                queries.userCarts.deleteProductsFromCart(
                    userId,
                    existingVariants.map((cart) => cart.id)
                ),
                userCartCache.drop(userId),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.CART.BULK_REMOVED,
                distinctId: userId,
                properties: {
                    items: existingVariants.map((cart) => ({
                        productId: cart.productId,
                        variantId: cart.variantId,
                        sku: cart.variant?.nativeSku ?? cart.product.nativeSku,
                    })),
                },
            });

            return data;
        }),
});
