import { z } from "zod";
import { roleSchema } from "./role";
import { userSchema } from "./user";

export const brandMemberSchema = z.object({
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
        .min(1, "Member ID must be at least 1 characters long"),
    brandId: z
        .string({
            required_error: "Brand ID is required",
            invalid_type_error: "Brand ID must be a string",
        })
        .uuid("Brand ID is invalid"),
    isOwner: z.boolean({
        required_error: "Is owner is required",
        invalid_type_error: "Is owner must be a boolean",
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

export const brandMemberWithMemberAndRolesSchema = brandMemberSchema.extend({
    member: userSchema,
    roles: z.array(roleSchema),
});

export const createBrandMemberSchema = brandMemberSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateBrandMemberSchema = brandMemberSchema.pick({
    isOwner: true,
});

export const updateMemberRolesSchema = z.object({
    userId: z
        .string({
            required_error: "User ID is required",
            invalid_type_error: "User ID must be a string",
        })
        .min(1, "User ID is required"),
    roleIds: z.array(
        z
            .string({
                required_error: "Role ID is required",
                invalid_type_error: "Role ID must be a string",
            })
            .uuid("Role ID is invalid")
    ),
});

export type BrandMember = z.infer<typeof brandMemberSchema>;
export type BrandMemberWithMemberAndRoles = z.infer<
    typeof brandMemberWithMemberAndRolesSchema
>;
export type CreateBrandMember = z.infer<typeof createBrandMemberSchema>;
export type UpdateBrandMember = z.infer<typeof updateBrandMemberSchema>;
export type UpdateMemberRoles = z.infer<typeof updateMemberRolesSchema>;
