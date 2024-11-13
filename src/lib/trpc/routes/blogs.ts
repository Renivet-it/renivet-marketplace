import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey, hasPermission, slugify } from "@/lib/utils";
import {
    blogWithAuthorAndTagSchema,
    createBlogSchema,
    updateBlogSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

const hasBlogManagePermission = isAuth.unstable_pipe(({ ctx, next }) => {
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
});

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
            const { db, schemas } = ctx;
            const { limit, page, tagId, isPublished, search } = input;

            if (!!tagId?.length) {
                const data = await db
                    .select({
                        id: schemas.blogs.id,
                        createdAt: schemas.blogs.createdAt,
                        updatedAt: schemas.blogs.updatedAt,
                        slug: schemas.blogs.slug,
                        title: schemas.blogs.title,
                        description: schemas.blogs.description,
                        content: schemas.blogs.content,
                        thumbnailUrl: schemas.blogs.thumbnailUrl,
                        authorId: schemas.blogs.authorId,
                        isPublished: schemas.blogs.isPublished,
                        publishedAt: schemas.blogs.publishedAt,
                        author: {
                            id: schemas.users.id,
                            firstName: schemas.users.firstName,
                            lastName: schemas.users.lastName,
                            avatarUrl: schemas.users.avatarUrl,
                        },
                        tags: sql<
                            {
                                tag: { id: string; name: string; slug: string };
                            }[]
                        >`
                  COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'tag', JSON_BUILD_OBJECT(
                          'id', ${schemas.tags.id},
                          'name', ${schemas.tags.name},
                          'slug', ${schemas.tags.slug}
                        )
                      )
                    ) FILTER (WHERE ${schemas.tags.id} IS NOT NULL),
                    '[]'
                  )
                `.as("tags"),
                    })
                    .from(schemas.blogs)
                    .innerJoin(
                        schemas.blogTags,
                        eq(schemas.blogs.id, schemas.blogTags.blogId)
                    )
                    .innerJoin(
                        schemas.tags,
                        eq(schemas.blogTags.tagId, schemas.tags.id)
                    )
                    .leftJoin(
                        schemas.users,
                        eq(schemas.blogs.authorId, schemas.users.id)
                    )
                    .where(
                        and(
                            eq(schemas.tags.id, tagId),
                            isPublished
                                ? eq(schemas.blogs.isPublished, true)
                                : undefined,
                            !!search?.length
                                ? ilike(schemas.blogs.title, `%${search}%`)
                                : undefined
                        )
                    )
                    .orderBy(
                        isPublished
                            ? desc(schemas.blogs.publishedAt)
                            : desc(schemas.blogs.createdAt)
                    )
                    .groupBy(schemas.blogs.id, schemas.users.id)
                    .limit(limit)
                    .offset((page - 1) * limit);

                const blogCount = await db
                    .select({
                        count: sql<number>`count(DISTINCT ${schemas.blogs.id})`,
                    })
                    .from(schemas.blogs)
                    .innerJoin(
                        schemas.blogTags,
                        eq(schemas.blogs.id, schemas.blogTags.blogId)
                    )
                    .where(
                        and(
                            eq(schemas.blogTags.tagId, tagId),
                            isPublished
                                ? eq(schemas.blogs.isPublished, true)
                                : undefined,
                            !!search?.length
                                ? ilike(schemas.blogs.title, `%${search}%`)
                                : undefined
                        )
                    )
                    .then((res) => res[0].count);

                const parsed = blogWithAuthorAndTagSchema
                    .merge(
                        z.object({
                            blogCount: z
                                .string()
                                .transform((val) => parseInt(val)),
                        })
                    )
                    .array()
                    .parse(
                        data.map((item) => ({
                            ...item,
                            blogCount,
                        }))
                    );
                return parsed;
            }

            const data = await db.query.blogs.findMany({
                where: and(
                    isPublished !== undefined
                        ? eq(schemas.blogs.isPublished, isPublished)
                        : undefined,
                    !!search?.length
                        ? ilike(schemas.blogs.title, `%${search}%`)
                        : undefined
                ),
                limit,
                offset: (page - 1) * limit,
                orderBy: [
                    isPublished
                        ? desc(schemas.blogs.publishedAt)
                        : desc(schemas.blogs.createdAt),
                ],
                with: {
                    author: true,
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                },
                extras: {
                    blogCount: db.$count(schemas.blogs).as("blog_count"),
                },
            });

            const parsed = blogWithAuthorAndTagSchema
                .merge(
                    z.object({
                        blogCount: z.string().transform((val) => parseInt(val)),
                    })
                )
                .array()
                .parse(data);
            return parsed;
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
            const { db, schemas } = ctx;
            const { id, slug } = input;

            const blog = await db.query.blogs.findFirst({
                where: or(
                    id ? eq(schemas.blogs.id, id) : undefined,
                    slug ? eq(schemas.blogs.slug, slug) : undefined
                ),
                with: {
                    author: true,
                    tags: {
                        with: {
                            tag: true,
                        },
                    },
                },
            });
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
        .use(hasBlogManagePermission)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;

            const blogSlug = slugify(input.title);

            const existingTags = await db.query.tags.findMany({
                where: inArray(schemas.tags.id, input.tagIds),
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
                        publishedAt: input.isPublished ? new Date() : null,
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
            z.object({
                id: z.string(),
                data: updateBlogSchema,
            })
        )
        .use(hasBlogManagePermission)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            const existingBlog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.id, id),
                with: {
                    tags: true,
                },
            });
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

            if (data.tagIds) {
                const existingTags = await db.query.tags.findMany({
                    where: inArray(schemas.tags.id, data.tagIds),
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
                .where(eq(schemas.blogs.id, existingBlog.id))
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
        .use(hasBlogManagePermission)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, isPublished } = input;

            const existingBlog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.id, id),
            });
            if (!existingBlog)
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
                .where(eq(schemas.blogs.id, existingBlog.id))
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
        .use(hasBlogManagePermission)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingBlog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.id, id),
            });
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

            await db
                .delete(schemas.blogs)
                .where(eq(schemas.blogs.id, existingBlog.id));

            return true;
        }),
});
