import { z } from "zod";

export const profileSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is required"),
    userId: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is required"),
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
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export type Profile = z.infer<typeof profileSchema>;
