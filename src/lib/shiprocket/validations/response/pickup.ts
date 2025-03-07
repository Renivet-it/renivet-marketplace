import { z } from "zod";

export const pickupResponseSchema = z.object({
    pickup_status: z
        .number({
            invalid_type_error: "Pickup status must be a number",
        })
        .int({ message: "Pickup status must be an integer" }),
    response: z.object({
        pickup_scheduled_date: z
            .string({
                invalid_type_error: "Pickup scheduled date must be a string",
            })
            .optional(),
        pickup_token_number: z.string({
            invalid_type_error: "Pickup token number must be a string",
        }),
        status: z
            .number({
                invalid_type_error: "Status must be a number",
            })
            .int({ message: "Status must be an integer" }),
        others: z
            .string({
                invalid_type_error: "Others must be a string",
            })
            .optional(),
        pickup_generated_date: z.object({
            date: z.string({
                invalid_type_error: "Date must be a string",
            }),
            timezone_type: z
                .number({
                    invalid_type_error: "Timezone type must be a number",
                })
                .int({ message: "Timezone type must be an integer" }),
            timezone: z.string({
                invalid_type_error: "Timezone must be a string",
            }),
        }),
        data: z.string({
            invalid_type_error: "Data must be a string",
        }),
    }),
});

export type PickupResponse = z.infer<typeof pickupResponseSchema>;
