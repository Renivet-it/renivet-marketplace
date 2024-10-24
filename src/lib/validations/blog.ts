import { z } from "zod";
import { safeUserSchema } from "./user";

export const blogSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .length(32, "ID must be 32 characters long"),
    title: z
        .string({
            required_error: "Title is required",
            invalid_type_error: "Title must be a string",
        })
        .min(3, "Title must be at least 3 characters long"),
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(3, "Slug must be at least 3 characters long"),
    description: z
        .string({
            required_error: "Description is required",
            invalid_type_error: "Description must be a string",
        })
        .min(3, "Description must be at least 3 characters long"),
    content: z
        .string({
            required_error: "Content is required",
            invalid_type_error: "Content must be a string",
        })
        .min(3, "Content must be at least 3 characters long"),
    thumbnailUrl: z
        .string({
            required_error: "Thumbnail URL is required",
            invalid_type_error: "Thumbnail URL must be a string",
        })
        .url("Thumbnail URL is invalid")
        .nullable(),
    authorId: z
        .string({
            required_error: "Author ID is required",
            invalid_type_error: "Author ID must be a string",
        })
        .length(32, "Author ID must be 32 characters long"),
    isPublished: z.boolean({
        required_error: "Is published is required",
        invalid_type_error: "Is published must be a boolean",
    }),
    publishedAt: z.date({
        required_error: "Published at is required",
        invalid_type_error: "Published at must be a date",
    }),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const createBlogSchema = blogSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    slug: true,
    authorId: true,
});

export const updateBlogSchema = blogSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        authorId: true,
    })
    .partial();

export const blogWithAuthorSchema = blogSchema.merge(
    z.object({
        author: safeUserSchema,
    })
);

export type Blog = z.infer<typeof blogSchema>;
export type CreateBlog = z.infer<typeof createBlogSchema>;
