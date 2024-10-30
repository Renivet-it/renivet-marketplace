import { z } from "zod";

const convertEmptyStringToNull = (data: unknown) => {
    return typeof data === "string" && data === "" ? null : data;
};

export const contactUsSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .uuid("ID is invalid"),
    name: z
        .string({
            required_error: "Name is required",
            invalid_type_error: "Name must be a string",
        })
        .min(3, "Name must be at least 3 characters long"),
    email: z
        .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
        })
        .email("Invalid email address"),
    phone: z
        .string({
            required_error: "Phone is required",
            invalid_type_error: "Phone must be a string",
        })
        .min(10, "Phone must be at least 10 characters long"),
    company: z.preprocess(
        (data) => convertEmptyStringToNull(data),
        z
            .string({
                required_error: "Company is required",
                invalid_type_error: "Company must be a string",
            })
            .min(3, "Company must be at least 3 characters long")
            .nullable()
    ),
    message: z
        .string({
            required_error: "Message is required",
            invalid_type_error: "Message must be a string",
        })
        .min(10, "Message must be at least 10 characters long"),
    createdAt: z.date({
        required_error: "Created at is required",
        invalid_type_error: "Created at must be a date",
    }),
});

export const createContactUsSchema = contactUsSchema.omit({
    id: true,
    createdAt: true,
});

export type ContactUs = z.infer<typeof contactUsSchema>;
export type CreateContactUs = z.infer<typeof createContactUsSchema>;
