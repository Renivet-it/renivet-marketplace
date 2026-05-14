import { createTRPCRouter, publicProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const createBackInStockRequestSchema = z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z
        .string()
        .min(7, "Phone must be at least 7 digits")
        .optional()
        .or(z.literal("")),
    source: z.string().default("pdp"),
});

export const backInStockRouter = createTRPCRouter({
    createBackInStockRequest: publicProcedure
        .input(createBackInStockRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const email =
                input.email?.trim().toLowerCase() ||
                ctx.user?.email?.trim().toLowerCase() ||
                null;
            const phone =
                input.phone?.trim() || ctx.user?.phone?.trim() || null;

            if (!email && !phone) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Enter an email or phone number",
                });
            }

            const existingProduct = await ctx.db.query.products.findFirst({
                where: (products, { eq }) => eq(products.id, input.productId),
                columns: { id: true },
            });

            if (!existingProduct) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });
            }

            if (input.variantId) {
                const existingVariant =
                    await ctx.db.query.productVariants.findFirst({
                        where: (variants, { eq, and }) =>
                            and(
                                eq(variants.id, input.variantId!),
                                eq(variants.productId, input.productId)
                            ),
                        columns: { id: true },
                    });

                if (!existingVariant) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Variant not found",
                    });
                }
            }

            const [request] = await ctx.db
                .insert(ctx.schemas.backInStockRequests)
                .values({
                    productId: input.productId,
                    variantId: input.variantId ?? null,
                    userId: input.userId ?? ctx.user?.id ?? null,
                    email,
                    phone,
                    source: input.source,
                    status: "active",
                })
                .onConflictDoUpdate({
                    target: [
                        ctx.schemas.backInStockRequests.productId,
                        ctx.schemas.backInStockRequests.variantId,
                        ctx.schemas.backInStockRequests.email,
                        ctx.schemas.backInStockRequests.phone,
                    ],
                    set: {
                        status: "active",
                        userId: input.userId ?? ctx.user?.id ?? null,
                        updatedAt: new Date(),
                    },
                })
                .returning();

            return request;
        }),
});
