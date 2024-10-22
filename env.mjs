import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
    server: {
        SVIX_SECRET: z
            .string({ required_error: "SVIX_SECRET is required" })
            .min(1, "SVIX_SECRET is required"),

        DATABASE_URL: z
            .string()
            .url("DATABASE_URL is required")
            .regex(/postgres/),

        REDIS_URL: z.string({ required_error: "REDIS_URL is required" }).url(),

        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),
    },
    runtimeEnv: process.env,
    extends: [vercel()],
});
