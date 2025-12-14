import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/trpc";
import { db } from "@/lib/db";
import { packingTypes } from "@/lib/db/schema";
import { desc, eq, ilike } from "drizzle-orm";

/* ===============================
   ZOD SCHEMAS
================================ */

const packingTypeBaseSchema = z.object({
  baseLength: z.number().int().min(0),
  baseWidth: z.number().int().min(0),
  baseHeight: z.number().int().min(0),
  extraCm: z.number().int().min(0),
});

const createPackingTypeSchema = packingTypeBaseSchema;

const updatePackingTypeSchema = packingTypeBaseSchema.extend({
  id: z.string().uuid(),
});

/* ===============================
   ROUTER
================================ */

export const packingTypesRouter = createTRPCRouter({
  /* =========================
     GET ALL (PAGINATION)
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

      const data = await db.query.packingTypes.findMany({
        where: search
          ? ilike(packingTypes.id, `%${search}%`)
          : undefined,

        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(packingTypes.createdAt)],

        extras: {
          count: db
            .$count(
              packingTypes,
              search
                ? ilike(packingTypes.id, `%${search}%`)
                : undefined
            )
            .as("packing_type_count"),
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
      const record = await db.query.packingTypes.findFirst({
        where: eq(packingTypes.id, input.id),
      });

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing type not found",
        });
      }

      return record;
    }),

  /* =========================
     CREATE
  ========================= */
  create: protectedProcedure
    .input(createPackingTypeSchema)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(packingTypes)
        .values(input)
        .returning();

      return created;
    }),

  /* =========================
     UPDATE
  ========================= */
  update: protectedProcedure
    .input(updatePackingTypeSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const [updated] = await db
        .update(packingTypes)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(packingTypes.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing type not found",
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
        .delete(packingTypes)
        .where(eq(packingTypes.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Packing type not found",
        });
      }

      return deleted;
    }),
});
