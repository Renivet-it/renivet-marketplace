import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import {
    blogWithAuthorSchema,
    createBlogSchema,
    updateBlogSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const blogsRouter = createTRPCRouter({
    getBlogs: publicProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const blogs = await db.query.blogs.findMany({
            with: {
                author: true,
            },
        });

        const parsed = blogWithAuthorSchema.array().parse(blogs);
        return parsed;
    }),
    getBlog: publicProcedure
        .input(
            z.object({
                slug: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { slug } = input;

            const blog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.slug, slug),
                with: {
                    author: true,
                },
            });
            if (!blog)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Blog not found",
                });

            const parsed = blogWithAuthorSchema.parse(blog);
            return parsed;
        }),
    createBlog: protectedProcedure
        .input(createBlogSchema)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;

            const blogSlug = slugify(input.title);

            const existingBlog = await db.query.blogs.findFirst({
                where: eq(schemas.blogs.slug, blogSlug),
            });
            if (existingBlog)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Blog already exists",
                });

            const newBlog = await db
                .insert(schemas.blogs)
                .values({
                    ...input,
                    slug: blogSlug,
                    authorId: user.id,
                })
                .returning()
                .then((res) => res[0]);

            return newBlog;
        }),
    updateBlog: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateBlogSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

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
                .set(data)
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
        }),
});
