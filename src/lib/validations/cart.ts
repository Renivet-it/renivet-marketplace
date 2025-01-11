import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";
import {
    enhancedProductVariantSchema,
    productVariantSchema,
    productWithBrandSchema,
} from "./product";

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
    variantId: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Variant ID must be a string",
            })
            .uuid("Variant ID is invalid")
            .nullable()
    ),
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

export const createCartSchema = cartSchema.pick({
    userId: true,
    productId: true,
    variantId: true,
    quantity: true,
});

export const updateCartSchema = createCartSchema
    .omit({
        userId: true,
        productId: true,
        variantId: true,
    })
    .extend({
        status: z.boolean({
            required_error: "Status is required",
            invalid_type_error: "Status must be a boolean",
        }),
    });

export const cartWithProductSchema = cartSchema.extend({
    product: productWithBrandSchema,
});

export const cachedCartSchema = cartSchema.extend({
    product: productWithBrandSchema
        .pick({
            brand: true,
            brandId: true,
            categoryId: true,
            subcategoryId: true,
            productTypeId: true,
            compareAtPrice: true,
            price: true,
            title: true,
            slug: true,
            id: true,
            media: true,
            variants: true,
            options: true,
            sku: true,
            nativeSku: true,
            quantity: true,
            isActive: true,
            isPublished: true,
            isAvailable: true,
            verificationStatus: true,
            isDeleted: true,
        })
        .extend({
            brand: brandSchema.pick({
                id: true,
                ownerId: true,
                name: true,
            }),
            variants: enhancedProductVariantSchema
                .pick({
                    id: true,
                    sku: true,
                    nativeSku: true,
                    price: true,
                    compareAtPrice: true,
                    quantity: true,
                    image: true,
                    mediaItem: true,
                    productId: true,
                    isDeleted: true,
                    combinations: true,
                })
                .array(),
        }),
    variant: productVariantSchema
        .pick({
            id: true,
            sku: true,
            nativeSku: true,
            isDeleted: true,
            quantity: true,
        })
        .nullable(),
});

export type Cart = z.infer<typeof cartSchema>;
export type CreateCart = z.infer<typeof createCartSchema>;
export type UpdateCart = z.infer<typeof updateCartSchema>;
export type CartWithProduct = z.infer<typeof cartWithProductSchema>;
export type CachedCart = z.infer<typeof cachedCartSchema>;
