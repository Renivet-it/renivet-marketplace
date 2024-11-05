import { z } from "zod";
import { addressSchema } from "./address";
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
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export const userWithAddressesAndRolesSchema = userSchema.extend({
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
});

export const safeUserSchema = userSchema.omit({
    email: true,
    phone: true,
    isEmailVerified: true,
    isPhoneVerified: true,
});

export const cachedUserSchema = userWithAddressesAndRolesSchema;

export type User = z.infer<typeof userSchema>;
export type UserWithAddressesAndRoles = z.infer<
    typeof userWithAddressesAndRolesSchema
>;
export type CachedUser = z.infer<typeof cachedUserSchema>;
