import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const legalSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    privacyPolicy: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Privacy Policy must be a string",
            })
            .min(1, "Privacy Policy must be at least 1 characters long")
            .nullable()
    ),
    termsOfService: z.preprocess(
        convertEmptyStringToNull,
        z
            .string({
                invalid_type_error: "Terms of Service must be a string",
            })
            .min(1, "Terms of Service must be at least 1 characters long")
            .nullable()
    ),
    ppCreatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Privacy Policy created at is required",
            invalid_type_error: "Privacy Policy created at must be a date",
        })
        .transform((v) => new Date(v)),
    tosCreatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Terms of Service created at is required",
            invalid_type_error: "Terms of Service created at must be a date",
        })
        .transform((v) => new Date(v)),
    ppUpdatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Privacy Policy updated at is required",
            invalid_type_error: "Privacy Policy updated at must be a date",
        })
        .transform((v) => new Date(v)),
    tosUpdatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Terms of Service updated at is required",
            invalid_type_error: "Terms of Service updated at must be a date",
        })
        .transform((v) => new Date(v)),
});

export const createLegalSchema = legalSchema.omit({
    id: true,
    ppCreatedAt: true,
    tosCreatedAt: true,
    ppUpdatedAt: true,
    tosUpdatedAt: true,
});

export const updateLegalSchema = createLegalSchema.extend({
    updated: z.enum(["privacyPolicy", "termsOfService", "all"]).nullable(),
});

export const cachedLegalSchema = legalSchema;

export type Legal = z.infer<typeof legalSchema>;
export type CreateLegal = z.infer<typeof createLegalSchema>;
export type UpdateLegal = z.infer<typeof updateLegalSchema>;
export type CachedLegal = z.infer<typeof cachedLegalSchema>;
