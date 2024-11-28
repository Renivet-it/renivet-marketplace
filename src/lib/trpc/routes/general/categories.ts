import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
    getCategories: publicProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const categories = await db.query.categories.findMany({
            with: {
                subCategories: {
                    with: {
                        productTypes: true,
                    },
                },
            },
        });

        return categories;
    }),
    getCategory: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { db, schemas } = ctx;

            const category = await db.query.categories.findFirst({
                where: eq(schemas.categories.id, input.id),
                with: {
                    subCategories: {
                        with: {
                            productTypes: true,
                        },
                    },
                },
            });

            return category;
        }),
    createCategory: protectedProcedure
        .input(createCategorySchema)
        .use(async ({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_SETTINGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You are not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ input, ctx }) => {
            const { db, schemas } = ctx;

            const slug = slugify(input.name);

            const existingCategory = await db.query.categories.findFirst({
                where: eq(schemas.categories.slug, slug),
            });
            if (existingCategory)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Category already exists",
                });

            const newCategory = await db
                .insert(schemas.categories)
                .values({
                    ...input,
                    slug,
                })
                .returning()
                .then((res) => res[0]);

            return newCategory;
        }),
    updateCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateCategorySchema,
            })
        )
        .use(async ({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_SETTINGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You are not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ input, ctx }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            const existingCategory = await db.query.categories.findFirst({
                where: eq(schemas.categories.id, id),
            });
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            if (data.name) {
                const slug = slugify(data.name);

                const existingOtherCategory =
                    await db.query.categories.findFirst({
                        where: and(
                            eq(schemas.categories.slug, slug),
                            ne(schemas.categories.id, id)
                        ),
                    });
                if (existingOtherCategory)
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Category already exists",
                    });
            }

            const updatedCategory = await db
                .update(schemas.categories)
                .set({
                    ...data,
                    slug: data.name ? slugify(data.name) : undefined,
                })
                .where(eq(schemas.categories.id, id))
                .returning()
                .then((res) => res[0]);

            return updatedCategory;
        }),
    deleteCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(async ({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_SETTINGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You are not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ input, ctx }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingCategory = await db.query.categories.findFirst({
                where: eq(schemas.categories.id, id),
            });
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            await db
                .delete(schemas.categories)
                .where(eq(schemas.categories.id, id));

            return true;
        }),
});
