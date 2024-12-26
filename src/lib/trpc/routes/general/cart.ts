import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

export const cartRouter = createTRPCRouter({
    getCart: protectedProcedure
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
    addProductInCart: protectedProcedure
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
            const { userId, sku, quantity } = input;

            const existingVariant = await db.query.productVariants.findFirst({
                where: and(
                    eq(schemas.productVariants.sku, sku),
                    gt(schemas.productVariants.quantity, 0),
                    eq(schemas.productVariants.isAvailable, true),
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
                !existingVariant.isAvailable ||
                !existingVariant.product.isAvailable ||
                existingVariant.isDeleted ||
                existingVariant.product.isDeleted ||
                existingVariant.quantity < quantity
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This product is not available",
                });

            const existingCart = await userCartCache.getProduct({
                userId,
                sku,
            });

            if (!existingCart) await queries.userCarts.addProductToCart(input);
            else {
                await Promise.all([
                    queries.userCarts.updateProductInCart(existingCart.id, {
                        ...existingCart,
                        quantity: existingCart.quantity + quantity,
                    }),
                    userCartCache.remove({ userId, sku }),
                ]);
            }

            return {
                type: existingCart ? ("update" as const) : ("add" as const),
            };
        }),
    updateProductQuantityInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                sku: z.string(),
                quantity: z.number().int().positive(),
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
            const { userId, sku, quantity } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                sku,
            });
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This variant is not in your cart",
                });

            if (quantity === existingCart.quantity)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No changes were made to the cart",
                });

            const selectedVariant = existingCart.item.variants.find(
                (variant) => variant.sku === sku
            );
            if (!selectedVariant)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This variant is not in your cart",
                });

            if (
                !selectedVariant.isAvailable ||
                !existingCart.item.isAvailable ||
                selectedVariant.isDeleted ||
                existingCart.item.isDeleted ||
                selectedVariant.quantity < quantity
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This product is not available",
                });

            const [data] = await Promise.all([
                queries.userCarts.updateProductInCart(existingCart.id, {
                    ...existingCart,
                    quantity,
                }),
                userCartCache.remove({
                    userId,
                    sku,
                }),
            ]);
            return data;
        }),
    updateStatusInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                sku: z.string().optional(),
                status: z.boolean(),
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
            const { userId, status, sku } = input;

            if (sku) {
                const existingCart = await userCartCache.getProduct({
                    userId,
                    sku,
                });
                if (!existingCart)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "This variant is not in your cart",
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
                sku: z.string(),
                productId: z.string(),
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
            const { userId, sku, productId } = input;

            const [existingCart, existingWishlist] = await Promise.all([
                userCartCache.getProduct({
                    userId,
                    sku,
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

            const [data] = await Promise.all([
                queries.userWishlists.addProductInWishlist(input),
                queries.userCarts.deleteProductFromCart(existingCart.id),
                userCartCache.remove({
                    userId,
                    sku,
                }),
            ]);
            return data;
        }),
    removeProductInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                sku: z.string(),
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
            const { userId, sku } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                sku,
            });
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            const [data] = await Promise.all([
                queries.userCarts.deleteProductFromCart(existingCart.id),
                userCartCache.remove({ userId, sku }),
            ]);
            return data;
        }),
    removeProductsInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                skus: z.array(z.string()),
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
            const { userId, skus } = input;

            const existingCart = await userCartCache.get(userId);
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            const existingVariants = existingCart.filter((cart) =>
                skus.includes(cart.sku)
            );
            if (existingVariants.length === 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "These variants are not in your cart",
                });

            const [data] = await Promise.all([
                queries.userCarts.deleteProductsFromCart(
                    userId,
                    existingVariants.map((cart) => cart.sku)
                ),
                userCartCache.drop(userId),
            ]);

            return data;
        }),
});
