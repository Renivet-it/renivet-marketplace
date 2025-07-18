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
           url: z
        .string().optional(),
    isActive: z.boolean({
        required_error: "Is Active is required",
        invalid_type_error: "Is Active must be a boolean",
    }),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a date",
        })
        .transform((v) => new Date(v)),
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

export const cachedBannerSchema = bannerSchema;

export type Banner = z.infer<typeof bannerSchema>;
export type CreateBanner = z.infer<typeof createBannerSchema>;
export type CachedBanner = z.infer<typeof cachedBannerSchema>;
export type UpdateBanner = z.infer<typeof updateBannerSchema>;
