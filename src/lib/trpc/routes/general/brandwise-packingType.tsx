import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/trpc";
import { db } from "@/lib/db";
import {
  brandProductTypePacking,
  brands,
  productTypes,
  packingTypes,
} from "@/lib/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
const brandProductTypePackingBaseSchema = z.object({
  brandId: z.string().uuid(),
  productTypeId: z.string().uuid(),
  packingTypeId: z.string().uuid().nullable(),

  isFragile: z.boolean().default(false),
  shipsInOwnBox: z.boolean().default(false),
  canOverride: z.boolean().default(false),
});

const createBrandProductTypePackingSchema =
  brandProductTypePackingBaseSchema;

const updateBrandProductTypePackingSchema =
  brandProductTypePackingBaseSchema.extend({
    id: z.string().uuid(),
  });

export const brandProductTypePackingRouter = createTRPCRouter({
  /* =========================
     GET ALL (ADMIN)
  ========================= */
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, search } = input;

      const data = await db.query.brandProductTypePacking.findMany({
        where: search
          ? or(
              ilike(brands.name, `%${search}%`),
              ilike(productTypes.name, `%${search}%`),
              ilike(packingTypes.name, `%${search}%`)
            )
          : undefined,

        with: {
          brand: true,
          productType: true,
          packingType: true,
        },

        limit,
        offset: (page - 1) * limit,
        orderBy: desc(brandProductTypePacking.createdAt),

        extras: {
          count: db
            .$count(
              brandProductTypePacking,
              search
                ? or(
                    ilike(brands.name, `%${search}%`),
                    ilike(productTypes.name, `%${search}%`),
                    ilike(packingTypes.name, `%${search}%`)
                  )
                : undefined
            )
            .as("brand_product_type_packing_count"),
        },
      });

      return {
        data,
        count: Number(data?.[0]?.count) || 0,
      };
    }),

  /* =========================
     GET BY ID
  ========================= */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const record =
        await db.query.brandProductTypePacking.findFirst({
          where: eq(brandProductTypePacking.id, input.id),
          with: {
            brand: true,
            productType: true,
            packingType: true,
          },
        });

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      return record;
    }),

  /* =========================
     CREATE (ADMIN)
  ========================= */
  create: protectedProcedure
    .input(createBrandProductTypePackingSchema)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(brandProductTypePacking)
        .values(input)
        .returning();

      return created;
    }),

  /* =========================
     UPDATE (ADMIN)
  ========================= */
  update: protectedProcedure
    .input(updateBrandProductTypePackingSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const [updated] = await db
        .update(brandProductTypePacking)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(brandProductTypePacking.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      return updated;
    }),

  /* =========================
     DELETE
  ========================= */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(brandProductTypePacking)
        .where(eq(brandProductTypePacking.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      return deleted;
    }),
});
