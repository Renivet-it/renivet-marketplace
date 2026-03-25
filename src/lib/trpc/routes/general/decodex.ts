import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandSubcategoryDecodeXJourneys,
    brandSubcategoryDecodeXStories,
    brands,
    products,
    subCategories,
} from "@/lib/db/schema";
import {
    createTRPCRouter,
    isTRPCAuth,
    publicProcedure,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";

const nullableTextField = z
    .string()
    .trim()
    .max(5000)
    .optional()
    .nullable()
    .transform((value) => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    });

const decodeXBaseSchema = z.object({
    brandId: z.string().uuid("Brand is required"),
    subcategoryId: z.string().uuid("Sub-category is required"),
    mainMaterial: nullableTextField,
    rawMaterialSupplierName: nullableTextField,
    rawMaterialSupplierLocation: nullableTextField,
    manufacturerName: nullableTextField,
    manufacturingLocation: nullableTextField,
    packingDispatchSource: nullableTextField,
    packingDispatchLocation: nullableTextField,
    virginPlasticUsed: z.boolean().optional().nullable(),
    supplierDeclarationAvailable: z.boolean().optional().nullable(),
    certifications: nullableTextField,
    certificationShareable: z.boolean().optional().nullable(),
    storyHuman: nullableTextField,
    storyTruth: nullableTextField,
    storyImpact: nullableTextField,
    storyWhy: nullableTextField,
    storyPriceBreakdown: nullableTextField,
});

