import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema, createWishlistSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
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

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { userId, productId } = input;

            const existingWishlist = await userWishlistCache.getProduct(
                userId,
                productId
            );
            if (existingWishlist)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This product is already in your wishlist",
                });

            const data = await queries.userWishlists.addProductInWishlist({
                userId,
                productId,
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
            const { queries } = ctx;
            const { userId, productId, color, size, quantity } = input;

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
                size,
                color: color?.hex,
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
                        size,
                        color: color?.hex,
                    }),
                ]);

            return {
                type: existingCart ? ("update" as const) : ("add" as const),
            };
        }),
    removeProductInWishlist: protectedProcedure
        .input(createWishlistSchema)
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            console.log(user.id, userId);

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

            return data;
        }),
});
