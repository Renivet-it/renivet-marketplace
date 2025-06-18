import { z } from "zod";

export const awbSchema = z.object({
    shipment_id: z.number({
        required_error: "Shipment ID is required",
        invalid_type_error: "Shipment ID must be a number",
    }),
    courier_id: z
        .number({
            invalid_type_error: "Courier ID must be a number",
        })
        .optional(),
    status: z
        .string({
            invalid_type_error: "Status must be a string",
        })
        .optional(),
    is_return: z
        .number({
            invalid_type_error: "return type must be a number",
        })
        .optional(),
});

export type AWB = z.infer<typeof awbSchema>;
