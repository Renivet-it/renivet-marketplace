import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { orderQueries } from "@/lib/db/queries";

// Define a schema for a single product within the intent
const productIntentSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  name: z.string().optional(),
  sku: z.string().optional(),
});

export const orderIntentRouter = createTRPCRouter({
createIntent: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        products: z.array(productIntentSchema), // Still accepts an array of products from frontend
        totalAmount: z.number().positive(), // This totalAmount might be for the entire cart, but individual intents will have their own totalAmount
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
      const { userId, products } = input; // Removed totalAmount from destructuring as it's not directly used for individual intents

      // Verify each product and variant in the array
      for (const productInput of products) {
        const { productId, variantId } = productInput;

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
            message: `Product with ID ${productId} not available`,
          });
        }

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
              message: `Variant with ID ${variantId} for product ${productId} not available`,
            });
          }
        }
      }

      // Instead of passing the whole array, iterate and create an intent for each product
      // This assumes orderQueries.createIntent expects single product details
      const createdIntents = [];
      for (const productInput of products) {
        const { productId, variantId, quantity, price } = productInput;
        // Log before calling orderQueries.createIntent for each product
        console.log("Calling orderQueries.createIntent for product:", { userId, productId, variantId, quantity, price });
        const intent = await orderQueries.createIntent(
          userId,
          productId,
          { variantId, totalItems: quantity, totalAmount: price * quantity },
          // You might want to pass metadata from the original request if available
          // For now, leaving it as undefined or passing a default
          undefined
        );
        createdIntents.push(intent);
      }

      // Return the first intent or an array of intents, depending on what the frontend expects
      // For now, returning the first intent as the primary intent for the payment process
      // You might need to adjust this based on how your payment gateway handles multiple intents
      return createdIntents[0];
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

