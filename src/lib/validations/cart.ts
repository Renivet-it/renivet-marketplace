import { z } from "zod";
import { brandSchema } from "./brand";
import { productWithBrandSchema } from "./product";

export const cartSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    userId: z
        .string({
            required_error: "User ID is required",
            invalid_type_error: "User ID must be a string",
        })
        .min(1, "User ID is required"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive"),
    size: z.enum(["One Size", "XS", "S", "M", "L", "XL", "XXL"], {
        required_error: "Size is required",
        invalid_type_error: "Size must be a string",
    }),
    color: z
        .object({
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
        .nullable(),
    status: z.boolean({
        required_error: "Status is required",
        invalid_type_error: "Status must be a boolean",
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

export const createCartSchema = cartSchema.omit({
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
});

export const updateCartSchema = createCartSchema
    .omit({
        userId: true,
        productId: true,
    })
    .extend({
        status: z.boolean({
            required_error: "Status is required",
            invalid_type_error: "Status must be a boolean",
        }),
    });

export const cartWithProductSchema = cartSchema.extend({
    product: productWithBrandSchema.omit({
        categories: true,
    }),
});

export const cachedCartSchema = cartSchema.extend({
    product: productWithBrandSchema
        .omit({
            categories: true,
            colors: true,
            description: true,
            isPublished: true,
        })
        .extend({
            brand: brandSchema.pick({
                id: true,
                ownerId: true,
                name: true,
            }),
        }),
});

export type Cart = z.infer<typeof cartSchema>;
export type CreateCart = z.infer<typeof createCartSchema>;
export type UpdateCart = z.infer<typeof updateCartSchema>;
export type CartWithProduct = z.infer<typeof cartWithProductSchema>;
export type CachedCart = z.infer<typeof cachedCartSchema>;
