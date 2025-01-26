import { z } from "zod";

export const brandSubscriptionSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is invalid"),
    planId: z
        .string({
            required_error: "Plan ID is required",
            invalid_type_error: "Plan ID must be a string",
        })
        .min(1, "Plan ID is invalid"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    totalCount: z
        .number({
            required_error: "Total Count is required",
            invalid_type_error: "Total Count must be a number",
        })
        .int("Total Count must be an integer")
        .positive("Total Count must be positive"),
    quantity: z
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number",
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive"),
    startAt: z
        .union([z.string(), z.date()], {
            required_error: "Start At is required",
            invalid_type_error: "Start At must be a date",
        })
        .transform((v) => new Date(v)),
    expireBy: z
        .union([z.string(), z.date()], {
            invalid_type_error: "Expire By must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    customerNotify: z.boolean({
        required_error: "Customer Notify is required",
        invalid_type_error: "Customer Notify must be a boolean",
    }),
    isActive: z.boolean({
        required_error: "Is Active is required",
        invalid_type_error: "Is Active must be a boolean",
    }),
    renewedAt: z
        .union([z.string(), z.date()], {
            invalid_type_error: "Renewed At must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created At is required",
            invalid_type_error: "Created At must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated At is required",
            invalid_type_error: "Updated At must be a date",
        })
        .transform((v) => new Date(v)),
});

export const createBrandSubscriptionSchema = brandSubscriptionSchema.omit({
    isActive: true,
    renewedAt: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandSubscriptionSchema = brandSubscriptionSchema.pick({
    isActive: true,
    renewedAt: true,
});

export const cachedBrandSubscriptionSchema = brandSubscriptionSchema;

export type BrandSubscription = z.infer<typeof brandSubscriptionSchema>;
export type CreateBrandSubscription = z.infer<
    typeof createBrandSubscriptionSchema
>;
export type UpdateBrandSubscription = z.infer<
    typeof updateBrandSubscriptionSchema
>;
export type CachedBrandSubscription = z.infer<
    typeof cachedBrandSubscriptionSchema
>;
