import { z } from "zod";
import { brandSchema } from "./brand";
import { productWithBrandSchema } from "./product";

export const wishlistSchema = z.object({
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

export const createWishlistSchema = wishlistSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateWishlistSchema = createWishlistSchema;

export const wishlistWithProductSchema = wishlistSchema.extend({
    product: productWithBrandSchema.omit({
        categories: true,
    }),
});

export const cachedWishlistSchema = wishlistSchema.extend({
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

export type Wishlist = z.infer<typeof wishlistSchema>;
export type CreateWishlist = z.infer<typeof createWishlistSchema>;
export type UpdateWishlist = z.infer<typeof updateWishlistSchema>;
export type WishlistWithProduct = z.infer<typeof wishlistWithProductSchema>;
export type CachedWishlist = z.infer<typeof cachedWishlistSchema>;