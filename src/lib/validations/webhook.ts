import { z } from "zod";

export const webhookSchema = z.object({
    data: z.any(),
    object: z.literal("event"),
    type: z.enum(["user.created", "user.updated", "user.deleted"]),
});

export const userWebhookSchema = z.object({
    id: z.string(),
    image_url: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email_addresses: z.array(
        z.object({
            email_address: z.string().email(),
            verification: z.object({
                status: z.string(),
            }),
        })
    ),
    phone_numbers: z.array(
        z
            .object({
                phone_number: z.string(),
                verification: z.object({
                    status: z.string(),
                }),
            })
            .optional()
    ),
    created_at: z.number().transform((val) => new Date(val)),
    updated_at: z.number().transform((val) => new Date(val)),
});

export const userDeleteWebhookSchema = z.object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.string(),
});

export const userDeleteSchema = z.object({
    id: z.string(),
});

export type WebhookData = z.infer<typeof webhookSchema>;
export type UserWebhookData = z.infer<typeof userWebhookSchema>;
export type UserDeleteWebhookData = z.infer<typeof userDeleteWebhookSchema>;
export type UserDeleteData = z.infer<typeof userDeleteSchema>;
