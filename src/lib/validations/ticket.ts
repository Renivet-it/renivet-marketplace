import { z } from "zod";
import { convertEmptyStringToNull } from "../utils";

export const ticketSchema = z.object({
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

export const createTicketSchema = ticketSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicket = z.infer<typeof createTicketSchema>;
