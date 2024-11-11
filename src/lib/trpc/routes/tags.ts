import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import { createTagSchema, updateTagSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

export const tagsRouter = createTRPCRouter({
    getTags: publicProcedure.query(async ({ ctx }) => {
        const { db, schemas } = ctx;

        const tags = await db.query.tags.findMany({
            with: {
                blogTags: true,
            },
            orderBy: [desc(schemas.tags.createdAt)],
            extras: {
                tagCount: db.$count(schemas.tags).as("tag_count"),
            },
        });
        return tags;
    }),
    getTag: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const tag = await db.query.tags.findFirst({
                where: eq(schemas.tags.id, id),
                with: {
                    blogTags: true,
                },
            });
            if (!tag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            return tag;
        }),
    createTag: protectedProcedure
        .input(createTagSchema)
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOG_TAGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { name } = input;

            const slug = slugify(name);

            const existingTag = await db.query.tags.findFirst({
                where: eq(schemas.tags.slug, slug),
            });
            if (existingTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Tag already exists",
                });

            const newTag = await db
                .insert(schemas.tags)
                .values({
                    name,
                    slug,
                })
                .returning()
                .then((res) => res[0]);

            return newTag;
        }),
    updateTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateTagSchema,
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOG_TAGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            const existingTag = await db.query.tags.findFirst({
                where: eq(schemas.tags.id, id),
            });
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            const slug = slugify(data.name);

            const existingOtherTag = await db.query.tags.findFirst({
                where: and(
                    eq(schemas.tags.slug, slug),
                    ne(schemas.tags.id, id)
                ),
            });
            if (existingOtherTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Tag already exists",
                });

            const updatedTag = await db
                .update(schemas.tags)
                .set({
                    ...data,
                    slug,
                })
                .where(eq(schemas.tags.id, id))
                .returning()
                .then((res) => res[0]);

            return updatedTag;
        }),
    deleteTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOG_TAGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingTag = await db.query.tags.findFirst({
                where: eq(schemas.tags.id, id),
            });
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            await db.delete(schemas.tags).where(eq(schemas.tags.id, id));

            return true;
        }),
});
