import { DEFAULT_MESSAGES } from "@/config/const";
import { userCartCache, userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema, createWishlistSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, gt } from "drizzle-orm";
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
            const { queries, db, schemas } = ctx;
            const { userId, sku, quantity } = input;

            const existingVariant = await db.query.productVariants.findFirst({
                where: and(
                    eq(schemas.productVariants.sku, sku),
                    eq(schemas.productVariants.isAvailable, true),
                    gt(schemas.productVariants.quantity, 0),
                    eq(schemas.productVariants.isDeleted, false)
                ),
                with: {
                    product: true,
                },
            });
            if (!existingVariant)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product variant not found",
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
                sku,
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
                    userCartCache.remove({ userId, sku }),
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
