import { z } from "zod";
import { brandRequestSchema } from "./brand-request";

export const brandConfidentials = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    gstin: brandRequestSchema.shape.gstin,
    pan: brandRequestSchema.shape.pan,
    bankName: brandRequestSchema.shape.bankName,
    bankAccountHolderName: brandRequestSchema.shape.bankAccountHolderName,
    bankAccountNumber: brandRequestSchema.shape.bankAccountNumber,
    bankIfscCode: brandRequestSchema.shape.bankIfscCode,
    bankAccountVerificationDocumentUrl:
        brandRequestSchema.shape.bankAccountVerificationDocumentUrl,
    authorizedSignatoryName: brandRequestSchema.shape.authorizedSignatoryName,
    authorizedSignatoryEmail: brandRequestSchema.shape.authorizedSignatoryEmail,
    authorizedSignatoryPhone: brandRequestSchema.shape.authorizedSignatoryPhone,
    udyamRegistrationCertificateUrl:
        brandRequestSchema.shape.udyamRegistrationCertificateUrl,
    iecCertificateUrl: brandRequestSchema.shape.iecCertificateUrl,
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

export const createBrandConfidentialSchema = brandConfidentials.omit({
    createdAt: true,
    updatedAt: true,
});

export const updateBrandConfidentialSchema = createBrandConfidentialSchema.omit(
    {
        id: true,
    }
);

export type BrandConfidential = z.infer<typeof brandConfidentials>;
export type CreateBrandConfidential = z.infer<
    typeof createBrandConfidentialSchema
>;
export type UpdateBrandConfidential = z.infer<
    typeof updateBrandConfidentialSchema
>;
