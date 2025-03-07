import { z } from "zod";
import { convertEmptyStringToNull, convertUndefinedToNull } from "../utils";

export const brandMediaItemSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    url: z
        .string({
            required_error: "Media URL is required",
            invalid_type_error: "Media URL must be a string",
        })
        .url("Media URL is invalid"),
    type: z
        .string({
            required_error: "Media type is required",
            invalid_type_error: "Media type must be a string",
        })
        .min(1, "Media type is required"),
    name: z
        .string({
            required_error: "Media name is required",
            invalid_type_error: "Media name must be a string",
        })
        .min(1, "Media name is required"),
    alt: z.preprocess(
        convertUndefinedToNull,
        z.preprocess(
            convertEmptyStringToNull,
            z
                .string({
                    invalid_type_error: "Media alt must be a string",
                })
                .min(1, "Media alt is required")
                .nullable()
        )
    ),
    size: z
        .number({
            required_error: "Media size is required",
            invalid_type_error: "Media size must be a string",
        })
        .int("Media size must be an integer")
        .min(0, "Media size must be greater than or equal to 0"),
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

export const createBrandMediaItemSchema = brandMediaItemSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandMediaItemSchema = brandMediaItemSchema.omit({
    id: true,
    brandId: true,
    createdAt: true,
    updatedAt: true,
});

export const cachedBrandMediaItemSchema = brandMediaItemSchema;

export type BrandMediaItem = z.infer<typeof brandMediaItemSchema>;
export type CreateBrandMediaItem = z.infer<typeof createBrandMediaItemSchema>;
export type UpdateBrandMediaItem = z.infer<typeof updateBrandMediaItemSchema>;
export type CachedBrandMediaItem = z.infer<typeof cachedBrandMediaItemSchema>;
