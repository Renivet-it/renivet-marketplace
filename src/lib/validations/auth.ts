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

export const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 characters long"),
});

export const updatePasswordSchema = z
    .object({
        currentPassword: passwordSchema,
        newPassword: passwordSchema,
        confirmPassword: passwordSchema,
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const forgotPasswordS1Schema = z.object({
    email: userSchema.shape.email,
});

export const forgotPasswordS2Schema = z
    .object({
        otp: otpSchema.shape.otp,
        password: passwordSchema,
        confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type OTP = z.infer<typeof otpSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type ForgotPasswordS1 = z.infer<typeof forgotPasswordS1Schema>;
export type ForgotPasswordS2 = z.infer<typeof forgotPasswordS2Schema>;
