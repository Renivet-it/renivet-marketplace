import { z } from "zod";

export const orderResponseSchema = z.object({
    order_id: z.number({
        invalid_type_error: "Order ID must be a number",
    }),
    shipment_id: z.number({
        invalid_type_error: "Shipment ID must be a number",
    }),
    status: z.string({
        invalid_type_error: "Status must be a string",
    }),
    status_code: z.number({
        invalid_type_error: "Status code must be a number",
    }),
    onboarding_completed_now: z.number({
        invalid_type_error: "Onboarding completed now must be a number",
    }),
    awb_code: z
        .string({
            invalid_type_error: "AWB code must be a string",
        })
        .nullable(),
    courier_company_id: z
        .number({
            invalid_type_error: "Courier company ID must be a number",
        })
        .nullable(),
    courier_name: z
        .string({
            invalid_type_error: "Courier name must be a string",
        })
        .nullable(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
