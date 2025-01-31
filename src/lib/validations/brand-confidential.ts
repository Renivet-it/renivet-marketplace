import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";
import { brandSchema } from "./brand";
import { cachedBrandMediaItemSchema } from "./brand-media-item";

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
    bankAccountVerificationDocument: z
        .string({
            required_error: "Bank Account Verification Document is required",
            invalid_type_error:
                "Bank Account Verification Document must be a string",
        })
        .uuid("ID is invalid"),
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
    udyamRegistrationCertificate: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error:
                    "Udyam Registration Certificate URL must be a string",
            })
            .nullable()
    ),
    iecCertificate: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "IEC Certificate URL must be a string",
            })
            .nullable()
    ),
    addressLine1: z
        .string({
            required_error: "Address Line 1 is required",
            invalid_type_error: "Address Line 1 must be a string",
        })
        .min(10, "Address Line 1 must be at least 10 characters long")
        .max(80, "Address Line 1 must be at most 80 characters long"),
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
    isSameAsWarehouseAddress: z.boolean({
        required_error: "Is Same As Warehouse Address is required",
        invalid_type_error: "Is Same As Warehouse Address must be a boolean",
    }),
    warehouseAddressLine1: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse Address Line 1 must be a string",
            })
            .min(
                10,
                "Warehouse Address Line 1 must be at least 10 characters long"
            )
            .max(
                80,
                "Warehouse Address Line 1 must be at most 80 characters long"
            )
            .nullable()
    ),
    warehouseAddressLine2: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse Address Line 2 must be a string",
            })
            .nullable()
    ),
    warehouseCity: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse City must be a string",
            })
            .nullable()
    ),
    warehouseState: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse State must be a string",
            })
            .nullable()
    ),
    warehousePostalCode: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse Postal Code must be a string",
            })
            .nullable()
    ),
    warehouseCountry: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Warehouse Country must be a string",
            })
            .nullable()
    ),
    verificationStatus: z.enum(["pending", "approved", "rejected"], {
        required_error: "Verification status is required",
        invalid_type_error:
            "Verification status must be either 'pending', 'approved' or 'rejected'",
    }),
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

export const brandConfidentialWithBrandSchema = brandConfidentialSchema.extend({
    bankAccountVerificationDocument: cachedBrandMediaItemSchema.nullish(),
    udyamRegistrationCertificate: cachedBrandMediaItemSchema.nullish(),
    iecCertificate: cachedBrandMediaItemSchema.nullish(),
    brand: brandSchema,
});

export const createBrandConfidentialSchema = brandConfidentialSchema
    .omit({
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
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
    })
    .refine(
        (val) =>
            val.isSameAsWarehouseAddress
                ? true
                : val.warehouseAddressLine1 &&
                  val.warehouseAddressLine2 &&
                  val.warehouseCity &&
                  val.warehouseState &&
                  val.warehousePostalCode &&
                  val.warehouseCountry,
        {
            message:
                "Warehouse Address Line 1, Warehouse Address Line 2, Warehouse City, Warehouse State, Warehouse Postal Code, Warehouse Country are required",
            path: ["isSameAsWarehouseAddress"],
        }
    );

export const updateBrandConfidentialByAdminSchema =
    brandConfidentialSchema.omit({
        id: true,
        verificationStatus: true,
        bankAccountVerificationDocument: true,
        iecCertificate: true,
        udyamRegistrationCertificate: true,
        createdAt: true,
        updatedAt: true,
    });

export const updateBrandConfidentialSchema = brandConfidentialSchema
    .omit({
        id: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
    })
    .refine(
        (val) =>
            val.isSameAsWarehouseAddress
                ? true
                : val.warehouseAddressLine1 &&
                  val.warehouseAddressLine2 &&
                  val.warehouseCity &&
                  val.warehouseState &&
                  val.warehousePostalCode &&
                  val.warehouseCountry,
        {
            message:
                "Warehouse Address Line 1, Warehouse Address Line 2, Warehouse City, Warehouse State, Warehouse Postal Code, Warehouse Country are required",
            path: ["isSameAsWarehouseAddress"],
        }
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
export type BrandConfidentialWithBrand = z.infer<
    typeof brandConfidentialWithBrandSchema
>;
export type CreateBrandConfidential = z.infer<
    typeof createBrandConfidentialSchema
>;
export type UpdateBrandConfidentialByAdmin = z.infer<
    typeof updateBrandConfidentialByAdminSchema
>;
export type UpdateBrandConfidential = z.infer<
    typeof updateBrandConfidentialSchema
>;
export type LinkBrandToRazorpay = z.infer<typeof linkBrandToRazorpaySchema>;
