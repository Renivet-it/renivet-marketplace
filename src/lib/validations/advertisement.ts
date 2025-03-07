import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const advertisementSchema = z.object({
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
    url: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "URL is required",
                invalid_type_error: "URL must be a string",
            })
            .url("URL is invalid")
            .nullable()
    ),
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
    height: z
        .number({
            required_error: "Height is required",
            invalid_type_error: "Height must be a number",
        })
        .int("Height must be an integer")
        .positive("Height must be a positive number"),
    isPublished: z.boolean({
        required_error: "Is Published is required",
        invalid_type_error: "Is Published must be a boolean",
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

export const createAdvertisementSchema = advertisementSchema
    .omit({
        id: true,
        isPublished: true,
        position: true,
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

export const updateAdvertisementSchema = createAdvertisementSchema;

export const updateAdvertisementStatusSchema = advertisementSchema.pick({
    isPublished: true,
});

export type Advertisement = z.infer<typeof advertisementSchema>;
export type CreateAdvertisement = z.infer<typeof createAdvertisementSchema>;
export type UpdateAdvertisement = z.infer<typeof updateAdvertisementSchema>;
export type UpdateAdvertisementStatus = z.infer<
    typeof updateAdvertisementStatusSchema
>;

export const homeBrandProductSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    imageUrl: z
        .string({
            required_error: "Image URL is required",
            invalid_type_error: "Image URL must be a string",
        })
        .url("Image URL is invalid"),
    url: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "URL is required",
                invalid_type_error: "URL must be a string",
            })
            .url("URL is invalid")
            .nullable()
    ),
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
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

export const createHomeBrandProductSchema = homeBrandProductSchema
    .omit({
        id: true,
        position: true,
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

export const updateHomeBrandProductSchema = createHomeBrandProductSchema;

export type HomeBrandProduct = z.infer<typeof homeBrandProductSchema>;
export type CreateHomeBrandProduct = z.infer<
    typeof createHomeBrandProductSchema
>;
export type UpdateHomeBrandProduct = z.infer<
    typeof updateHomeBrandProductSchema
>;

export const homeShopByCategorySchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    imageUrl: z
        .string({
            required_error: "Image URL is required",
            invalid_type_error: "Image URL must be a string",
        })
        .url("Image URL is invalid"),
    url: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "URL is required",
                invalid_type_error: "URL must be a string",
            })
            .url("URL is invalid")
            .nullable()
    ),
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

export const createHomeShopByCategorySchema = homeShopByCategorySchema
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

export const updateHomeShopByCategorySchema = createHomeShopByCategorySchema;

export type HomeShopByCategory = z.infer<typeof homeShopByCategorySchema>;
export type CreateHomeShopByCategory = z.infer<
    typeof createHomeShopByCategorySchema
>;
export type UpdateHomeShopByCategory = z.infer<
    typeof updateHomeShopByCategorySchema
>;
