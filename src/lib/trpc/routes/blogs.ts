import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import { tagCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey, slugify } from "@/lib/utils";
import {
    blogWithAuthorAndTagSchema,
    createBlogSchema,
    updateBlogSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

export const blogsRouter = createTRPCRouter({
    getBlogs: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                tagId: z.string().optional(),
                isPublished: z.boolean().optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { limit, page, tagId, isPublished, search } = input;

            if (!!tagId?.length) {
                const data = await queries.blogs.getBlogsByTag({
                    tagId,
                    limit,
                    page,
                    search,
                });

                return data;
            }

            const data = await queries.blogs.getBlogs({
                limit,
                page,
                search,
                isPublished,
            });

            return data;
        }),
    getBlog: publicProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
                })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, slug } = input;

            const blog = await queries.blogs.getBlog({ id, slug });
            if (!blog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const parsed = blogWithAuthorAndTagSchema.parse(blog);
            return parsed;
        }),
    createBlog: protectedProcedure
        .input(createBlogSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOGS))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user, queries } = ctx;

            const slug = slugify(input.title);

            const allTags = await tagCache.getAll();
            const existingTags = allTags.filter((tag) =>
                input.tagIds.includes(tag.id)
            );

            const missingTags = input.tagIds.filter(
                (tagId) => !existingTags.find((tag) => tag.id === tagId)
            );
            if (missingTags.length > 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Tags with IDs ${missingTags.join(
                        ", "
                    )} not found`,
                });

            const existingBlog = await queries.blogs.getBlog({ slug });
            if (existingBlog)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Blog already exists",
                });

            const newBlog = await db.transaction(async (tx) => {
                const blog = await tx
                    .insert(schemas.blogs)
                    .values({
                        ...input,
                        slug,
                        authorId: user.id,
                        publishedAt: input.isPublished ? new Date() : null,
                    })
                    .returning()
                    .then((res) => res[0]);

                await Promise.all([
                    tx.insert(schemas.blogTags).values(
                        input.tagIds.map((tagId) => ({
                            blogId: blog.id,
                            tagId,
                        }))
                    ),
                    tagCache.updateBulk(
                        existingTags.map((tag) => ({
                            ...tag,
                            blogs: tag.blogs + 1,
                        }))
                    ),
                ]);

                return blog;
            });

            return newBlog;
        }),
    updateBlog: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateBlogSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOGS))
        .mutation(async ({ ctx, input }) => {
            const { queries, db, schemas } = ctx;
            const { id, data } = input;

            const existingBlog = await queries.blogs.getBlog({ id });
            if (!existingBlog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const existingThumbnailUrl = existingBlog.thumbnailUrl;
            if (
                existingThumbnailUrl &&
                existingThumbnailUrl !== data.thumbnailUrl
            ) {
                const existingKey = getUploadThingFileKey(existingThumbnailUrl);
                await utApi.deleteFiles([existingKey]);
            }

            if (
                existingBlog.tags.length !== data.tagIds.length ||
                !existingBlog.tags.every((tag) => data.tagIds.includes(tag.id))
            ) {
                const allTags = await tagCache.getAll();
                const existingTags = allTags.filter((tag) =>
                    data.tagIds.includes(tag.id)
                );

                const missingTags = data.tagIds.filter(
                    (tagId) => !existingTags.find((tag) => tag.id === tagId)
                );
                if (missingTags.length > 0)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: `Tags with IDs ${missingTags.join(
                            ", "
                        )} not found`,
                    });

                const tagsToInsert = existingTags.filter(
                    (tag) =>
                        !existingBlog.tags.some(
                            (existingTag) => existingTag.id === tag.id
                        )
                );
                const tagsToDelete = existingBlog.tags.filter(
                    (tag) =>
                        !existingTags.some(
                            (existingTag) => existingTag.id === tag.id
                        )
                );

                console.log(tagsToInsert, tagsToDelete);

                await db.transaction(async (tx) => {
                    await Promise.all([
                        tagsToInsert.length > 0 &&
                            tx.insert(schemas.blogTags).values(
                                tagsToInsert.map((tag) => ({
                                    blogId: id,
                                    tagId: tag.id,
                                }))
                            ),
                        tagsToDelete.length > 0 &&
                            tx.delete(schemas.blogTags).where(
                                and(
                                    eq(schemas.blogTags.blogId, id),
                                    inArray(
                                        schemas.blogTags.tagId,
                                        tagsToDelete.map((tag) => tag.id)
                                    )
                                )
                            ),
                        tagCache.drop(),
                    ]);
                });
            }

            const updatedBlog = await queries.blogs.updateBlog(id, data);
            return updatedBlog;
        }),
    changePublishStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                isPublished: z.boolean(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, isPublished } = input;

            const existingBlog = await queries.blogs.getBlog({ id });
            if (!existingBlog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const updatedBlog = await queries.blogs.updateBlogStatus(
                id,
                isPublished
            );

            return updatedBlog;
        }),
    deleteBlog: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BLOGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBlog = await queries.blogs.getBlog({ id });
            if (!existingBlog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const existingThumbnailUrl = existingBlog.thumbnailUrl;
            if (existingThumbnailUrl) {
                const existingKey = getUploadThingFileKey(existingThumbnailUrl);
                await utApi.deleteFiles([existingKey]);
            }

            await queries.blogs.deleteBlog(id);
            return true;
        }),
});
