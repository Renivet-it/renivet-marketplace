import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { reviews } from "@/lib/db/schema/review";
import {
    adminProcedure,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";

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

    createReview: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                rating: z.number().min(1).max(5),
                title: z.string().min(1),
                content: z.string().min(1),
                images: z.array(z.string()).default([]),
                attributes: z.array(
                    z.object({ label: z.string(), value: z.string() })
                ).default([]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { user } = ctx;
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
                    attributes: input.attributes,
                    status: "pending", // Requires admin approval as per requirements
                })
                .returning();

            return newReview[0];
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
