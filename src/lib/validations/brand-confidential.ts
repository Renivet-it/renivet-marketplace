import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";

export const brandConfidentialSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
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
    addressLine1: z
        .string({
            required_error: "Address Line 1 is required",
            invalid_type_error: "Address Line 1 must be a string",
        })
        .min(1, "Address Line 1 must be at least 1 characters long"),
    addressLine2: z.string({
        required_error: "Address Line 2 is required",
        invalid_type_error: "Address Line 2 must be a string",
    }),
    city: z
        .string({
            required_error: "City is required",
            invalid_type_error: "City must be a string",
        })
        .min(1, "City must be at least 1 characters long"),
    state: z
        .string({
            required_error: "State is required",
            invalid_type_error: "State must be a string",
        })
        .min(1, "State must be at least 1 characters long"),
    postalCode: z
        .string({
            required_error: "Postal Code is required",
            invalid_type_error: "Postal Code must be a string",
        })
        .min(1, "Postal Code must be at least 1 characters long"),
    country: z
        .string({
            required_error: "Country is required",
            invalid_type_error: "Country must be a string",
        })
        .refine((val) => val === "IN", {
            message: "Country must be 'IN'",
        }),
    verificationStatus: z.enum(["pending", "approved", "rejected"], {
        required_error: "Verification status is required",
        invalid_type_error:
            "Verification status must be either 'pending', 'approved' or 'rejected'",
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

export const createBrandConfidentialSchema = brandConfidentialSchema.omit({
    verificationStatus: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandConfidentialSchema = createBrandConfidentialSchema.omit(
    { id: true }
);

export const linkBrandToRazorpaySchema = brandConfidentialSchema
    .pick({
        authorizedSignatoryName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        pan: true,
        gstin: true,
    })
    .extend({
        id: brandSchema.shape.id,
        name: brandSchema.shape.name,
        email: brandSchema.shape.email,
        phone: brandSchema.shape.phone,
        ownerId: brandSchema.shape.ownerId,
    });

export type BrandConfidential = z.infer<typeof brandConfidentialSchema>;
export type CreateBrandConfidential = z.infer<
    typeof createBrandConfidentialSchema
>;
export type UpdateBrandConfidential = z.infer<
    typeof updateBrandConfidentialSchema
>;
export type LinkBrandToRazorpay = z.infer<typeof linkBrandToRazorpaySchema>;
