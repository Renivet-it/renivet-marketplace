import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { safeUserSchema, userSchema } from "./user";

export const brandRequestSchema = z.object({
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
    website: z
        .string({
            required_error: "Website is required",
            invalid_type_error: "Website must be a string",
        })
        .url("Website is invalid"),
    ownerId: z
        .string({
            required_error: "Owner ID is required",
            invalid_type_error: "Owner ID must be a string",
        })
        .min(1, "Owner ID must be at least 1 characters long"),
    demoUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Demo URL must be a string",
            })
            .url("Demo URL is invalid")
            .nullable()
    ),
    message: z
        .string({
            required_error: "Message is required",
            invalid_type_error: "Message must be a string",
        })
        .min(5, "Message must be at least 5 characters long"),
    status: z.enum(["pending", "approved", "rejected"], {
        required_error: "Status is required",
        invalid_type_error:
            "Status must be one of: pending, approved, rejected",
    }),
    rejectionReason: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Rejection Reason must be a string",
            })
            .min(1, "Rejection Reason must be at least 1 characters long")
            .nullable()
    ),
    rejectedAt: z.preprocess(
        convertEmptyStringToNull,
        z
            .date({
                invalid_type_error: "Rejected At must be a date",
            })
            .nullable()
    ),
    createdAt: z.date({
        required_error: "Created At is required",
        invalid_type_error: "Created At must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated At is required",
        invalid_type_error: "Updated At must be a date",
    }),
});

export const brandRequestWithOwnerSchema = brandRequestSchema.extend({
    owner: safeUserSchema.extend({
        email: userSchema.shape.email,
    }),
});

export const createBrandRequestSchema = brandRequestSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    ownerId: true,
    status: true,
    rejectionReason: true,
    rejectedAt: true,
});

export const updateBrandRequestStatusSchema = brandRequestSchema
    .pick({
        status: true,
        rejectionReason: true,
    })
    .extend({
        status: z.enum(["approved", "rejected"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be one of: approved, rejected",
        }),
    });

export type BrandRequest = z.infer<typeof brandRequestSchema>;
export type BrandRequestWithOwner = z.infer<typeof brandRequestWithOwnerSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type UpdateBrandRequestStatus = z.infer<
    typeof updateBrandRequestStatusSchema
>;
