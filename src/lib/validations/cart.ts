import { z } from "zod";
import { brandSchema } from "./brand";
import { productVariantSchema, productWithBrandSchema } from "./product";

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
    sku: z
        .string({
            required_error: "SKU is required",
            invalid_type_error: "SKU must be a string",
        })
        .min(1, "SKU is required"),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive"),
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

export const createCartSchema = cartSchema
    .pick({
        userId: true,
        sku: true,
        quantity: true,
    })
    .extend({
        sku: z
            .string({
                required_error: "Missing color or size",
                invalid_type_error: "SKU must be a string",
            })
            .min(1, "Missing color or size"),
    });

export const updateCartSchema = createCartSchema
    .omit({
        userId: true,
        sku: true,
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
    size: productVariantSchema.shape.size,
    color: productVariantSchema.shape.color,
    item: productWithBrandSchema
        .omit({
            categories: true,
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
