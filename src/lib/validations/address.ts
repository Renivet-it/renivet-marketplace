import { z } from "zod";

export const addressSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    street: z
        .string({
            required_error: "Street is required",
            invalid_type_error: "Street must be a string",
        })
        .min(1, "Street is required"),
    city: z
        .string({
            required_error: "City is required",
            invalid_type_error: "City must be a string",
        })
        .min(1, "City is required")
        .nullable(),
    state: z
        .string({
            required_error: "State is required",
            invalid_type_error: "State must be a string",
        })
        .min(1, "State is required"),
    zip: z
        .string({
            required_error: "Zip is required",
            invalid_type_error: "Zip must be a string",
        })
        .min(1, "Zip is required"),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
    updatedAt: z.date({
        required_error: "Updated at is required",
        invalid_type_error: "Updated at must be a date",
    }),
});

export type Address = z.infer<typeof addressSchema>;
