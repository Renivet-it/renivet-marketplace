import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { db } from "@/lib/db";
import { brandProductTypePacking } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/* ===============================
   INPUT (NO BRAND ID)
================================ */
const brandPackingSchema = z.object({
  productTypeId: z.string().uuid(),
  packingTypeId: z.string().uuid().nullable(),
  isFragile: z.boolean(),
  shipsInOwnBox: z.boolean(),
  canOverride: z.boolean(),
});

/* ===============================
   ROUTER
================================ */
export const brandPackingRouter = createTRPCRouter({
  /* ========= CREATE ========= */
  create: protectedProcedure
    .input(brandPackingSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.brand?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brand not found for user",
        });
      }

      const [created] = await db
        .insert(brandProductTypePacking)
        .values({
          ...input,
          brandId: ctx.user.brand.id,
        })
        .returning();

      return created;
    }),

  /* ========= UPDATE ========= */
  update: protectedProcedure
    .input(
      brandPackingSchema.extend({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await db
        .update(brandProductTypePacking)
        .set({
          ...data,
          brandId: ctx.user.brand!.id, // 🔒 force brand
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(brandProductTypePacking.id, id),
            eq(
              brandProductTypePacking.brandId,
              ctx.user.brand!.id // 🔒 OWN DATA ONLY
            )
          )
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing rule not found",
        });
      }

      return updated;
    }),

  /* ========= GET ALL (BRAND ONLY) ========= */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.query.brandProductTypePacking.findMany({
      where: eq(
        brandProductTypePacking.brandId,
        ctx.user.brand!.id
      ),
      with: {
        productType: true,
        packingType: true,
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }),

  /* ========= GET BY ID ========= */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const record =
        await db.query.brandProductTypePacking.findFirst({
          where: and(
            eq(brandProductTypePacking.id, input.id),
            eq(
              brandProductTypePacking.brandId,
              ctx.user.brand!.id
            )
          ),
        });

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing rule not found",
        });
      }

      return record;
    }),

  /* ========= DELETE ========= */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(brandProductTypePacking)
        .where(
          and(
            eq(brandProductTypePacking.id, input.id),
            eq(
              brandProductTypePacking.brandId,
              ctx.user.brand!.id
            )
          )
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing rule not found",
        });
      }

      return deleted;
    }),
});
