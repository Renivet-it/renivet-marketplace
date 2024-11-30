import { z } from "zod";

export const roleSchema = z.object({
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
        .min(1, "Name is required"),
    slug: z
        .string({
            required_error: "Slug is required",
            invalid_type_error: "Slug must be a string",
        })
        .min(1, "Slug is required"),
    position: z.number({
        required_error: "Position is required",
        invalid_type_error: "Position must be a number",
    }),
    sitePermissions: z.string({
        required_error: "Site permissions is required",
        invalid_type_error: "Site permissions must be a string",
    }),
    brandPermissions: z.string({
        required_error: "Brand permissions is required",
        invalid_type_error: "Brand permissions must be a string",
    }),
    isSiteRole: z.boolean({
        required_error: "Is site role is required",
        invalid_type_error: "Is site role must be a boolean",
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

export const createRoleSchema = roleSchema.omit({
    id: true,
    slug: true,
    isSiteRole: true,
    position: true,
    createdAt: true,
    updatedAt: true,
});

export const updateRoleSchema = createRoleSchema;

export const cachedRoleSchema = roleSchema.extend({
    users: z.number({
        required_error: "Users count is required",
        invalid_type_error: "Users count must be a number",
    }),
    createdAt: z
        .string({
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a string",
        })
        .transform((x) => new Date(x)),
    updatedAt: z
        .string({
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a string",
        })
        .transform((x) => new Date(x)),
});

export const reorderRolesSchema = z.array(
    roleSchema.extend({
        users: z.number({
            required_error: "Users count is required",
            invalid_type_error: "Users count must be a number",
        }),
    })
);

export type Role = z.infer<typeof roleSchema>;
export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type CachedRole = z.infer<typeof cachedRoleSchema>;
export type ReorderRoles = z.infer<typeof reorderRolesSchema>;
