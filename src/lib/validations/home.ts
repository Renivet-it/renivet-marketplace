import { z } from "zod";

export const bannerSchema = z.object({
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
    description: z
        .string({
            required_error: "Description is required",
            invalid_type_error: "Description must be a string",
        })
        .min(3, "Description must be at least 3 characters long"),
    imageUrl: z
        .string({
            required_error: "Image URL is required",
            invalid_type_error: "Image URL must be a string",
        })
        .url("Image URL is invalid"),
    isActive: z.boolean({
        required_error: "Is Active is required",
        invalid_type_error: "Is Active must be a boolean",
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

export const createBannerSchema = bannerSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        imageUrl: z
            .string({
                required_error: "Image URL is required",
                invalid_type_error: "Image URL must be a string",
            })
            .nullable(),
    });

export const updateBannerSchema = createBannerSchema;

export const cachedBannerSchema = bannerSchema.extend({
    createdAt: z
        .string({
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a string",
        })
        .transform((x) => new Date(x)),
    updatedAt: z
        .string({
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a string",
        })
        .transform((x) => new Date(x)),
});

export type Banner = z.infer<typeof bannerSchema>;
export type CreateBanner = z.infer<typeof createBannerSchema>;
export type CachedBanner = z.infer<typeof cachedBannerSchema>;
export type UpdateBanner = z.infer<typeof updateBannerSchema>;
