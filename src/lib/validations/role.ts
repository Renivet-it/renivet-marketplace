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
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const createRoleSchema = roleSchema.omit({
    id: true,
    slug: true,
    position: true,
    createdAt: true,
    updatedAt: true,
});

export const updateRoleSchema = createRoleSchema.partial();

export const cachedRole = roleSchema.extend({
    users: z.number({
        required_error: "Users count is required",
        invalid_type_error: "Users count must be a number",
    }),
});

export type Role = z.infer<typeof roleSchema>;
export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type CachedRole = z.infer<typeof cachedRole>;
