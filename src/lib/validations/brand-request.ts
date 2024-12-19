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
    message: z
        .string({
            required_error: "Message is required",
            invalid_type_error: "Message must be a string",
        })
        .min(5, "Message must be at least 5 characters long"),
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
    gstin: z
        .string({
            required_error: "GSTIN is required",
            invalid_type_error: "GSTIN must be a string",
        })
        .min(15, "GSTIN must be at least 15 characters long"),
    pan: z
        .string({
            required_error: "PAN is required",
            invalid_type_error: "PAN must be a string",
        })
        .min(10, "PAN must be at least 10 characters long"),
    bankName: z
        .string({
            required_error: "Bank Name is required",
            invalid_type_error: "Bank Name must be a string",
        })
        .min(1, "Bank Name must be at least 1 characters long"),
    bankAccountHolderName: z
        .string({
            required_error: "Bank Account Holder Name is required",
            invalid_type_error: "Bank Account Holder Name must be a string",
        })
        .min(1, "Bank Account Holder Name must be at least 1 characters long"),
    bankAccountNumber: z
        .string({
            required_error: "Bank Account Number is required",
            invalid_type_error: "Bank Account Number must be a string",
        })
        .min(1, "Bank Account Number must be at least 1 characters long"),
    bankIfscCode: z
        .string({
            required_error: "Bank IFSC Code is required",
            invalid_type_error: "Bank IFSC Code must be a string",
        })
        .min(1, "Bank IFSC Code must be at least 1 characters long"),
    bankAccountVerificationDocumentUrl: z
        .string({
            required_error:
                "Bank Account Verification Document URL is required",
            invalid_type_error:
                "Bank Account Verification Document URL must be a string",
        })
        .url("Bank Account Verification Document URL is invalid"),
    authorizedSignatoryName: z
        .string({
            required_error: "Authorized Signatory Name is required",
            invalid_type_error: "Authorized Signatory Name must be a string",
        })
        .min(1, "Authorized Signatory Name must be at least 1 characters long"),
    authorizedSignatoryEmail: z
        .string({
            required_error: "Authorized Signatory Email is required",
            invalid_type_error: "Authorized Signatory Email must be a string",
        })
        .email("Authorized Signatory Email is invalid"),
    authorizedSignatoryPhone: z
        .string({
            required_error: "Authorized Signatory Phone is required",
            invalid_type_error: "Authorized Signatory Phone must be a string",
        })
        .min(
            10,
            "Authorized Signatory Phone must be at least 10 characters long"
        ),
    udyamRegistrationCertificateUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error:
                    "UDYAM Registration Certificate URL must be a string",
            })
            .url("UDYAM Registration Certificate URL is invalid")
            .nullable()
    ),
    iecCertificateUrl: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "IEC Certificate URL must be a string",
            })
            .url("IEC Certificate URL is invalid")
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

export const brandRequestConfidentialsSchema = brandRequestSchema.pick({
    gstin: true,
    pan: true,
    bankName: true,
    bankAccountHolderName: true,
    bankAccountNumber: true,
    bankIfscCode: true,
    bankAccountVerificationDocumentUrl: true,
    authorizedSignatoryName: true,
    authorizedSignatoryEmail: true,
    authorizedSignatoryPhone: true,
    udyamRegistrationCertificateUrl: true,
    iecCertificateUrl: true,
});

export const brandRequestWithoutConfidentialsSchema = brandRequestSchema.omit({
    gstin: true,
    pan: true,
    bankName: true,
    bankAccountHolderName: true,
    bankAccountNumber: true,
    bankIfscCode: true,
    bankAccountVerificationDocumentUrl: true,
    authorizedSignatoryName: true,
    authorizedSignatoryEmail: true,
    authorizedSignatoryPhone: true,
    udyamRegistrationCertificateUrl: true,
    iecCertificateUrl: true,
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
export type BrandRequestWithoutConfidentials = z.infer<
    typeof brandRequestWithoutConfidentialsSchema
>;
export type BrandRequestWithOwner = z.infer<typeof brandRequestWithOwnerSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type UpdateBrandRequestStatus = z.infer<
    typeof updateBrandRequestStatusSchema
>;
export type RejectBrandRequest = z.infer<typeof rejectBrandRequestSchema>;
