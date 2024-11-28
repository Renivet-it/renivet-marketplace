import { z } from "zod";
import { brandSchema } from "./brand";

export const brandInviteSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .length(8, "ID must be 8 characters"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    expiresAt: z
        .union([z.string(), z.date()], {
            required_error: "Expires at is required",
            invalid_type_error: "Expires at must be a date",
        })
        .transform((v) => new Date(v))
        .nullable(),
    maxUses: z
        .number({
            required_error: "Max uses is required",
            invalid_type_error: "Max uses must be a positive number",
        })
        .int("Max uses must be an integer")
        .min(0, "Max uses must be a positive number"),
    uses: z.number({
        required_error: "Uses is required",
        invalid_type_error: "Uses must be a number",
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

export const inviteWithBrandSchema = z.lazy(() =>
    brandInviteSchema.extend({
        brand: brandSchema,
    })
);

export const createBrandInviteSchema = brandInviteSchema.omit({
    id: true,
    uses: true,
    createdAt: true,
    updatedAt: true,
});

export type BrandInvite = z.infer<typeof brandInviteSchema>;
export type InviteWithBrand = z.infer<typeof inviteWithBrandSchema>;
export type CreateBrandInvite = z.infer<typeof createBrandInviteSchema>;
