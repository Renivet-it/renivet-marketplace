import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
    server: {
        CLERK_SECRET_KEY: z
            .string({ required_error: "CLERK_SECRET is required" })
            .min(1, "CLERK_SECRET is required"),

        SVIX_SECRET: z
            .string({ required_error: "SVIX_SECRET is required" })
            .min(1, "SVIX_SECRET is required"),

        DATABASE_URL: z
            .string()
            .url("DATABASE_URL is required")
            .regex(/postgres/),

        REDIS_URL: z.string({ required_error: "REDIS_URL is required" }).url(),

        UPLOADTHING_TOKEN: z
            .string({ required_error: "UPLOADTHING_TOKEN is required" })
            .min(1, "UPLOADTHING_TOKEN is required"),

        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),
    },
    client: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
            .string({
                required_error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required",
            })
            .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
    },
    runtimeEnv: {
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        SVIX_SECRET: process.env.SVIX_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
        NODE_ENV: process.env.NODE_ENV,

        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
    extends: [vercel()],
});
