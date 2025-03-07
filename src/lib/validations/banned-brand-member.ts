import { convertEmptyStringToNull } from "@/lib/utils";
import { z } from "zod";
import { safeUserSchema } from "./user";

export const bannedBrandMemberSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    memberId: z
        .string({
            required_error: "Member ID is required",
            invalid_type_error: "Member ID must be a string",
        })
        .min(1, "Member ID is required"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    reason: z
        .preprocess(
            convertEmptyStringToNull,
            z
                .string({
                    required_error: "Reason is required",
                    invalid_type_error: "Reason must be a string",
                })
                .min(3, "Reason must be at least 3 characters long")
        )
        .nullable(),
    bannedAt: z
        .union([z.string(), z.date()], {
            required_error: "Banned at is required",
            invalid_type_error: "Banned at must be a date",
        })
        .transform((v) => new Date(v)),
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

export const createdBannedBrandMemberSchema = bannedBrandMemberSchema.omit({
    id: true,
    bannedAt: true,
    createdAt: true,
    updatedAt: true,
});

export const bannedBrandMemberWithMemberSchema = z.lazy(() =>
    bannedBrandMemberSchema.extend({
        member: safeUserSchema,
    })
);

export type BannedBrandMember = z.infer<typeof bannedBrandMemberSchema>;
export type CreatedBannedBrandMember = z.infer<
    typeof createdBannedBrandMemberSchema
>;
export type BannedBrandMemberWithMember = z.infer<
    typeof bannedBrandMemberWithMemberSchema
>;
