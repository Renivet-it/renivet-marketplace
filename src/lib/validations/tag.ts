import { z } from "zod";

export const tagSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(3, "Name must be at least 3 characters long"),
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(3, "Slug must be at least 3 characters long"),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const tagWithBlogTagsSchema = tagSchema.extend({
    blogTags: z
        .object({
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
                .uuid("Blog ID is invalid"),
            tagId: z
                .string({
                    required_error: "Tag ID is required",
                    invalid_type_error: "Tag ID must be a string",
                })
                .uuid("Tag ID is invalid"),
            createdAt: z.date({
                required_error: "Created at is required",
                invalid_type_error: "Created at must be a date",
            }),
            updatedAt: z.date({
                required_error: "Updated at is required",
                invalid_type_error: "Updated at must be a date",
            }),
        })
        .array(),
});

export const createTagSchema = tagSchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
});

export const updateTagSchema = createTagSchema;

export type Tag = z.infer<typeof tagSchema>;
export type CreateTag = z.infer<typeof createTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type TagWithBlogTags = z.infer<typeof tagWithBlogTagsSchema>;
