import { z } from "zod";

export const labelSchema = z.object({
    shipment_id: z
        .number({
            required_error: "Shipment ID is required",
            invalid_type_error: "Shipment ID must be a number",
        })
        .int({ message: "Shipment ID must be an integer" }),
});

export type Label = z.infer<typeof labelSchema>;
