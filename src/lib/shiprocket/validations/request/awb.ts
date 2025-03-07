import { z } from "zod";

export const awbSchema = z.object({
    shipment_id: z
        .number({
            required_error: "Shipment ID is required",
            invalid_type_error: "Shipment ID must be a number",
        })
        .int({ message: "Shipment ID must be an integer" }),
    courier_id: z
        .number({
            invalid_type_error: "Courier ID must be a number",
        })
        .int({ message: "Courier ID must be an integer" })
        .optional(),
    status: z
        .string({
            invalid_type_error: "Status must be a string",
        })
        .refine((val) => val === "reassign", {
            message: "Status must be 'reassign' when provided",
        })
        .optional(),
});

export type AWB = z.infer<typeof awbSchema>;