export const decodeXRouter = createTRPCRouter({
    getBrands: protectedProcedure
        .use(
            isTRPCAuth(
                BitFieldSitePermission.MANAGE_FEEDBACK |
                    BitFieldSitePermission.VIEW_FEEDBACK,
                "any"
            )
        )
        .query(async () => {
            return db.query.brands.findMany({
                columns: {
                    id: true,
                    name: true,
                },
                orderBy: [asc(brands.name)],
            });
        }),

    getSubcategoriesByBrand: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.MANAGE_FEEDBACK |
                    BitFieldSitePermission.VIEW_FEEDBACK,
                "any"
            )
        )
        .query(async ({ input }) => {
            const subcategoryRows = await db
                .selectDistinct({
                    subcategoryId: products.subcategoryId,
                })
                .from(products)
                .where(eq(products.brandId, input.brandId));

            const subcategoryIds = subcategoryRows
                .map((row) => row.subcategoryId)
                .filter(Boolean);

            if (subcategoryIds.length === 0) {
                return [];
            }

            return db.query.subCategories.findMany({
                where: inArray(subCategories.id, subcategoryIds),
                columns: {
                    id: true,
                    name: true,
                },
                orderBy: [asc(subCategories.name)],
            });
        }),

    getPublicByScope: publicProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                subcategoryId: z.string().uuid(),
            })
        )
        .query(async ({ input }) => {
            const journey =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: and(
                        eq(brandSubcategoryDecodeXJourneys.brandId, input.brandId),
                        eq(
                            brandSubcategoryDecodeXJourneys.subcategoryId,
                            input.subcategoryId
                        )
                    ),
                    with: {
                        brand: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                        subcategory: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                });

            if (!journey) {
                return null;
            }

            const story = await db.query.brandSubcategoryDecodeXStories.findFirst({
                where: and(
                    eq(brandSubcategoryDecodeXStories.brandId, input.brandId),
                    eq(
                        brandSubcategoryDecodeXStories.subcategoryId,
                        input.subcategoryId
                    )
                ),
            });

            return {
                ...journey,
                storyHuman: story?.storyHuman ?? null,
                storyTruth: story?.storyTruth ?? null,
                storyImpact: story?.storyImpact ?? null,
                storyWhy: story?.storyWhy ?? null,
                storyPriceBreakdown: story?.storyPriceBreakdown ?? null,
            };
        }),

    getAll: protectedProcedure
        .input(
            z.object({
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).max(100).default(10),
                search: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.MANAGE_FEEDBACK |
                    BitFieldSitePermission.VIEW_FEEDBACK,
                "any"
            )
        )
        .query(async ({ input }) => {
            const { page, limit, search } = input;
            const searchTerm = search?.trim().toLowerCase();

            const journeys = await db.query.brandSubcategoryDecodeXJourneys.findMany({
                with: {
                    brand: {
                        columns: {
                            id: true,
                            name: true,
                        },
                    },
                    subcategory: {
                        columns: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: [desc(brandSubcategoryDecodeXJourneys.updatedAt)],
            });

            const filtered = !searchTerm
                ? journeys
                : journeys.filter((row) => {
                      const searchBlob = [
                          row.brand.name,
                          row.subcategory.name,
                          row.mainMaterial,
                          row.manufacturerName,
                          row.certifications,
                      ]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase();

                      return searchBlob.includes(searchTerm);
                  });

            const count = filtered.length;
            const paginated = filtered.slice((page - 1) * limit, page * limit);

            const brandIds = Array.from(
                new Set(paginated.map((row) => row.brandId))
            );
            const subcategoryIds = Array.from(
                new Set(paginated.map((row) => row.subcategoryId))
            );

            const stories =
                brandIds.length && subcategoryIds.length
                    ? await db.query.brandSubcategoryDecodeXStories.findMany({
                          where: and(
                              inArray(
                                  brandSubcategoryDecodeXStories.brandId,
                                  brandIds
                              ),
                              inArray(
                                  brandSubcategoryDecodeXStories.subcategoryId,
                                  subcategoryIds
                              )
                          ),
                      })
                    : [];

            const storyMap = new Map(
                stories.map((story) => [
                    `${story.brandId}:${story.subcategoryId}`,
                    story,
                ])
            );

            return {
                data: paginated.map((row) => {
                    const story = storyMap.get(
                        `${row.brandId}:${row.subcategoryId}`
                    );

                    return {
                        ...row,
                        storyHuman: story?.storyHuman ?? null,
                        storyTruth: story?.storyTruth ?? null,
                        storyImpact: story?.storyImpact ?? null,
                        storyWhy: story?.storyWhy ?? null,
                        storyPriceBreakdown: story?.storyPriceBreakdown ?? null,
                    };
                }),
                count,
            };
        }),

    getById: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.MANAGE_FEEDBACK |
                    BitFieldSitePermission.VIEW_FEEDBACK,
                "any"
            )
        )
        .query(async ({ input }) => {
            const journey =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: eq(brandSubcategoryDecodeXJourneys.id, input.id),
                    with: {
                        brand: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                        subcategory: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                });

            if (!journey) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "DecodeX configuration not found",
                });
            }

            const story = await db.query.brandSubcategoryDecodeXStories.findFirst({
                where: and(
                    eq(brandSubcategoryDecodeXStories.brandId, journey.brandId),
                    eq(
                        brandSubcategoryDecodeXStories.subcategoryId,
                        journey.subcategoryId
                    )
                ),
            });

            return {
                ...journey,
                storyHuman: story?.storyHuman ?? null,
                storyTruth: story?.storyTruth ?? null,
                storyImpact: story?.storyImpact ?? null,
                storyWhy: story?.storyWhy ?? null,
                storyPriceBreakdown: story?.storyPriceBreakdown ?? null,
            };
        }),

    create: protectedProcedure
        .input(decodeXBaseSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_FEEDBACK))
        .mutation(async ({ input }) => {
            const existing =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: and(
                        eq(brandSubcategoryDecodeXJourneys.brandId, input.brandId),
                        eq(
                            brandSubcategoryDecodeXJourneys.subcategoryId,
                            input.subcategoryId
                        )
                    ),
                });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "DecodeX configuration already exists for this brand and sub-category",
                });
            }

            const created = await db.transaction(async (tx) => {
                const [journey] = await tx
                    .insert(brandSubcategoryDecodeXJourneys)
                    .values({
                        brandId: input.brandId,
                        subcategoryId: input.subcategoryId,
                        mainMaterial: input.mainMaterial,
                        rawMaterialSupplierName: input.rawMaterialSupplierName,
                        rawMaterialSupplierLocation:
                            input.rawMaterialSupplierLocation,
                        manufacturerName: input.manufacturerName,
                        manufacturingLocation: input.manufacturingLocation,
                        packingDispatchSource: input.packingDispatchSource,
                        packingDispatchLocation: input.packingDispatchLocation,
                        virginPlasticUsed: input.virginPlasticUsed ?? null,
                        supplierDeclarationAvailable:
                            input.supplierDeclarationAvailable ?? null,
                        certifications: input.certifications,
                        certificationShareable:
                            input.certificationShareable ?? null,
                    })
                    .returning();

                await tx.insert(brandSubcategoryDecodeXStories).values({
                    brandId: input.brandId,
                    subcategoryId: input.subcategoryId,
                    storyHuman: input.storyHuman,
                    storyTruth: input.storyTruth,
                    storyImpact: input.storyImpact,
                    storyWhy: input.storyWhy,
                    storyPriceBreakdown: input.storyPriceBreakdown,
                });

                return journey;
            });

            return created;
        }),

    update: protectedProcedure
        .input(
            decodeXBaseSchema.extend({
                id: z.string().uuid(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_FEEDBACK))
        .mutation(async ({ input }) => {
            const existing =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: eq(brandSubcategoryDecodeXJourneys.id, input.id),
                });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "DecodeX configuration not found",
                });
            }

            const duplicate =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: and(
                        eq(brandSubcategoryDecodeXJourneys.brandId, input.brandId),
                        eq(
                            brandSubcategoryDecodeXJourneys.subcategoryId,
                            input.subcategoryId
                        ),
                        ne(brandSubcategoryDecodeXJourneys.id, input.id)
                    ),
                });

            if (duplicate) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "Another DecodeX configuration already exists for this brand and sub-category",
                });
            }

            const updated = await db.transaction(async (tx) => {
                const [journey] = await tx
                    .update(brandSubcategoryDecodeXJourneys)
                    .set({
                        brandId: input.brandId,
                        subcategoryId: input.subcategoryId,
                        mainMaterial: input.mainMaterial,
                        rawMaterialSupplierName: input.rawMaterialSupplierName,
                        rawMaterialSupplierLocation:
                            input.rawMaterialSupplierLocation,
                        manufacturerName: input.manufacturerName,
                        manufacturingLocation: input.manufacturingLocation,
                        packingDispatchSource: input.packingDispatchSource,
                        packingDispatchLocation: input.packingDispatchLocation,
                        virginPlasticUsed: input.virginPlasticUsed ?? null,
                        supplierDeclarationAvailable:
                            input.supplierDeclarationAvailable ?? null,
                        certifications: input.certifications,
                        certificationShareable:
                            input.certificationShareable ?? null,
                        updatedAt: new Date(),
                    })
                    .where(eq(brandSubcategoryDecodeXJourneys.id, input.id))
                    .returning();

                const existingStory =
                    await tx.query.brandSubcategoryDecodeXStories.findFirst({
                        where: and(
                            eq(
                                brandSubcategoryDecodeXStories.brandId,
                                existing.brandId
                            ),
                            eq(
                                brandSubcategoryDecodeXStories.subcategoryId,
                                existing.subcategoryId
                            )
                        ),
                    });

                if (existingStory) {
                    await tx
                        .update(brandSubcategoryDecodeXStories)
                        .set({
                            brandId: input.brandId,
                            subcategoryId: input.subcategoryId,
                            storyHuman: input.storyHuman,
                            storyTruth: input.storyTruth,
                            storyImpact: input.storyImpact,
                            storyWhy: input.storyWhy,
                            storyPriceBreakdown: input.storyPriceBreakdown,
                            updatedAt: new Date(),
                        })
                        .where(
                            eq(brandSubcategoryDecodeXStories.id, existingStory.id)
                        );
                } else {
                    await tx.insert(brandSubcategoryDecodeXStories).values({
                        brandId: input.brandId,
                        subcategoryId: input.subcategoryId,
                        storyHuman: input.storyHuman,
                        storyTruth: input.storyTruth,
                        storyImpact: input.storyImpact,
                        storyWhy: input.storyWhy,
                        storyPriceBreakdown: input.storyPriceBreakdown,
                    });
                }

                return journey;
            });

            return updated;
        }),

    delete: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_FEEDBACK))
        .mutation(async ({ input }) => {
            const existing =
                await db.query.brandSubcategoryDecodeXJourneys.findFirst({
                    where: eq(brandSubcategoryDecodeXJourneys.id, input.id),
                });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "DecodeX configuration not found",
                });
            }

            await db.transaction(async (tx) => {
                await tx
                    .delete(brandSubcategoryDecodeXJourneys)
                    .where(eq(brandSubcategoryDecodeXJourneys.id, input.id));

                await tx
                    .delete(brandSubcategoryDecodeXStories)
                    .where(
                        and(
                            eq(
                                brandSubcategoryDecodeXStories.brandId,
                                existing.brandId
                            ),
                            eq(
                                brandSubcategoryDecodeXStories.subcategoryId,
                                existing.subcategoryId
                            )
                        )
                    );
            });

            return { success: true };
        }),
});
