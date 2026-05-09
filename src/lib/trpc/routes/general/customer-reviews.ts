import { orderItems, orders } from "@/lib/db/schema/order";
import {
    products as productsTable,
    productVariants,
} from "@/lib/db/schema/product";
import { reviews } from "@/lib/db/schema/review";
import {
    adminProcedure,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

const reviewAttributeSchema = z.object({
    label: z.string(),
    value: z.string(),
});

function formatVariantLabel(variant: {
    id: string;
    sku?: string | null;
    combinations?: unknown;
    options?: {
        id: string;
        name: string;
        values: { id: string; name: string }[];
    }[];
}) {
    const combinations =
        variant.combinations && typeof variant.combinations === "object"
            ? Object.entries(variant.combinations as Record<string, unknown>)
                  .map(([key, value]) => {
                      const option = variant.options?.find(
                          (item) => item.id === key
                      );
                      const optionValue = option?.values.find(
                          (item) => item.id === String(value)
                      );

                      return option && optionValue
                          ? `${option.name}: ${optionValue.name}`
                          : "";
                  })
                  .filter(Boolean)
                  .join(", ")
            : "";

    return combinations || variant.sku || `Variant ${variant.id.slice(0, 8)}`;
}

async function getPurchasedVariants(
    db: any,
    userId: string,
    productId: string
) {
    const product = await db.query.products.findFirst({
        where: eq(productsTable.id, productId),
        columns: {
            id: true,
        },
        with: {
            options: {
                columns: {
                    id: true,
                    name: true,
                    values: true,
                },
            },
        },
    });

    const rows = await db
        .select({
            variantId: orderItems.variantId,
            sku: productVariants.sku,
            combinations: productVariants.combinations,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
        .where(
            and(
                eq(orders.userId, userId),
                eq(orderItems.productId, productId),
                or(
                    eq(orders.paymentStatus, "paid"),
                    eq(orders.status, "delivered")
                )
            )
        );

    const byId = new Map<string, { id: string; label: string }>();
    rows.forEach(
        (row: {
            variantId: string | null;
            sku: string | null;
            combinations: unknown;
        }) => {
            const id = row.variantId ?? "product";
            if (byId.has(id)) return;
            byId.set(id, {
                id,
                label:
                    row.variantId && row.combinations
                        ? formatVariantLabel({
                              id: row.variantId,
                              sku: row.sku,
                              combinations: row.combinations,
                              options: product?.options,
                          })
                        : "Product purchased",
            });
        }
    );

    return Array.from(byId.values());
}

export const customerReviewsRouter = createTRPCRouter({
    getReviewsByProduct: publicProcedure
        .input(z.object({ productId: z.string() }))
        .query(async ({ input, ctx }) => {
            return ctx.db.query.reviews.findMany({
                where: (reviews, { eq, and }) =>
                    and(
                        eq(reviews.productId, input.productId),
                        eq(reviews.status, "approved")
                    ),
                orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
                with: {
                    user: true,
                },
            });
        }),

    getReviewEligibility: protectedProcedure
        .input(z.object({ productId: z.string() }))
        .query(async ({ input, ctx }) => {
            const purchasedVariants = await getPurchasedVariants(
                ctx.db,
                ctx.user.id,
                input.productId
            );

            return {
                canReview: purchasedVariants.length > 0,
                purchasedVariants,
            };
        }),

    createReview: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                variantId: z.string().optional(),
                rating: z.number().min(1).max(5),
                title: z.string().min(1),
                content: z.string().min(1),
                images: z.array(z.string()).default([]),
                attributes: z.array(reviewAttributeSchema).default([]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { user } = ctx;
            const purchasedVariants = await getPurchasedVariants(
                ctx.db,
                user.id,
                input.productId
            );

            if (purchasedVariants.length === 0) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "Only customers who bought this product can review it.",
                });
            }

            const selectedVariant = input.variantId
                ? purchasedVariants.find(
                      (variant) => variant.id === input.variantId
                  )
                : purchasedVariants[0];

            if (input.variantId && !selectedVariant) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only review a variant you purchased.",
                });
            }

            const attributes = input.attributes.filter(
                (attribute) => attribute.label.toLowerCase() !== "variant"
            );

            const newReview = await ctx.db
                .insert(reviews)
                .values({
                    productId: input.productId,
                    userId: user.id,
                    authorName: `${user.firstName} ${user.lastName}`,
                    rating: input.rating,
                    title: input.title,
                    content: input.content,
                    images: input.images,
                    attributes,
                    status: "pending", // Requires admin approval as per requirements
                    verified: true,
                })
                .returning();

            return newReview[0];
        }),

    getReviewProducts: adminProcedure.query(async ({ ctx }) => {
        const data = await ctx.db.query.products.findMany({
            columns: {
                id: true,
                title: true,
            },
            orderBy: (products, { asc }) => [asc(products.title)],
            limit: 500,
            with: {
                options: {
                    columns: {
                        id: true,
                        name: true,
                        values: true,
                    },
                },
                variants: {
                    columns: {
                        id: true,
                        sku: true,
                        combinations: true,
                    },
                },
            },
        });

        return data.map((product) => ({
            ...product,
            variants: product.variants.map((variant) => ({
                id: variant.id,
                label: formatVariantLabel({
                    ...variant,
                    options: product.options,
                }),
            })),
        }));
    }),

    createAdminReview: adminProcedure
        .input(
            z.object({
                productId: z.string(),
                variantId: z.string().optional(),
                authorName: z.string().min(2),
                rating: z.number().min(1).max(5),
                title: z.string().min(3),
                content: z.string().min(10),
                images: z.array(z.string()).default([]),
                attributes: z.array(reviewAttributeSchema).default([]),
                status: z
                    .enum(["pending", "approved", "rejected"])
                    .default("approved"),
                verified: z.boolean().default(true),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const attributes = input.attributes.filter(
                (attribute) => attribute.label.toLowerCase() !== "variant"
            );

            if (input.variantId) {
                const variant = await ctx.db.query.productVariants.findFirst({
                    where: (productVariants, { eq }) =>
                        eq(productVariants.id, input.variantId!),
                    columns: {
                        id: true,
                        sku: true,
                        combinations: true,
                    },
                });

                if (!variant) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Variant not found.",
                    });
                }
            }

            const [created] = await ctx.db
                .insert(reviews)
                .values({
                    productId: input.productId,
                    authorName: input.authorName,
                    rating: input.rating,
                    title: input.title,
                    content: input.content,
                    images: input.images,
                    attributes,
                    status: input.status,
                    verified: input.verified,
                })
                .returning();

            return created;
        }),

    getAllReviews: adminProcedure
        .input(
            z.object({
                limit: z.number().default(50),
                offset: z.number().default(0),
            })
        )
        .query(async ({ input, ctx }) => {
            const data = await ctx.db.query.reviews.findMany({
                limit: input.limit,
                offset: input.offset,
                orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
                with: {
                    product: true,
                    user: true,
                },
            });

            return data;
        }),

    updateReviewStatus: adminProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.enum(["pending", "approved", "rejected"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const updated = await ctx.db
                .update(reviews)
                .set({ status: input.status })
                .where(eq(reviews.id, input.id))
                .returning();

            return updated[0];
        }),

    deleteReview: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            await ctx.db.delete(reviews).where(eq(reviews.id, input.id));
            return { success: true };
        }),
});
