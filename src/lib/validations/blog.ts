import { z } from "zod";
import { tagSchema } from "./tag";
import { safeUserSchema } from "./user";

export const blogSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
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
        .min(3, "Description must be at least 3 characters long")
        .max(255, "Description must be at most 255 characters long"),
    content: z
        .string({
            required_error: "Content is required",
            invalid_type_error: "Content must be a string",
        })
        .min(10, "Content must be at least 10 characters long"),
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
        .min(1, "Author ID is required"),
    isPublished: z.boolean({
        required_error: "Is published is required",
        invalid_type_error: "Is published must be a boolean",
    }),
    publishedAt: z
        .date({
            required_error: "Published at is required",
            invalid_type_error: "Published at must be a date",
        })
        .nullable(),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const createBlogSchema = blogSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        slug: true,
        authorId: true,
    })
    .extend({
        tagIds: z
            .array(
                z
                    .string({
                        required_error: "Tag IDs is required",
                        invalid_type_error: "Tag IDs must be a string",
                    })
                    .uuid("ID is invalid")
            )
            .min(1, "At least one tag is required"),
    })
    .refine(
        (data) => {
            const content = data.content
                .replace(/<p>/g, "")
                .replace(/<\/p>/g, "");
            return content.length >= 10;
        },
        {
            message: "Content must be at least 10 characters long",
            path: ["content"],
        }
    );

export const updateBlogSchema = blogSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        authorId: true,
        isPublished: true,
        publishedAt: true,
    })
    .extend({
        tagIds: z
            .array(
                z
                    .string({
                        required_error: "Tag IDs is required",
                        invalid_type_error: "Tag IDs must be a string",
                    })
                    .uuid("ID is invalid")
            )
            .min(1, "At least one tag is required"),
    });

export const blogToTagsSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    blogId: z
        .string({
            required_error: "Blog ID is required",
            invalid_type_error: "Blog ID must be a string",
        })
        .uuid("ID is invalid"),
    tagId: z
        .string({
            required_error: "Tag ID is required",
            invalid_type_error: "Tag ID must be a string",
        })
        .uuid("ID is invalid"),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
});

export const blogWithAuthorAndTagCountSchema = blogSchema
    .merge(
        z.object({
            author: safeUserSchema.omit({ createdAt: true, updatedAt: true }),
        })
    )
    .merge(
        z.object({
            tags: z.number({
                required_error: "Tags is required",
                invalid_type_error: "Tags must be a number",
            }),
        })
    );

export const blogWithAuthorAndTagSchema =
    blogWithAuthorAndTagCountSchema.extend({
        tags: z.array(tagSchema),
    });

export type Blog = z.infer<typeof blogSchema>;
export type CreateBlog = z.infer<typeof createBlogSchema>;
export type UpdateBlog = z.infer<typeof updateBlogSchema>;
export type BlogToTags = z.infer<typeof blogToTagsSchema>;
export type BlogWithAuthorAndTagCount = z.infer<
    typeof blogWithAuthorAndTagCountSchema
>;
export type BlogWithAuthorAndTag = z.infer<typeof blogWithAuthorAndTagSchema>;
