import { userCartCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { createCartSchema } from "@/lib/validations";
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
                        quantity: existingCart.quantity + 1,
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
    removeProductInCart: protectedProcedure
        .input(createCartSchema)
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
});
