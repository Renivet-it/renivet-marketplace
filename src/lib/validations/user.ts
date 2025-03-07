import { z } from "zod";
import { addressSchema } from "./address";
import { brandSchema } from "./brand";
import { roleSchema } from "./role";

export const userSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is required"),
    firstName: z
        .string({
            required_error: "First name is required",
            invalid_type_error: "First name must be a string",
        })
        .min(1, "First name is required"),
    lastName: z
        .string({
            required_error: "Last name is required",
            invalid_type_error: "Last name must be a string",
        })
        .min(1, "Last name is required"),
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
        .min(10, "Phone must be at least 10 characters long")
        .nullable(),
    avatarUrl: z
        .string({
            required_error: "Avatar URL is required",
            invalid_type_error: "Avatar URL must be a string",
        })
        .nullable(),
    isEmailVerified: z.boolean({
        required_error: "Is verified is required",
        invalid_type_error: "Is verified must be a boolean",
    }),
    isPhoneVerified: z.boolean({
        required_error: "Is verified is required",
        invalid_type_error: "Is verified must be a boolean",
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

export const safeUserSchema = userSchema.omit({
    email: true,
    phone: true,
    isEmailVerified: true,
    isPhoneVerified: true,
});

export const userWithAddressesRolesAndBrandSchema = userSchema.extend({
    roles: z.array(
        roleSchema.omit({
            createdAt: true,
            updatedAt: true,
        })
    ),
    addresses: z.array(
        addressSchema.omit({
            createdAt: true,
            updatedAt: true,
        })
    ),
    brand: brandSchema.nullable(),
});

export const cachedUserSchema = userWithAddressesRolesAndBrandSchema;

export const updateUserGeneralSchema = userSchema
    .pick({
        firstName: true,
        lastName: true,
    })
    .partial();

export const updateUserEmailSchema = userSchema.pick({
    email: true,
});
export const updateUserPhoneSchema = z.object({
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long")
        .transform((v) => v.replace(/[^0-9+]/g, "")),
});

export const updateUserRolesSchema = z.object({
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

export type User = z.infer<typeof userSchema>;
export type UserWithAddressesRolesAndBrand = z.infer<
    typeof userWithAddressesRolesAndBrandSchema
>;
export type CachedUser = z.infer<typeof cachedUserSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type UpdateUserGeneral = z.infer<typeof updateUserGeneralSchema>;
export type UpdateUserEmail = z.infer<typeof updateUserEmailSchema>;
export type UpdateUserPhone = z.infer<typeof updateUserPhoneSchema>;
export type UpdateUserRoles = z.infer<typeof updateUserRolesSchema>;
