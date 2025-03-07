import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";
import { userSchema } from "./user";

export const categorySchema = z.object({
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
    commissionRate: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number({
                    required_error: "Commission rate is required",
                    invalid_type_error: "Commission rate must be a number",
                })
                .int("Commission rate must be an integer")
                .nonnegative("Commission rate must be a positive number")
        )
        .default(0),
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

export const subCategorySchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    categoryId: z
        .string({
            required_error: "Category ID is required",
            invalid_type_error: "Category ID must be a string",
        })
        .uuid("Category ID is invalid"),
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

export const productTypeSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    categoryId: z
        .string({
            required_error: "Category ID is required",
            invalid_type_error: "Category ID must be a string",
        })
        .uuid("Category ID is invalid"),
    subCategoryId: z
        .string({
            required_error: "Subcategory ID is required",
            invalid_type_error: "Subcategory ID must be a string",
        })
        .uuid("Subcategory ID is invalid"),
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

export const categoryRequestSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    userId: z
        .string({
            required_error: "Requested by user is required",
            invalid_type_error: "Requested by user must be a string",
        })
        .min(3, "Requested by user must be at least 3 characters long"),
    brandId: z
        .string({
            required_error: "Requested by brand is required",
            invalid_type_error: "Requested by brand must be a string",
        })
        .uuid("Requested by brand is invalid"),
    content: z
        .string({
            required_error: "Content is required",
            invalid_type_error: "Content must be a string",
        })
        .min(3, "Content must be at least 3 characters long"),
    status: z.enum(["pending", "approved", "rejected"], {
        required_error: "Status is required",
        invalid_type_error:
            "Status must be one of: pending, approved, rejected",
    }),
    rejectionReason: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Rejection reason must be a string",
            })
            .min(3, "Rejection reason must be at least 3 characters long")
            .nullable()
    ),
    rejectedAt: z.preprocess(
        convertEmptyStringToNull,
        z
            .union([z.string(), z.date()], {
                invalid_type_error: "Rejected at must be a date",
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

export const createCategorySchema = categorySchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
});
export const createSubCategorySchema = subCategorySchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
});
export const createProductTypeSchema = productTypeSchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
});
export const createCategoryRequestSchema = categoryRequestSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    rejectedAt: true,
    rejectionReason: true,
    status: true,
});

export const updateCategorySchema = createCategorySchema;
export const updateSubCategorySchema = createSubCategorySchema;
export const updateProductTypeSchema = createProductTypeSchema;

export const updateCategoryRequestStatusSchema = categoryRequestSchema.pick({
    status: true,
    rejectionReason: true,
});

export const categoryRequestWithBrandAndUserSchema =
    categoryRequestSchema.extend({
        user: z.lazy(() => userSchema),
        brand: z.lazy(() => brandSchema),
    });

export const cachedCategorySchema = categorySchema.extend({
    subCategories: z.number({
        required_error: "Subcategories is required",
        invalid_type_error: "Subcategories must be a number",
    }),
});
export const cachedSubCategorySchema = subCategorySchema.extend({
    productTypes: z.number({
        required_error: "Product types is required",
        invalid_type_error: "Product types must be a number",
    }),
});
export const cachedProductTypeSchema = productTypeSchema;

export type Category = z.infer<typeof categorySchema>;
export type SubCategory = z.infer<typeof subCategorySchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type CategoryRequest = z.infer<typeof categoryRequestSchema>;

export type CreateCategory = z.infer<typeof createCategorySchema>;
export type CreateSubCategory = z.infer<typeof createSubCategorySchema>;
export type CreateProductType = z.infer<typeof createProductTypeSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type UpdateSubCategory = z.infer<typeof updateSubCategorySchema>;
export type UpdateProductType = z.infer<typeof updateProductTypeSchema>;

export type UpdateCategoryRequestStatus = z.infer<
    typeof updateCategoryRequestStatusSchema
>;

export type CategoryRequestWithBrandAndUser = z.infer<
    typeof categoryRequestWithBrandAndUserSchema
>;

export type CachedCategory = z.infer<typeof cachedCategorySchema>;
export type CachedSubCategory = z.infer<typeof cachedSubCategorySchema>;
export type CachedProductType = z.infer<typeof cachedProductTypeSchema>;
