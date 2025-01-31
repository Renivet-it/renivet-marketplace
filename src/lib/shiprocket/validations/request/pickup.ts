import { z } from "zod";

export const pickupSchema = z.object({
    shipment_id: z
        .number({
            required_error: "Shipment ID is required",
            invalid_type_error: "Shipment ID must be a number",
        })
        .int({ message: "Shipment ID must be an integer" }),
});

export type Pickup = z.infer<typeof pickupSchema>;
