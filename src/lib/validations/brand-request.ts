import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { userSchema } from "./user";

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
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long"),
    message: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Message must be a string",
            })
            .min(1, "Message must be at least 1 characters long")
            .nullable()
    ),
    website: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Website must be a string",
            })
            .regex(
                /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                "Website is invalid"
            )
            .nullable()
    ),
    ownerId: z
        .string({
            required_error: "Owner ID is required",
            invalid_type_error: "Owner ID must be a string",
        })
        .min(1, "Owner ID must be at least 1 characters long"),
    logoUrl: z
        .string({
            required_error: "Logo URL is required",
            invalid_type_error: "Logo URL must be a string",
        })
        .url("Logo URL is invalid"),
    demoUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Demo URL must be a string",
            })
            .url("Demo URL is invalid")
            .nullable()
    ),
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
    hasAcceptedTerms: z.boolean({
        required_error: "Has Accepted Terms is required",
        invalid_type_error: "Has Accepted Terms must be a boolean",
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

export const brandRequestWithOwnerSchema = brandRequestSchema.extend({
    owner: userSchema,
});

export const createBrandRequestSchema = brandRequestSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        status: true,
        rejectionReason: true,
        rejectedAt: true,
    })
    .extend({
        hasAcceptedTerms: z
            .boolean({
                required_error: "Has Accepted Terms is required",
                invalid_type_error: "Has Accepted Terms must be a boolean",
            })
            .refine((value) => value === true, {
                message: "You must accept the terms to proceed",
            }),
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

export const rejectBrandRequestSchema = brandRequestSchema.pick({
    rejectionReason: true,
});

export type BrandRequest = z.infer<typeof brandRequestSchema>;
export type BrandRequestWithOwner = z.infer<typeof brandRequestWithOwnerSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type UpdateBrandRequestStatus = z.infer<
    typeof updateBrandRequestStatusSchema
>;
export type RejectBrandRequest = z.infer<typeof rejectBrandRequestSchema>;
