import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { orderQueries } from "@/lib/db/queries";

export const orderIntentRouter = createTRPCRouter({
  createIntent: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        productId: z.string(),
        variantId: z.string().optional(),
        totalItems: z.number().optional(),
        totalAmount: z.number().positive(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAuthorized = user.id === userId;
      if (!isAuthorized)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to create this intent",
        });

      return next({ ctx, input });
    })
    .mutation(async ({ ctx, input }) => {
      const { userId, productId, variantId, totalItems, totalAmount } = input;

      // Verify product exists and is available
      const product = await ctx.db.query.products.findFirst({
        where: and(
          eq(ctx.schemas.products.id, productId),
          eq(ctx.schemas.products.isAvailable, true),
          eq(ctx.schemas.products.isActive, true),
          eq(ctx.schemas.products.isDeleted, false),
          eq(ctx.schemas.products.verificationStatus, "approved"),
          eq(ctx.schemas.products.isPublished, true)
        ),
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not available",
        });
      }

      // Verify variant if provided
      if (variantId) {
        const variant = await ctx.db.query.productVariants.findFirst({
          where: and(
            eq(ctx.schemas.productVariants.id, variantId),
            eq(ctx.schemas.productVariants.productId, productId),
            eq(ctx.schemas.productVariants.isDeleted, false)
          ),
        });

        if (!variant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Variant not available",
          });
        }
      }

      return orderQueries.createIntent(userId, productId, {
        variantId,
        totalItems,
        totalAmount,
      });
    }),

  getIntentById: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        intentId: z.string(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAuthorized = user.id === userId;
      if (!isAuthorized)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this intent",
        });

      return next({ ctx, input });
    })
    .query(async ({ input }) => {
      const { intentId, userId } = input;

      const intent = await orderQueries.getIntentById(intentId);
      if (!intent || intent.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Intent not found",
        });
      }

      return intent;
    }),

  getUserIntents: protectedProcedure
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
          message: "You are not authorized to view these intents",
        });

      return next({ ctx, input });
    })
    .query(async ({ input }) => {
      return orderQueries.getUserIntents(input.userId);
    }),

  getPendingUserIntents: protectedProcedure
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
          message: "You are not authorized to view these intents",
        });

      return next({ ctx, input });
    })
    .query(async ({ input }) => {
      return orderQueries.getPendingUserIntents(input.userId);
    }),

  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        intentId: z.string(),
        status: z.enum(["pending", "paid", "failed"]),
        paymentId: z.string().optional(),
        paymentMethod: z.string().optional(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAuthorized = user.id === userId;
      if (!isAuthorized)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update this intent",
        });

      return next({ ctx, input });
    })
    .mutation(async ({ input }) => {
      const { intentId, status, paymentId, paymentMethod, userId } = input;

      // Verify intent belongs to user
      const intent = await orderQueries.getIntentById(intentId);
      if (!intent || intent.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Intent not found",
        });
      }

      return orderQueries.updatePaymentStatus(intentId, status, {
        paymentId,
        paymentMethod,
      });
    }),

  linkToOrder: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        intentId: z.string(),
        orderId: z.string(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAuthorized = user.id === userId;
      if (!isAuthorized)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update this intent",
        });

      return next({ ctx, input });
    })
    .mutation(async ({ input }) => {
      const { intentId, orderId, userId } = input;

      // Verify intent belongs to user
      const intent = await orderQueries.getIntentById(intentId);
      if (!intent || intent.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Intent not found",
        });
      }

      // Verify payment was successful
      if (intent.paymentStatus !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only paid intents can be linked to orders",
        });
      }

      return orderQueries.linkToOrder(intentId, orderId);
    }),

  deleteIntent: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        intentId: z.string(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAuthorized = user.id === userId;
      if (!isAuthorized)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this intent",
        });

      return next({ ctx, input });
    })
    .mutation(async ({ input }) => {
      const { intentId, userId } = input;

      // Verify intent belongs to user
      const intent = await orderQueries.getIntentById(intentId);
      if (!intent || intent.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Intent not found",
        });
      }

      return orderQueries.deleteIntent(intentId);
    }),

  cleanupExpiredIntents: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .use(({ ctx, input, next }) => {
      const { user } = ctx;
      const { userId } = input;

      const isAdmin = user.role === "admin";
      if (!isAdmin)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can cleanup expired intents",
        });

      return next({ ctx, input });
    })
    .mutation(async () => {
      return orderQueries.cleanupExpiredIntents();
    }),
});