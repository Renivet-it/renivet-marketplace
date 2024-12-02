import { z } from "zod";
import { brandSchema } from "./brand";

export const productSchema = z.object({
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
    description: z
        .string({
            required_error: "Description is required",
            invalid_type_error: "Description must be a string",
        })
        .min(3, "Description must be at least 3 characters long"),
    price: z
        .string({
            required_error: "Price is required",
            invalid_type_error: "Price must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Price must be a number",
        }),
    sizes: z
        .array(
            z.object({
                name: z.enum(["One Size", "XS", "S", "M", "L", "XL", "XXL"], {
                    required_error: "Size name is required",
                    invalid_type_error: "Size name must be a string",
                }),
                quantity: z
                    .number({
                        required_error: "Size quantity is required",
                        invalid_type_error: "Size quantity must be a number",
                    })
                    .int("Size quantity must be an integer")
                    .min(0, "Size quantity must be a positive number"),
            }),
            {
                invalid_type_error: "Sizes must be an array of objects",
                required_error: "Sizes are required",
            }
        )
        .min(1, "At least one size is required"),
    colors: z.array(
        z.object({
            name: z
                .string({
                    required_error: "Color name is required",
                    invalid_type_error: "Color name must be a string",
                })
                .min(1, "Color name must be at least 1 characters long"),
            hex: z
                .string({
                    required_error: "Color hex is required",
                    invalid_type_error: "Color hex must be a string",
                })
                .length(7, "Color hex must be 7 characters long"),
        })
    ),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    imageUrls: z
        .array(
            z
                .string({
                    required_error: "Image URL is required",
                    invalid_type_error: "Image URL must be a string",
                })
                .url("Image URL is invalid")
        )
        .min(1, "At least one image URL is required"),
    isAvailable: z.boolean({
        required_error: "Availability is required",
        invalid_type_error: "Availability must be a boolean",
    }),
    isPublished: z.boolean({
        required_error: "Published status is required",
        invalid_type_error: "Published status must be a boolean",
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

export const productWithBrandSchema = productSchema.extend({
    brand: brandSchema,
});

export const createProductSchema = productSchema.omit({
    id: true,
    isAvailable: true,
    createdAt: true,
    updatedAt: true,
});

export const updateProductSchema = createProductSchema.omit({
    brandId: true,
});

export type Product = z.infer<typeof productSchema>;
export type ProductWithBrand = z.infer<typeof productWithBrandSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
