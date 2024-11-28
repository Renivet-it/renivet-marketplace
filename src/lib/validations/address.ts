import { z } from "zod";

export const addressSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    alias: z
        .string({
            required_error: "Alias is required",
            invalid_type_error: "Alias must be a string",
        })
        .min(1, "Alias is required"),
    aliasSlug: z
        .string({
            required_error: "Alias slug is required",
            invalid_type_error: "Alias slug must be a string",
        })
        .min(1, "Alias slug is required"),
    fullName: z
        .string({
            required_error: "Full name is required",
            invalid_type_error: "Full name must be a string",
        })
        .min(1, "Full name is required"),
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
        .min(1, "City is required"),
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
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long"),
    type: z.enum(["home", "work", "other"], {
        required_error: "Type is required",
        invalid_type_error: "Type must be home, work or other",
    }),
    isPrimary: z.boolean({
        required_error: "Is primary is required",
        invalid_type_error: "Is primary must be a boolean",
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

export const createAddressSchema = addressSchema.omit({
    id: true,
    aliasSlug: true,
    createdAt: true,
    updatedAt: true,
});

export const updateAddressSchema = createAddressSchema;

export type Address = z.infer<typeof addressSchema>;
export type CreateAddress = z.infer<typeof createAddressSchema>;
export type UpdateAddress = z.infer<typeof updateAddressSchema>;
