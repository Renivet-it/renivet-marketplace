import { BitFieldSitePermission } from "@/config/permissions";
import { tagCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import { createTagSchema, updateTagSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const tagsRouter = createTRPCRouter({
    getTags: publicProcedure.query(async () => {
        const tags = await tagCache.getAll();
        return {
            data: tags,
            count: tags.length,
        };
    }),
    getTag: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const tag = await tagCache.get(id);
            if (!tag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            return tag;
        }),
    createTag: protectedProcedure
        .input(createTagSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOG_TAGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { name } = input;

            const slug = slugify(name);

            const existingTag = await queries.tags.getTagBySlug(slug);
            if (existingTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Tag already exists",
                });

            const newTag = await queries.tags.createTag({
                name,
                slug,
            });

            await tagCache.add({
                ...newTag,
                blogs: 0,
            });

            return newTag;
        }),
    updateTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateTagSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOG_TAGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingTag = await tagCache.get(id);
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            const slug = slugify(data.name);

            const existingOtherTag = await queries.tags.getOtherTag(slug, id);
            if (existingOtherTag)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Another tag with the same name already exists",
                });

            const [updatedTag] = await Promise.all([
                queries.tags.updateTag(id, {
                    ...data,
                    slug,
                }),
                tagCache.remove(id),
            ]);

            return updatedTag;
        }),
    deleteTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOG_TAGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingTag = await tagCache.get(id);
            if (!existingTag)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tag not found",
                });

            await Promise.all([
                queries.tags.deleteTag(id),
                tagCache.remove(id),
            ]);

            return true;
        }),
});
