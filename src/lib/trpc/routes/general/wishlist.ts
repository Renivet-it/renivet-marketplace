import { userWishlistCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createWishlistSchema } from "@/lib/validations";
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
                    userId,
                    productId
                ),
                userWishlistCache.remove(userId, productId),
            ]);

            return data;
        }),
});
