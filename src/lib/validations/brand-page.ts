import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const brandPageSectionSchema = z.object({
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
    position: z
        .number({
            required_error: "Position is required",
            invalid_type_error: "Position must be a number",
        })
        .int("Position must be an integer")
        .nonnegative("Position must be a non-negative number"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(3, "Name must be at least 3 characters long"),
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Description must be a string",
            })
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

export const brandPageSectionProductSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    brandPageSectionId: z
        .string({
            required_error: "Brand page section ID is required",
            invalid_type_error: "Brand page section ID must be a string",
        })
        .uuid("Brand page section ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
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

export const createBrandPageSectionSchema = brandPageSectionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandPageSectionSchema = brandPageSectionSchema.pick({
    name: true,
    description: true,
    position: true,
});

export const createBrandPageSectionProductSchema =
    brandPageSectionProductSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    });

export const updateBrandPageSectionProductSchema =
    brandPageSectionProductSchema.pick({
        position: true,
    });

export type BrandPageSection = z.infer<typeof brandPageSectionSchema>;
export type BrandPageSectionProduct = z.infer<
    typeof brandPageSectionProductSchema
>;

export type CreateBrandPageSection = z.infer<
    typeof createBrandPageSectionSchema
>;
export type UpdateBrandPageSection = z.infer<
    typeof updateBrandPageSectionSchema
>;

export type CreateBrandPageSectionProduct = z.infer<
    typeof createBrandPageSectionProductSchema
>;
export type UpdateBrandPageSectionProduct = z.infer<
    typeof updateBrandPageSectionProductSchema
>;
