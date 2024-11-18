import {
    BlogWithAuthorAndTag,
    BlogWithAuthorAndTagCount,
    blogWithAuthorAndTagCountSchema,
    blogWithAuthorAndTagSchema,
    UpdateBlog,
} from "@/lib/validations";
import { and, desc, eq, ilike, inArray, ne } from "drizzle-orm";
import { db } from "..";
import { blogs, blogTags, users } from "../schema";

class BlogQuery {
    async getBlogs({
        limit,
        page,
        search,
        isPublished,
    }: {
        limit: number;
        page: number;
        search?: string;
        isPublished?: boolean;
    }) {
        const data = await db.query.blogs.findMany({
            where: and(
                isPublished !== undefined
                    ? eq(blogs.isPublished, isPublished)
                    : undefined,
                !!search?.length ? ilike(blogs.title, `%${search}%`) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [
                isPublished ? desc(blogs.publishedAt) : desc(blogs.createdAt),
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
                count: db
                    .$count(
                        blogs,
                        and(
                            isPublished !== undefined
                                ? eq(blogs.isPublished, isPublished)
                                : undefined,
                            !!search?.length
                                ? ilike(blogs.title, `%${search}%`)
                                : undefined
                        )
                    )
                    .as("blog_count"),
            },
        });

        const parsed: BlogWithAuthorAndTagCount[] = data.map(
            ({ tags, ...rest }) =>
                blogWithAuthorAndTagCountSchema.parse({
                    ...rest,
                    tags: tags.length,
                })
        );

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBlogsByTag({
        tagId,
        limit,
        page,
        search,
        isPublished,
    }: {
        tagId: string;
        limit: number;
        page: number;
        search?: string;
        isPublished?: boolean;
    }) {
        const [data, count] = await Promise.all([
            db
                .select()
                .from(blogs)
                .leftJoin(blogTags, eq(blogs.id, blogTags.blogId))
                .leftJoin(users, eq(blogs.authorId, users.id))
                .limit(limit)
                .offset((page - 1) * limit)
                .orderBy(
                    isPublished
                        ? desc(blogs.publishedAt)
                        : desc(blogs.createdAt)
                )
                .where(
                    and(
                        eq(blogTags.tagId, tagId),
                        !!search?.length
                            ? ilike(blogs.title, `%${search}%`)
                            : undefined,
                        isPublished !== undefined
                            ? eq(blogs.isPublished, isPublished)
                            : undefined
                    )
                ),
            db.$count(blogTags, eq(blogTags.tagId, tagId)),
        ]);

        const dbBlogTags = await db.query.blogTags.findMany({
            where: inArray(
                blogTags.blogId,
                data.map(({ blogs }) => blogs.id)
            ),
        });

        const mapped: BlogWithAuthorAndTagCount[] = data.map(
            ({ blogs, users }) => ({
                id: blogs.id,
                createdAt: blogs.createdAt,
                updatedAt: blogs.updatedAt,
                title: blogs.title,
                slug: blogs.slug,
                description: blogs.description,
                content: blogs.content,
                thumbnailUrl: blogs.thumbnailUrl,
                authorId: blogs.authorId,
                isPublished: blogs.isPublished,
                publishedAt: blogs.publishedAt,
                tags: dbBlogTags.filter((tag) => tag.blogId === blogs.id)
                    .length,
                author: {
                    id: users!.id,
                    firstName: users!.firstName,
                    lastName: users!.lastName,
                    avatarUrl: users!.avatarUrl,
                },
            })
        );

        return {
            data: mapped,
            count: +count || 0,
        };
    }

    async getOtherBlog(slug: string, id: string) {
        const data = await db.query.blogs.findFirst({
            where: and(eq(blogs.slug, slug), ne(blogs.id, id)),
        });

        return data;
    }

    async getBlog({ id, slug }: { id?: string; slug?: string }) {
        const data = await db.query.blogs.findFirst({
            where: id
                ? eq(blogs.id, id)
                : slug
                  ? eq(blogs.slug, slug)
                  : undefined,
            with: {
                author: true,
                tags: {
                    with: {
                        tag: true,
                    },
                },
            },
        });
        if (!data) return null;

        const parsed: BlogWithAuthorAndTag = blogWithAuthorAndTagSchema.parse({
            ...data,
            tags: data.tags.map((tag) => tag.tag),
        });

        return parsed;
    }

    async updateBlog(
        id: string,
        values: UpdateBlog & {
            slug: string;
        }
    ) {
        const data = await db
            .update(blogs)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(blogs.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBlogStatus(id: string, isPublished: boolean) {
        const data = await db
            .update(blogs)
            .set({
                isPublished,
                publishedAt: isPublished ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(blogs.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBlog(id: string) {
        const data = await db
            .delete(blogs)
            .where(eq(blogs.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const blogQueries = new BlogQuery();
