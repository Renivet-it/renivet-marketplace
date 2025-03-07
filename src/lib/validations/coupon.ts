import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import {
    categorySchema,
    productTypeSchema,
    subCategorySchema,
} from "./category";

export const couponSchema = z.object({
    code: z
        .string({
            required_error: "Code is required",
            invalid_type_error: "Code must be a string",
        })
        .min(3, "Code must be at least 3 characters long"),
    description: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Description must be a string",
            })
            .nullable()
    ),
    discountType: z.enum(["percentage", "fixed"], {
        required_error: "Discount type is required",
        invalid_type_error:
            "Discount type must be either 'percentage' or 'fixed'",
    }),
    discountValue: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number({
                    required_error: "Discount value is required",
                    invalid_type_error: "Discount value must be a number",
                })
                .int("Discount value must be an integer")
                .nonnegative("Discount value must be a positive number")
        )
        .default(0),
    minOrderAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number()
                .int("Minimum order amount must be an integer")
                .nonnegative("Minimum order amount must be a positive number")
        )
        .default(0),
    maxDiscountAmount: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .pipe(
            z
                .number()
                .int("Maximum discount amount must be an integer")
                .nonnegative(
                    "Maximum discount amount must be a positive number"
                )
        )
        .nullable(),
    categoryId: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Category ID must be a string",
            })
            .uuid("Category ID is invalid")
            .nullable()
    ),
    subCategoryId: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Sub-category ID must be a string",
            })
            .uuid("Sub-category ID is invalid")
            .nullable()
    ),
    productTypeId: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Product type ID must be a string",
            })
            .uuid("Product type ID is invalid")
            .nullable()
    ),
    expiresAt: z
        .union([z.string(), z.date()], {
            required_error: "Expires at is required",
            invalid_type_error: "Expires at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    maxUses: z
        .number({
            required_error: "Max uses is required",
            invalid_type_error: "Max uses must be a positive number",
        })
        .int("Max uses must be an integer")
        .nonnegative("Max uses must be a positive number"),
    uses: z
        .number({
            required_error: "Uses is required",
            invalid_type_error: "Uses must be a number",
        })
        .nonnegative("Uses must be a positive number"),
    isActive: z.boolean({
        required_error: "Is active is required",
        invalid_type_error: "Is active must be a boolean",
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

export const createCouponSchema = couponSchema.omit({
    isActive: true,
    uses: true,
    createdAt: true,
    updatedAt: true,
});

export const updateCouponSchema = couponSchema.omit({
    code: true,
    categoryId: true,
    subCategoryId: true,
    productTypeId: true,
    discountType: true,
    uses: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
});

export const updateCouponStatusSchema = couponSchema.pick({
    isActive: true,
});

export const couponWithCategorySchema = couponSchema.extend({
    category: categorySchema.nullable(),
    subCategory: subCategorySchema.nullable(),
    productType: productTypeSchema.nullable(),
});

export type Coupon = z.infer<typeof couponSchema>;
export type CreateCoupon = z.infer<typeof createCouponSchema>;
export type UpdateCoupon = z.infer<typeof updateCouponSchema>;
export type UpdateCouponStatus = z.infer<typeof updateCouponStatusSchema>;
export type CouponWithCategory = z.infer<typeof couponWithCategorySchema>;
