import { z } from "zod";
import { userSchema } from "./user";

export const passwordSchema = z
    .string()
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s:]).{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    );

export const signUpSchema = z
    .object({
        firstName: userSchema.shape.firstName,
        lastName: userSchema.shape.lastName,
        email: userSchema.shape.email,
        password: passwordSchema,
        confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const signInSchema = z.object({
    email: userSchema.shape.email,
    password: passwordSchema,
});

export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
