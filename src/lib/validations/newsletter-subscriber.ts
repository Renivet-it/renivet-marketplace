import { z } from "zod";

export const newsletterSubscriberSchema = z.object({
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
        .email("Email is invalid"),
    isActive: z.boolean({
        required_error: "Is active is required",
        invalid_type_error: "Is active must be a boolean",
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

export const createNewsletterSubscriberSchema = newsletterSubscriberSchema.omit(
    {
        id: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
    }
);

export type NewsletterSubscriber = z.infer<typeof newsletterSubscriberSchema>;
export type CreateNewsletterSubscriber = z.infer<
    typeof createNewsletterSubscriberSchema
>;
