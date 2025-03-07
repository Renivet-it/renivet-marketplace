import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const marketingStripSchema = z.object({
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
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "Description is required",
                invalid_type_error: "Description must be a string",
            })
            .min(3, "Description must be at least 3 characters long")
            .nullable()
    ),
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

export const createMarketingStripSchema = marketingStripSchema
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

export const updateMarketingStripSchema = createMarketingStripSchema;

export const cachedMarketingStripSchema = marketingStripSchema;

export type MarketingStrip = z.infer<typeof marketingStripSchema>;
export type CreateMarketingStrip = z.infer<typeof createMarketingStripSchema>;
export type UpdateMarketingStrip = z.infer<typeof updateMarketingStripSchema>;
export type CachedMarketingStrip = z.infer<typeof cachedMarketingStripSchema>;
