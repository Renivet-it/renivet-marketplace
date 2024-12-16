import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema, updateCartSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
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
            const { queries } = ctx;
            const { userId, productId } = input;

            const existingProduct =
                await queries.products.getProduct(productId);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (!existingProduct.isAvailable)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This product is not available",
                });

            const existingCart = await userCartCache.getProduct({
                userId,
                productId,
                size: input.size,
                color: input.color?.hex,
            });

            if (!existingCart) await queries.userCarts.addProductToCart(input);
            else {
                await Promise.all([
                    queries.userCarts.updateProductInCart(existingCart.id, {
                        ...existingCart,
                        quantity: existingCart.quantity + input.quantity,
                    }),
                    userCartCache.remove({
                        userId,
                        productId,
                        size: input.size,
                        color: input.color?.hex,
                    }),
                ]);
            }

            return {
                type: existingCart ? ("update" as const) : ("add" as const),
            };
        }),
    updateProductSizeInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: z.string(),
                oldSize: updateCartSchema.shape.size,
                newSize: updateCartSchema.shape.size,
                color: updateCartSchema.shape.color,
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
            const { userId, productId, oldSize, newSize, color } = input;

            const [existingOldCart, existingOtherCart] = await Promise.all([
                userCartCache.getProduct({
                    userId,
                    productId,
                    size: oldSize,
                    color: color?.hex,
                }),
                userCartCache.getProduct({
                    userId,
                    productId,
                    size: newSize,
                    color: color?.hex,
                }),
            ]);
            if (!existingOldCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            if (existingOldCart.size === newSize)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No changes were made to the cart",
                });

            if (!existingOtherCart) {
                const [data] = await Promise.all([
                    queries.userCarts.addProductToCart({
                        ...existingOldCart,
                        size: newSize,
                    }),
                    queries.userCarts.deleteProductFromCart(existingOldCart.id),
                    userCartCache.remove({
                        userId,
                        productId,
                        size: oldSize,
                        color: color?.hex,
                    }),
                ]);
                return data;
            } else {
                const [data] = await Promise.all([
                    queries.userCarts.updateProductInCart(
                        existingOtherCart.id,
                        {
                            ...existingOtherCart,
                            quantity:
                                existingOtherCart.quantity +
                                existingOldCart.quantity,
                        }
                    ),
                    queries.userCarts.deleteProductFromCart(existingOldCart.id),
                    userCartCache.remove({
                        userId,
                        productId,
                        size: oldSize,
                        color: color?.hex,
                    }),
                    userCartCache.remove({
                        userId,
                        productId,
                        size: newSize,
                        color: color?.hex,
                    }),
                ]);
                return data;
            }
        }),
    updateProductQuantityInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: z.string(),
                size: updateCartSchema.shape.size,
                color: updateCartSchema.shape.color,
                quantity: z.number(),
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
            const { userId, productId, size, color, quantity } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                productId,
                size,
                color: color?.hex,
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

            const [data] = await Promise.all([
                queries.userCarts.updateProductInCart(existingCart.id, {
                    ...existingCart,
                    quantity,
                }),
                userCartCache.remove({
                    userId,
                    productId,
                    size,
                    color: color?.hex,
                }),
            ]);
            return data;
        }),
    updateStatusInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productId: z.string().optional(),
                status: z.boolean(),
                size: updateCartSchema.shape.size.optional(),
                color: updateCartSchema.shape.color.optional(),
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
            const { userId, status, productId, size, color } = input;

            if (productId) {
                if (!size) throw new Error("Size is required");

                const existingCart = await userCartCache.getProduct({
                    userId,
                    productId,
                    size,
                    color: color?.hex,
                });
                if (!existingCart)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "This product is not in your cart",
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
            createCartSchema.omit({
                quantity: true,
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
            const { userId, productId } = input;

            const [existingCart, existingWishlist] = await Promise.all([
                userCartCache.getProduct({
                    userId,
                    productId,
                    size: input.size,
                    color: input.color?.hex,
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
                    productId,
                    size: input.size,
                    color: input.color?.hex,
                }),
            ]);
            return data;
        }),
    removeProductInCart: protectedProcedure
        .input(
            createCartSchema.omit({
                quantity: true,
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
            const { userId, productId } = input;

            const existingCart = await userCartCache.getProduct({
                userId,
                productId,
                size: input.size,
                color: input.color?.hex,
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
                    size: input.size,
                    color: input.color?.hex,
                }),
            ]);
            return data;
        }),
    removeProductsInCart: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                productIds: z.array(z.string()),
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
            const { userId, productIds } = input;

            const existingCart = await userCartCache.get(userId);
            if (!existingCart)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This product is not in your cart",
                });

            const existingProducts = existingCart.filter((cart) =>
                productIds.includes(cart.productId)
            );
            if (existingProducts.length === 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "These products are not in your cart",
                });

            const [data] = await Promise.all([
                queries.userCarts.deleteProductsFromCart(
                    existingProducts.map((cart) => cart.productId)
                ),
                userCartCache.drop(userId),
            ]);

            return data;
        }),
});
