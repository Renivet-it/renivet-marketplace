import { z } from "zod";
import { userSchema } from "./user";

export const profileSchema = z.object({
    id: userSchema.shape.id,
    userId: userSchema.shape.id,
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone is required")
        .nullable(),
    address: z
        .object({
            street: z.string(),
            city: z.string(),
            state: z.string(),
            zip: z.string(),
        })
        .nullable(),
    isProfileCompleted: z.boolean(),
    createdAt: userSchema.shape.createdAt,
    updatedAt: userSchema.shape.updatedAt,
});

export type Profile = z.infer<typeof profileSchema>;
