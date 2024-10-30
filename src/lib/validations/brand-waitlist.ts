import { z } from "zod";

export const brandWaitlistSchema = z.object({
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
        .min(1, "Name must be at least 1 characters long"),
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email("Email is invalid"),
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long"),
    brandName: z
        .string({
            required_error: "Brand Name is required",
            invalid_type_error: "Brand Name must be a string",
        })
        .min(1, "Brand Name must be at least 1 characters long"),
    brandEmail: z
        .string({
            required_error: "Brand Email is required",
            invalid_type_error: "Brand Email must be a string",
        })
        .email("Brand Email is invalid"),
    brandPhone: z
        .string({
            required_error: "Brand Phone is required",
            invalid_type_error: "Brand Phone must be a string",
        })
        .min(10, "Brand Phone must be at least 10 characters long")
        .nullable(),
    brandWebsite: z
        .string({
            required_error: "Brand Website is required",
            invalid_type_error: "Brand Website must be a string",
        })
        .url("Brand Website is invalid")
        .nullable(),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const createBrandWaitlistSchema = brandWaitlistSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type BrandWaitlist = z.infer<typeof brandWaitlistSchema>;
export type CreateBrandWaitlist = z.infer<typeof createBrandWaitlistSchema>;
