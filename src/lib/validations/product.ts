import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";
import {
    categorySchema,
    productTypeSchema,
    subCategorySchema,
} from "./category";

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
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(3, "Slug must be at least 3 characters long"),
    description: z
        .string({
            required_error: "Description is required",
            invalid_type_error: "Description must be a string",
        })
        .min(3, "Description must be at least 3 characters long"),
    basePrice: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Amount must be positive")),
    taxRate: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Amount must be positive")),
    price: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(z.number().min(0, "Amount must be positive")),
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
    sustainabilityCertificateUrl: z
        .string({
            required_error: "Sustainability certificate URL is required",
            invalid_type_error:
                "Sustainability certificate URL must be a string",
        })
        .url("Sustainability certificate URL is invalid"),
    isSentForReview: z.boolean({
        required_error: "Review status is required",
        invalid_type_error: "Review status must be a boolean",
    }),
    isAvailable: z.boolean({
        required_error: "Availability is required",
        invalid_type_error: "Availability must be a boolean",
    }),
    isPublished: z.boolean({
        required_error: "Published status is required",
        invalid_type_error: "Published status must be a boolean",
    }),
    isDeleted: z.boolean({
        required_error: "Deleted status is required",
        invalid_type_error: "Deleted status must be a boolean",
    }),
    status: z.enum(["idle", "pending", "approved", "rejected"], {
        required_error: "Status is required",
        invalid_type_error:
            "Status must be one of 'idle', 'pending', 'approved', 'rejected'",
    }),
    rejectionReason: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                required_error: "Rejection reason is required",
                invalid_type_error: "Rejection reason must be a string",
            })
            .nullable()
    ),
    lastReviewedAt: z
        .union([z.string(), z.date()], {
            required_error: "Last reviewed at is required",
            invalid_type_error: "Last reviewed at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
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

export const productVariantSchema = z.object({
    sku: z
        .string({
            required_error: "SKU is required",
            invalid_type_error: "SKU must be a string",
        })
        .min(3, "SKU must be at least 3 characters long"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    size: z
        .string({
            required_error: "Size is required",
            invalid_type_error: "Size must be a string",
        })
        .min(1, "Size must be at least 1 characters long"),
    color: z.object({
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
            .length(7, "Color hex must be 7 characters long")
            .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    }),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .min(0, "Quantity must be a positive number"),
    isAvailable: z.boolean({
        required_error: "Availability is required",
        invalid_type_error: "Availability must be a boolean",
    }),
    isDeleted: z.boolean({
        required_error: "Deleted status is required",
        invalid_type_error: "Deleted status must be a boolean",
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
    variants: z.array(productVariantSchema),
    categories: z.array(
        z.object({
            id: z
                .string({
                    required_error: "ID is required",
                    invalid_type_error: "ID must be a string",
                })
                .uuid("ID is invalid"),
            category: categorySchema.pick({
                id: true,
                name: true,
            }),
            subcategory: subCategorySchema.pick({
                id: true,
                name: true,
                categoryId: true,
            }),
            productType: productTypeSchema.pick({
                id: true,
                name: true,
                categoryId: true,
                subCategoryId: true,
            }),
        })
    ),
});

export const createProductSchema = productSchema
    .omit({
        id: true,
        slug: true,
        isAvailable: true,
        status: true,
        isDeleted: true,
        isPublished: true,
        isSentForReview: true,
        rejectionReason: true,
        lastReviewedAt: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        sustainabilityCertificateUrl: z.preprocess(
            convertEmptyStringToNull,
            z
                .string({
                    invalid_type_error:
                        "Sustainability certificate URL must be a string",
                })
                .nullable()
        ),
        variants: z
            .array(
                productVariantSchema.pick({
                    sku: true,
                    color: true,
                    size: true,
                    quantity: true,
                })
            )
            .min(1, "At least one variant is required"),
    });

export const updateProductSchema = createProductSchema
    .omit({
        brandId: true,
        name: true,
        description: true,
    })
    .extend({
        isAvailable: productSchema.shape.isAvailable,
        isPublished: productSchema.shape.isPublished,
    });

export const rejectProductSchema = productSchema.pick({
    id: true,
    rejectionReason: true,
});

export const categorizeProductSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    productId: z
        .string({
            required_error: "Product ID is required",
            invalid_type_error: "Product ID must be a string",
        })
        .uuid("Product ID is invalid"),
    categoryId: z
        .string({
            required_error: "Category ID is required",
            invalid_type_error: "Category ID must be a string",
        })
        .uuid("Category ID is invalid"),
    subcategoryId: z
        .string({
            required_error: "Subcategory ID is required",
            invalid_type_error: "Subcategory ID must be a string",
        })
        .uuid("Subcategory ID is invalid"),
    productTypeId: z
        .string({
            required_error: "Product Type ID is required",
            invalid_type_error: "Product Type ID must be a string",
        })
        .uuid("Product Type ID is invalid"),
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

export const createCategorizeProductSchema = z
    .object({
        productId: categorizeProductSchema.shape.productId,
        categories: z.array(
            z.object({
                id: z.string(),
                categoryId: categorizeProductSchema.shape.categoryId,
                subcategoryId: categorizeProductSchema.shape.subcategoryId,
                productTypeId: categorizeProductSchema.shape.productTypeId,
            })
        ),
    })
    .refine(
        (v) => {
            const seen = new Set();
            return v.categories.every((category) => {
                const key = `${category.categoryId}-${category.subcategoryId}-${category.productTypeId}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
        {
            message: "Duplicate category combinations are not allowed",
            path: ["categories"],
        }
    );

export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductWithBrand = z.infer<typeof productWithBrandSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type RejectProduct = z.infer<typeof rejectProductSchema>;
export type CategorizeProduct = z.infer<typeof categorizeProductSchema>;
export type CreateCategorizeProduct = z.infer<
    typeof createCategorizeProductSchema
>;
