import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

export const blogTagsRouter = createTRPCRouter({
    getTags: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const tags = await db.query.blogTags.findMany({
            with: {
                blogToTags: true,
            },
        });
        return tags;
    }),
    getTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const tag = await db.query.blogTags.findFirst({
                where: eq(schemas.blogTags.id, id),
                with: {
                    blogToTags: true,
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
        .input(
            z.object({
                name: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { name } = input;

            const slug = slugify(name);

            const existingTag = await db.query.blogTags.findFirst({
                where: eq(schemas.blogTags.slug, slug),
            });
            if (existingTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Tag already exists",
                });

            const newTag = await db
                .insert(schemas.blogTags)
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
                name: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, name } = input;

            const existingTag = await db.query.blogTags.findFirst({
                where: eq(schemas.blogTags.id, id),
            });
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            const slug = slugify(name);

            const existingOtherTag = await db.query.blogTags.findFirst({
                where: and(
                    eq(schemas.blogTags.slug, slug),
                    ne(schemas.blogTags.id, id)
                ),
            });
            if (existingOtherTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Tag already exists",
                });

            const updatedTag = await db
                .update(schemas.blogTags)
                .set({
                    name,
                    slug,
                })
                .where(eq(schemas.blogTags.id, id))
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
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingTag = await db.query.blogTags.findFirst({
                where: eq(schemas.blogTags.id, id),
            });
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            await db
                .delete(schemas.blogTags)
                .where(eq(schemas.blogTags.id, id));

            return true;
        }),
});
