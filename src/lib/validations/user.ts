import { z } from "zod";
import { profileSchema } from "./profile";

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
    avatarUrl: z
        .string({
            required_error: "Avatar URL is required",
            invalid_type_error: "Avatar URL must be a string",
        })
        .nullable(),
    isVerified: z.boolean({
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

export const userWithProfileSchema = userSchema.extend({
    profile: profileSchema.omit({
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
    }),
});

export const cachedUserSchema = userWithProfileSchema;

export type User = z.infer<typeof userSchema>;
export type UserWithProfile = z.infer<typeof userWithProfileSchema>;
export type CachedUser = z.infer<typeof cachedUserSchema>;
