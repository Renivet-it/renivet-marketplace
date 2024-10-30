import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { hasPermission, slugify } from "@/lib/utils";
import {
    blogWithAuthorAndTagSchema,
    createBlogSchema,
    updateBlogSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

export const blogsRouter = createTRPCRouter({
    getBlogs: publicProcedure
        .input(
            z.object({
                tagId: z.string().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { db, schemas } = ctx;
            const { tagId } = input;

            const blogs = await db.query.blogs.findMany({
                with: {
                    author: true,
                    tags: {
                        where: tagId
                            ? eq(schemas.blogTags.tagId, tagId)
                            : undefined,
                        with: {
                            tag: true,
                        },
                    },
                },
            });

            const parsed = blogWithAuthorAndTagSchema.array().parse(blogs);
            return parsed;
        }),
    getBlog: publicProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                    tagId: z.string().optional(),
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
                })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, slug, tagId } = input;

            const blog = await db.query.blogs.findFirst({
                where: or(
                    id ? eq(schemas.blogs.id, id) : undefined,
                    slug ? eq(schemas.blogs.slug, slug) : undefined
                ),
                with: {
                    author: true,
                    tags: {
                        where: tagId
                            ? eq(schemas.blogTags.tagId, tagId)
                            : undefined,
                        with: {
                            tag: true,
                        },
                    },
                },
            });
            if (!blog || (tagId && blog.tags.length === 0))
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const parsed = blogWithAuthorAndTagSchema.parse(blog);
            return parsed;
        }),
    createBlog: protectedProcedure
        .input(createBlogSchema)
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;

            const blogSlug = slugify(input.title);

            const existingTags = await db.query.blogTags.findMany({
                where: inArray(schemas.blogTags.id, input.tagIds),
            });

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

            const existingBlog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.slug, blogSlug),
            });
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
                        slug: blogSlug,
                        authorId: user.id,
                    })
                    .returning()
                    .then((res) => res[0]);

                await tx.insert(schemas.blogTags).values(
                    input.tagIds.map((tagId) => ({
                        blogId: blog.id,
                        tagId,
                    }))
                );

                return blog;
            });

            return newBlog;
        }),
    updateBlog: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    slug: z.string().optional(),
                    data: updateBlogSchema,
                })
                .refine((input) => input.id || input.slug, {
                    message: "ID or slug is required",
                    path: ["id", "slug"],
                })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOGS,
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
            const { id, slug, data } = input;

            const blog = await db.query.blogs.findFirst({
                where: or(
                    id ? eq(schemas.blogs.id, id) : undefined,
                    slug ? eq(schemas.blogs.slug, slug) : undefined
                ),
                with: {
                    tags: true,
                },
            });
            if (!blog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            if (data.tagIds) {
                const existingTags = await db.query.blogTags.findMany({
                    where: inArray(schemas.blogTags.id, data.tagIds),
                });

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
            }

            const updatedBlog = await db
                .update(schemas.blogs)
                .set(data)
                .where(eq(schemas.blogs.id, blog.id))
                .returning()
                .then((res) => res[0]);

            return updatedBlog;
        }),
    changePublishStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                isPublished: z.boolean(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOGS,
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
            const { id, isPublished } = input;

            const blog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.id, id),
            });
            if (!blog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const updatedBlog = await db
                .update(schemas.blogs)
                .set({
                    isPublished,
                    publishedAt: isPublished ? new Date() : null,
                })
                .where(eq(schemas.blogs.id, id))
                .returning()
                .then((res) => res[0]);

            return updatedBlog;
        }),
    deleteBlog: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOGS,
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

            const blog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.id, id),
            });
            if (!blog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            await db.delete(schemas.blogs).where(eq(schemas.blogs.id, id));

            return true;
        }),
});
